require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');
const setupChatHandlers = require('./socket/chat');
const setupCleanupJob = require('./cron/cleanup');

const authRouter = require('./routes/auth');
const githubRouter = require('./routes/github');
const aiRouter = require('./routes/ai');
const vectorRoutes = require('./routes/vector');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
};

passport.use(new JwtStrategy(jwtOptions, (jwt_payload, done) => {
  return done(null, jwt_payload);
}));

// Serialize/Deserialize user
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB\'ye başarıyla bağlanıldı');
    // Temizleme görevini başlat
    setupCleanupJob();
  })
  .catch(err => console.error('MongoDB bağlantı hatası:', err));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/github', githubRouter);
app.use('/api/ai', aiRouter);
app.use('/api/vector', vectorRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// WebSocket handlers
setupChatHandlers(io);

// HTTP server'ı başlat
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});