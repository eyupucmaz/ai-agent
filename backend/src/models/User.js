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
    repoId: String,
    name: String,
    owner: String,
    lastIndexed: Date,
    status: {
      type: String,
      enum: ['pending', 'indexing', 'completed', 'failed'],
      default: 'pending'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);