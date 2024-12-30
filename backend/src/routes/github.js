const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');

router.get('/repos', auth, async (req, res) => {
  try {
    console.log('GitHub repos isteği başlatılıyor:', {
      userId: req.user.id,
      username: req.user.username
    });

    if (!req.user.githubToken) {
      console.error('GitHub token bulunamadı');
      return res.status(401).json({ message: 'GitHub token bulunamadı' });
    }

    const response = await axios.get('https://api.github.com/user/repos', {
      headers: {
        Authorization: `Bearer ${req.user.githubToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    console.log('GitHub API yanıt alındı:', {
      repoCount: response.data.length
    });

    const repos = response.data.map(repo => ({
      id: repo.id,
      name: repo.name,
      owner: {
        login: repo.owner.login
      },
      description: repo.description,
      html_url: repo.html_url,
      stargazers_count: repo.stargazers_count,
      language: repo.language,
    }));

    res.json(repos);
  } catch (error) {
    console.error('GitHub API hatası:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    if (error.response?.status === 401) {
      return res.status(401).json({ message: 'GitHub token geçersiz' });
    }

    res.status(500).json({
      message: 'GitHub repolarını getirirken bir hata oluştu',
      error: error.response?.data?.message || error.message,
    });
  }
});

module.exports = router;