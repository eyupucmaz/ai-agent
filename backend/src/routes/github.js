const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');

router.get('/repos', auth, async (req, res) => {
  try {
    const response = await axios.get('https://api.github.com/user/repos', {
      headers: {
        Authorization: `Bearer ${req.user.githubAccessToken}`,
      },
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
    console.error('GitHub API hatası:', error);
    res.status(500).json({ message: 'GitHub repolarını getirirken bir hata oluştu' });
  }
});

module.exports = router;