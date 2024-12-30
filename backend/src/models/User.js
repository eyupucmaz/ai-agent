const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  githubId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    required: true
  },
  email: String,
  avatarUrl: String,
  indexedRepos: [{
    owner: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'indexing', 'completed', 'error'],
      default: 'pending'
    },
    lastIndexed: {
      type: Date,
      default: Date.now
    },
    progress: {
      current: {
        type: Number,
        default: 0
      },
      total: {
        type: Number,
        default: 0
      },
      failed: {
        type: Number,
        default: 0
      },
      lastUpdated: {
        type: Date,
        default: Date.now
      }
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Güncelleme tarihini otomatik güncelle
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema);