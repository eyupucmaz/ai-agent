const express = require('express');
const router = express.Router();
const Vector = require('../models/Vector');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Octokit'i async olarak yükle
let Octokit;
(async () => {
  const { Octokit: OctokitClass } = await import('@octokit/rest');
  Octokit = OctokitClass;
})();

// Gemini API yapılandırması
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Repo indeksleme endpoint'i
router.post('/index/:owner/:repo', auth, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const user = await User.findById(req.user.id);

    // GitHub client'ı oluştur
    const octokit = new Octokit({
      auth: user.accessToken
    });

    // Repo durumunu güncelle
    const repoIndex = user.indexedRepos.findIndex(r => r.owner === owner && r.name === repo);
    if (repoIndex === -1) {
      user.indexedRepos.push({
        owner,
        name: repo,
        status: 'indexing',
        lastIndexed: new Date()
      });
    } else {
      user.indexedRepos[repoIndex].status = 'indexing';
      user.indexedRepos[repoIndex].lastIndexed = new Date();
    }
    await user.save();

    // Repo içeriğini al
    const { data: repoContent } = await octokit.repos.getContent({
      owner,
      repo,
      path: ''
    });

    // Dosyaları işle ve vektörleştir
    for (const file of repoContent) {
      if (file.type === 'file') {
        const { data: fileContent } = await octokit.repos.getContent({
          owner,
          repo,
          path: file.path
        });

        const content = Buffer.from(fileContent.content, 'base64').toString();

        // Gemini ile vektörleştirme
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.embedContent(content);
        const vector = result.embedding;

        // Vektör veritabanına kaydet
        await Vector.findOneAndUpdate(
          { repoId: `${owner}/${repo}`, filePath: file.path },
          {
            content,
            vector,
            metadata: {
              language: file.name.split('.').pop(),
              lastModified: new Date(fileContent.last_modified),
              size: fileContent.size
            }
          },
          { upsert: true }
        );
      }
    }

    // İndeksleme tamamlandı
    const updatedUser = await User.findById(req.user.id);
    const updatedRepoIndex = updatedUser.indexedRepos.findIndex(r => r.owner === owner && r.name === repo);
    updatedUser.indexedRepos[updatedRepoIndex].status = 'completed';
    await updatedUser.save();

    res.json({ message: 'Repo başarıyla indekslendi' });
  } catch (error) {
    console.error('İndeksleme hatası:', error);
    res.status(500).json({ error: 'İndeksleme sırasında bir hata oluştu' });
  }
});

// Vector arama endpoint'i
router.post('/search', auth, async (req, res) => {
  try {
    const { repoId, query } = req.body;

    // Query'yi vektörleştir
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.embedContent(query);
    const queryVector = result.embedding;

    // En yakın vektörleri bul (cosine similarity)
    const vectors = await Vector.find({ repoId });
    const results = vectors.map(doc => {
      const similarity = cosineSimilarity(queryVector, doc.vector);
      return {
        filePath: doc.filePath,
        content: doc.content,
        similarity,
        metadata: doc.metadata
      };
    });

    // Sonuçları benzerliğe göre sırala
    results.sort((a, b) => b.similarity - a.similarity);

    res.json(results.slice(0, 10)); // En iyi 10 sonucu döndür
  } catch (error) {
    console.error('Arama hatası:', error);
    res.status(500).json({ error: 'Arama sırasında bir hata oluştu' });
  }
});

// Cosine similarity hesaplama fonksiyonu
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
  const normB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
  return dotProduct / (normA * normB);
}

// Repo vektörlerini getir
router.get('/:owner/:repo', auth, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const vectors = await Vector.find({ repoId: `${owner}/${repo}` });
    res.json(vectors);
  } catch (error) {
    console.error('Vektör getirme hatası:', error);
    res.status(500).json({ error: 'Vektörler getirilirken bir hata oluştu' });
  }
});

// Repo vektörlerini sil
router.delete('/:owner/:repo', auth, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    await Vector.deleteMany({ repoId: `${owner}/${repo}` });

    // User'dan indekslenen repo bilgisini kaldır
    const user = await User.findById(req.user.id);
    user.indexedRepos = user.indexedRepos.filter(r => !(r.owner === owner && r.name === repo));
    await user.save();

    res.json({ message: 'Repo vektörleri başarıyla silindi' });
  } catch (error) {
    console.error('Silme hatası:', error);
    res.status(500).json({ error: 'Vektörler silinirken bir hata oluştu' });
  }
});

module.exports = router;