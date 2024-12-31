const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Token'ı header'dan al
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token bulunamadı' });
    }

    const token = authHeader.split(' ')[1];

    try {
      // Token'ı doğrula
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Kullanıcı bilgilerini request'e ekle
      req.user = {
        id: decoded.id,
        username: decoded.username,
        githubUsername: decoded.githubUsername,
        githubToken: decoded.githubToken
      };

      // Kullanıcıyı veritabanında kontrol et veya oluştur
      let user = await User.findOne({ githubId: decoded.id });

      if (!user) {
        console.log('Yeni kullanıcı oluşturuluyor:', {
          githubId: decoded.id,
          username: decoded.username
        });

        user = await User.create({
          githubId: decoded.id,
          username: decoded.username,
          accessToken: decoded.githubToken,
          indexedRepos: []
        });
      } else {
        // Token değiştiyse güncelle
        if (user.accessToken !== decoded.githubToken) {
          console.log('Kullanıcı token güncelleniyor:', {
            githubId: decoded.id,
            username: decoded.username
          });

          user.accessToken = decoded.githubToken;
          await user.save();
        }
      }

      next();
    } catch (error) {
      console.error('Token doğrulama hatası:', error);
      return res.status(401).json({ message: 'Geçersiz token' });
    }
  } catch (error) {
    console.error('Auth middleware hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

module.exports = auth;