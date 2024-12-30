const express = require('express');
const router = express.Router();
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

// GitHub OAuth yapılandırması
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${process.env.API_URL}/api/auth/github/callback`
  },
  function(accessToken, refreshToken, profile, done) {
    console.log('GitHub OAuth başarılı:', {
      id: profile.id,
      username: profile.username
    });
    // Kullanıcı bilgilerini döndür
    return done(null, {
      id: profile.id,
      username: profile.username,
      email: profile.emails?.[0]?.value,
      accessToken
    });
  }
));

// Session serialization
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// GitHub OAuth login başlatma
router.get('/github/login',
  (req, res, next) => {
    console.log('GitHub login başlatılıyor');
    next();
  },
  passport.authenticate('github', { scope: ['user:email', 'repo'] })
);

// GitHub OAuth callback
router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req, res) => {
    console.log('GitHub callback alındı:', { user: req.user });

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

    console.log('JWT token oluşturuldu');

    // Frontend'e yönlendir
    res.redirect(`${process.env.FRONTEND_URL}?token=${token}`);
  }
);

// Kullanıcı bilgilerini getir
router.get('/me', auth, (req, res) => {
  console.log('Kullanıcı bilgileri istendi:', req.user);
  res.json({
    id: req.user.id,
    username: req.user.username,
    githubUsername: req.user.githubUsername
  });
});

// Çıkış yap
router.post('/logout', auth, (req, res) => {
  console.log('Kullanıcı çıkış yapıyor:', req.user);
  req.logout((err) => {
    if (err) {
      console.error('Çıkış yaparken hata:', err);
      return res.status(500).json({ error: 'Çıkış yapılırken bir hata oluştu' });
    }
    res.json({ message: 'Başarıyla çıkış yapıldı' });
  });
});

module.exports = router;