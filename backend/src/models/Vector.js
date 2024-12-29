const mongoose = require('mongoose');

const vectorSchema = new mongoose.Schema({
  repoId: {
    type: String,
    required: true,
    index: true
  },
  filePath: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  vector: {
    type: [Number],
    required: true
  },
  metadata: {
    language: String,
    lastModified: Date,
    size: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient querying
vectorSchema.index({ repoId: 1, filePath: 1 }, { unique: true });

module.exports = mongoose.model('Vector', vectorSchema);