const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');
const Message = require('../models/Message');
const Vector = require('../models/Vector');

// Gemini API yapılandırması
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Vektör arama fonksiyonu
async function searchVectors(githubId, repoId, query) {
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(query);
    const queryVector = result.embedding.values;

    const vectors = await Vector.find({ githubId, repoId });
    return vectors.map(doc => {
      const similarity = cosineSimilarity(queryVector, doc.vector);
      return {
        filePath: doc.filePath,
        content: doc.content,
        similarity
      };
    }).sort((a, b) => b.similarity - a.similarity).slice(0, 3);
  } catch (error) {
    console.error('Vektör arama hatası:', error);
    return [];
  }
}

// Cosine similarity hesaplama
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
  const normB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
  return dotProduct / (normA * normB);
}

function setupChatHandlers(io) {
  const chat = io.of('/chat');

  // Auth middleware
  chat.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({ githubId: decoded.id });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = {
        id: user.githubId,
        username: user.username
      };

      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  chat.on('connection', async (socket) => {
    console.log('Yeni kullanıcı bağlandı:', socket.user.username);

    try {
      const userHistory = await Message.find({ userId: socket.user.id })
        .sort({ timestamp: -1 })
        .limit(50)
        .lean();

      socket.emit('chat:history', userHistory.reverse());
    } catch (error) {
      console.error('Mesaj geçmişi getirme hatası:', error);
      socket.emit('chat:error', { message: 'Mesaj geçmişi alınamadı' });
    }

    // AI ile sohbet
    socket.on('chat:message', async (data) => {
      try {
        // Kullanıcı mesajını kaydet
        const userMessage = new Message({
          userId: socket.user.id,
          username: socket.user.username,
          text: data.text,
          type: 'user',
          timestamp: new Date()
        });
        await userMessage.save();

        // Mesajı tüm bağlı kullanıcılara gönder
        chat.emit('chat:message', {
          id: userMessage._id,
          userId: userMessage.userId,
          username: userMessage.username,
          text: userMessage.text,
          type: 'user',
          timestamp: userMessage.timestamp
        });

        // Eğer repo ve dosya araması isteniyorsa
        let context = '';
        if (data.repoId && data.searchQuery) {
          const relevantFiles = await searchVectors(socket.user.id, data.repoId, data.searchQuery);
          if (relevantFiles.length > 0) {
            context = `İlgili dosya içerikleri:\n${relevantFiles.map(f =>
              `${f.filePath}:\n${f.content}\n`
            ).join('\n')}`;
          }
        }

        // Gemini AI yanıtı
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Son mesajları al
        const recentMessages = await Message.find({ userId: socket.user.id })
          .sort({ timestamp: -1 })
          .limit(10)
          .lean();

        // Sohbet geçmişini oluştur
        const chatHistory = recentMessages.reverse()
          .map(msg => ({
            role: msg.type === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          }));

        // Chat'i başlat
        const chat = model.startChat({
          history: chatHistory,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        });

        const prompt = context ?
          `${context}\n\nKullanıcı sorusu: ${data.text}` :
          data.text;

        const result = await chat.sendMessage(prompt);
        const aiResponse = await result.response;

        // AI yanıtını kaydet
        const aiMessage = new Message({
          userId: socket.user.id,
          username: 'AI Assistant',
          text: aiResponse.text(),
          type: 'ai',
          timestamp: new Date()
        });
        await aiMessage.save();

        // AI yanıtını gönder
        chat.emit('chat:message', {
          id: aiMessage._id,
          userId: aiMessage.userId,
          username: aiMessage.username,
          text: aiMessage.text,
          type: 'ai',
          timestamp: aiMessage.timestamp
        });

      } catch (error) {
        console.error('Mesaj işleme hatası:', error);
        socket.emit('chat:error', { message: 'Mesaj işlenemedi' });
      }
    });

    socket.on('chat:typing', (data) => {
      socket.broadcast.emit('chat:typing', {
        username: socket.user.username
      });
    });

    socket.on('disconnect', () => {
      console.log('Kullanıcı ayrıldı:', socket.user.username);
    });
  });
}

module.exports = setupChatHandlers;