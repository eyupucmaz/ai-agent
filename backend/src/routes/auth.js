const express = require('express');
const router = express.Router();
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const jwt = require('jsonwebtoken');

// GitHub OAuth yapılandırması
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${process.env.API_URL}/api/auth/github/callback`
  },
  function(accessToken, refreshToken, profile, done) {
    // Kullanıcı bilgilerini döndür
    return done(null, {
      id: profile.id,
      username: profile.username,
      email: profile.emails?.[0]?.value,
      accessToken
    });
  }
));

// GitHub OAuth login başlatma
router.get('/github/login',
  passport.authenticate('github', { scope: ['user:email', 'repo'] })
);

// GitHub OAuth callback
router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req, res) => {
    // JWT token oluştur
    const token = jwt.sign(
      {
        id: req.user.id,
        username: req.user.username,
        githubUsername: req.user.username,
        githubToken: req.user.accessToken
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Frontend'e yönlendir
    res.redirect(`${process.env.FRONTEND_URL}?token=${token}`);
  }
);

// Kullanıcı bilgilerini getir
router.get('/me',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    res.json(req.user);
  }
);

// Çıkış yap
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Çıkış yapılırken bir hata oluştu' });
    }
    res.json({ message: 'Başarıyla çıkış yapıldı' });
  });
});

module.exports = router;