const express = require('express');
const router = express.Router();
const Vector = require('../models/Vector');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Gemini API yapılandırması
if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY bulunamadı! Lütfen .env dosyasını kontrol edin.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Vektörleştirme fonksiyonu
async function getEmbedding(text) {
  try {
    // Metni 10000 byte limitine göre kırp
    const truncatedText = text.slice(0, 9000); // Biraz margin bırakıyoruz
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(truncatedText);
    return result.embedding.values;
  } catch (error) {
    console.error('Vektörleştirme hatası:', error);
    throw error;
  }
}

// Octokit'i async olarak yükle
let Octokit;
(async () => {
  const { Octokit: OctokitClass } = await import('@octokit/rest');
  Octokit = OctokitClass;
})();

// Dosya içeriğini işleme fonksiyonu
function processFileContent(content, maxLength = 9000) {
  // Dosya içeriğini satırlara böl
  const lines = content.split('\n');
  let processedContent = '';

  // Maksimum boyuta ulaşana kadar satırları ekle
  for (const line of lines) {
    if ((processedContent + line).length <= maxLength) {
      processedContent += line + '\n';
    } else {
      break;
    }
  }

  return processedContent.trim();
}

// Dosya türü kontrolü
const SUPPORTED_EXTENSIONS = [
  // Programlama dilleri
  'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rb', 'php', 'swift',
  // Web teknolojileri
  'html', 'css', 'scss', 'sass', 'less',
  // Veri formatları
  'json', 'yaml', 'yml', 'xml', 'csv',
  // Dokümantasyon
  'md', 'txt', 'rst', 'doc', 'docx',
  // Konfigürasyon
  'env', 'ini', 'conf', 'config',
  // Shell
  'sh', 'bash', 'zsh', 'fish',
  // Git
  'gitignore', 'gitattributes'
];

function isProcessableFile(filename) {
  const extension = filename.split('.').pop().toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(extension);
}

// Rekürsif olarak dosyaları getir
async function getAllFiles(octokit, owner, repo, path = '') {
  try {
    const { data: contents } = await octokit.repos.getContent({
      owner,
      repo,
      path
    });

    let allFiles = [];

    for (const item of contents) {
      if (item.type === 'file' && item.size < 100000 && isProcessableFile(item.name)) {
        allFiles.push(item);
      } else if (item.type === 'dir') {
        const subFiles = await getAllFiles(octokit, owner, repo, item.path);
        allFiles = allFiles.concat(subFiles);
      }
    }

    return allFiles;
  } catch (error) {
    console.error('Dosya listesi alınırken hata:', {
      path,
      error: error.message
    });
    return [];
  }
}

// İndeksleme durumunu güncelle
async function updateIndexingStatus(user, owner, repo, currentFile, totalFiles, failedFiles = []) {
  const repoIndex = user.indexedRepos.findIndex(r => r.owner === owner && r.name === repo);
  if (repoIndex !== -1) {
    user.indexedRepos[repoIndex].progress = {
      current: currentFile,
      total: totalFiles,
      failed: failedFiles.length,
      lastUpdated: new Date()
    };
    await user.save();
  }
}

// Repo indeksleme endpoint'i
router.post('/index/:owner/:repo', auth, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    console.log('İndeksleme başlatılıyor:', {
      owner,
      repo,
      githubId: req.user.id,
      userInfo: req.user
    });

    // User modelini getir
    const user = await User.findOne({ githubId: req.user.id });
    if (!user) {
      console.error('Kullanıcı bulunamadı:', req.user.id);
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    console.log('Kullanıcı bulundu:', {
      githubId: user.githubId,
      username: user.username,
      indexedReposCount: user.indexedRepos?.length || 0
    });

    if (!req.user.githubToken) {
      console.error('GitHub token bulunamadı:', { githubId: req.user.id });
      return res.status(401).json({ message: 'GitHub token bulunamadı' });
    }

    // GitHub client'ı oluştur
    const octokit = new Octokit({
      auth: req.user.githubToken
    });

    // Repo durumunu güncelle
    const repoIndex = user.indexedRepos?.findIndex(r => r.owner === owner && r.name === repo) ?? -1;
    if (repoIndex === -1) {
      if (!user.indexedRepos) {
        user.indexedRepos = [];
      }
      user.indexedRepos.push({
        owner,
        name: repo,
        status: 'indexing',
        lastIndexed: new Date(),
        progress: {
          current: 0,
          total: 0,
          failed: 0,
          lastUpdated: new Date()
        }
      });
    } else {
      user.indexedRepos[repoIndex].status = 'indexing';
      user.indexedRepos[repoIndex].lastIndexed = new Date();
      user.indexedRepos[repoIndex].progress = {
        current: 0,
        total: 0,
        failed: 0,
        lastUpdated: new Date()
      };
    }
    await user.save();

    // Tüm repo içeriğini rekürsif olarak al
    const allFiles = await getAllFiles(octokit, owner, repo);
    console.log('Repo içeriği alındı:', { totalFileCount: allFiles.length });

    // İlk durumu güncelle
    await updateIndexingStatus(user, owner, repo, 0, allFiles.length);

    // Dosyaları işle ve vektörleştir
    const processedFiles = [];
    const failedFiles = [];

    for (let i = 0; i < allFiles.length; i++) {
      const file = allFiles[i];
      try {
        console.log('Dosya işleniyor:', { path: file.path, size: file.size });
        const { data: fileContent } = await octokit.repos.getContent({
          owner,
          repo,
          path: file.path
        });

        const content = Buffer.from(fileContent.content, 'base64').toString();
        const processedContent = processFileContent(content);

        // Gemini ile vektörleştirme
        try {
          const vector = await getEmbedding(processedContent);

          // Vektör veritabanına kaydet
          await Vector.findOneAndUpdate(
            {
              githubId: req.user.id,
              repoId: `${owner}/${repo}`,
              filePath: file.path
            },
            {
              githubId: req.user.id,
              content: processedContent,
              vector,
              metadata: {
                language: file.name.split('.').pop(),
                lastModified: fileContent.last_modified ? new Date(fileContent.last_modified) : new Date(),
                size: fileContent.size
              }
            },
            { upsert: true }
          );

          processedFiles.push(file.path);
          console.log('Dosya başarıyla işlendi:', file.path);
        } catch (error) {
          console.error('Vektörleştirme hatası:', {
            file: file.path,
            error: error.message
          });
          failedFiles.push({ path: file.path, error: error.message });
        }

        // Her 5 dosyada bir durumu güncelle
        if (i % 5 === 0 || i === allFiles.length - 1) {
          await updateIndexingStatus(user, owner, repo, i + 1, allFiles.length, failedFiles);
        }
      } catch (error) {
        console.error('Dosya işleme hatası:', {
          file: file.path,
          error: error.message
        });
        failedFiles.push({ path: file.path, error: error.message });
        await updateIndexingStatus(user, owner, repo, i + 1, allFiles.length, failedFiles);
      }
    }

    // İndeksleme tamamlandı
    const updatedUser = await User.findOne({ githubId: req.user.id });
    const updatedRepoIndex = updatedUser.indexedRepos.findIndex(r => r.owner === owner && r.name === repo);
    updatedUser.indexedRepos[updatedRepoIndex].status = failedFiles.length === 0 ? 'completed' : 'error';
    updatedUser.indexedRepos[updatedRepoIndex].progress = {
      current: allFiles.length,
      total: allFiles.length,
      failed: failedFiles.length,
      lastUpdated: new Date()
    };
    await updatedUser.save();

    res.json({
      message: 'Repo indeksleme tamamlandı',
      processedFiles,
      failedFiles,
      totalProcessed: processedFiles.length,
      totalFailed: failedFiles.length
    });
  } catch (error) {
    console.error('İndeksleme hatası:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status
    });

    // Hata durumunda repo durumunu güncelle
    try {
      const user = await User.findOne({ githubId: req.user.id });
      if (user?.indexedRepos) {
        const repoIndex = user.indexedRepos.findIndex(r => r.owner === req.params.owner && r.name === req.params.repo);
        if (repoIndex !== -1) {
          user.indexedRepos[repoIndex].status = 'error';
          await user.save();
          console.log('Hata durumu kaydedildi');
        }
      }
    } catch (saveError) {
      console.error('Hata durumu kaydedilemedi:', {
        error: saveError.message,
        stack: saveError.stack
      });
    }

    if (error.response?.status === 401) {
      return res.status(401).json({ message: 'GitHub token geçersiz' });
    }

    res.status(500).json({
      message: 'İndeksleme sırasında bir hata oluştu',
      error: error.response?.data?.message || error.message
    });
  }
});

// Vector arama endpoint'i
router.post('/search', auth, async (req, res) => {
  try {
    const { repoId, query } = req.body;

    // Query'yi vektörleştir
    const queryVector = await getEmbedding(query);

    // En yakın vektörleri bul (cosine similarity)
    const vectors = await Vector.find({
      githubId: req.user.id,
      repoId
    });
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
    const vectors = await Vector.find({
      githubId: req.user.id,
      repoId: `${owner}/${repo}`
    });
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
    await Vector.deleteMany({
      githubId: req.user.id,
      repoId: `${owner}/${repo}`
    });

    // User'dan indekslenen repo bilgisini kaldır
    const user = await User.findOne({ githubId: req.user.id });
    if (user) {
      user.indexedRepos = user.indexedRepos.filter(r => !(r.owner === owner && r.name === repo));
      await user.save();
    }

    res.json({ message: 'Repo vektörleri başarıyla silindi' });
  } catch (error) {
    console.error('Silme hatası:', error);
    res.status(500).json({ error: 'Vektörler silinirken bir hata oluştu' });
  }
});

// İndeksleme durumlarını getir
router.get('/status', auth, async (req, res) => {
  try {
    console.log('İndeksleme durumları istendi:', {
      userId: req.user.id,
      username: req.user.username
    });

    const user = await User.findOne({ githubId: req.user.id });
    if (!user) {
      console.error('Kullanıcı bulunamadı:', req.user.id);
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Her repo için indeksleme durumunu ve istatistikleri al
    const indexedRepos = await Promise.all((user.indexedRepos || []).map(async (repo) => {
      // Repo için vektör sayısını al
      const vectorCount = await Vector.countDocuments({
        githubId: req.user.id,
        repoId: `${repo.owner}/${repo.name}`
      });

      // Son indekslenen dosyaları al
      const recentFiles = await Vector.find({
        githubId: req.user.id,
        repoId: `${repo.owner}/${repo.name}`
      })
      .sort({ 'metadata.lastModified': -1 })
      .limit(5)
      .select('filePath metadata.lastModified');

      return {
        owner: repo.owner,
        name: repo.name,
        status: repo.status,
        lastIndexed: repo.lastIndexed,
        stats: {
          totalFiles: vectorCount,
          recentFiles: recentFiles.map(f => ({
            path: f.filePath,
            lastModified: f.metadata.lastModified
          }))
        }
      };
    }));

    res.json(indexedRepos);
  } catch (error) {
    console.error('İndeksleme durumları getirme hatası:', error);
    res.status(500).json({
      message: 'İndeksleme durumlarını getirirken bir hata oluştu',
      error: error.message
    });
  }
});

// İndeksleme verilerini sıfırla
router.post('/reset', auth, async (req, res) => {
  try {
    console.log('İndeksleme verileri sıfırlanıyor');

    // Sadece kullanıcının kendi vektörlerini sil
    await Vector.deleteMany({ githubId: req.user.id });

    // Kullanıcının indeksleme durumlarını sıfırla
    const user = await User.findOne({ githubId: req.user.id });
    if (user) {
      user.indexedRepos = [];
      await user.save();
    }

    console.log('İndeksleme verileri başarıyla sıfırlandı');
    res.json({ message: 'İndeksleme verileri başarıyla sıfırlandı' });
  } catch (error) {
    console.error('Sıfırlama hatası:', error);
    res.status(500).json({ error: 'Veriler sıfırlanırken bir hata oluştu' });
  }
});

module.exports = router;