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
        console.log('Kullanıcı mesajı alındı:', data);

        // Kullanıcı mesajını kaydet
        const userMessage = new Message({
          userId: socket.user.id,
          username: socket.user.username,
          text: data.text,
          type: 'user',
          timestamp: new Date()
        });
        await userMessage.save();
        console.log('Kullanıcı mesajı kaydedildi:', userMessage);

        // Mesajı tüm kullanıcılara gönder (gönderen dahil)
        const userMessageData = {
          id: userMessage._id,
          userId: userMessage.userId,
          username: userMessage.username,
          text: userMessage.text,
          type: 'user',
          timestamp: userMessage.timestamp
        };
        io.of('/chat').emit('chat:message', userMessageData);
        console.log('Kullanıcı mesajı broadcast edildi:', userMessageData);

        // Eğer repo ve dosya araması isteniyorsa
        let context = '';
        if (data.repoId && data.searchQuery) {
          console.log('Repo araması yapılıyor:', { repoId: data.repoId, searchQuery: data.searchQuery });
          const relevantFiles = await searchVectors(socket.user.id, data.repoId, data.searchQuery);
          if (relevantFiles.length > 0) {
            context = `İlgili dosya içerikleri:\n${relevantFiles.map(f =>
              `${f.filePath}:\n${f.content}\n`
            ).join('\n')}`;
            console.log('İlgili dosyalar bulundu:', relevantFiles.length);
          }
        }

        // Gemini AI yanıtı
        console.log('AI yanıtı oluşturuluyor...');
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Son mesajları al
        const recentMessages = await Message.find({ userId: socket.user.id })
          .sort({ timestamp: -1 })
          .limit(10)
          .lean();

        // Sohbet geçmişini oluştur
        const chatHistory = recentMessages.reverse();

        // İlk mesajın 'user' rolünde olduğundan emin ol
        const formattedHistory = [];
        let foundFirstUserMessage = false;

        for (const msg of chatHistory) {
          if (!foundFirstUserMessage && msg.type === 'user') {
            foundFirstUserMessage = true;
          }

          if (foundFirstUserMessage) {
            formattedHistory.push({
              role: msg.type === 'user' ? 'user' : 'model',
              parts: [{ text: msg.text }]
            });
          }
        }

        console.log('Sohbet geçmişi:', formattedHistory);

        // Chat'i başlat
        const chat = model.startChat({
          history: formattedHistory,
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

        console.log('AI\'ya gönderilen prompt:', prompt);
        const result = await chat.sendMessage(prompt);
        const aiResponse = await result.response;
        console.log('AI yanıtı alındı:', aiResponse.text());

        // AI yanıtını kaydet
        const aiMessage = new Message({
          userId: socket.user.id,
          username: 'AI Assistant',
          text: aiResponse.text(),
          type: 'ai',
          timestamp: new Date()
        });
        await aiMessage.save();
        console.log('AI yanıtı kaydedildi:', aiMessage);

        // AI yanıtını tüm kullanıcılara gönder
        const aiMessageData = {
          id: aiMessage._id,
          userId: aiMessage.userId,
          username: aiMessage.username,
          text: aiMessage.text,
          type: 'ai',
          timestamp: aiMessage.timestamp
        };
        io.of('/chat').emit('chat:message', aiMessageData);
        console.log('AI yanıtı broadcast edildi:', aiMessageData);

      } catch (error) {
        console.error('Mesaj işleme hatası:', error);
        console.error('Hata detayı:', error.stack);
        socket.emit('chat:error', {
          message: 'Mesaj işlenemedi',
          error: error.message
        });
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