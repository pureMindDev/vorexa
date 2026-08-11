const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    media: {
      url: { type: String, default: '' },
      type: { type: String, enum: ['image', 'video', 'raw', ''], default: '' },
      publicId: { type: String, default: '' }, // Cloudinary public_id, needed to delete the asset later
      originalName: { type: String, default: '' },
      bytes: { type: Number, default: 0 },
    },
    likes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    comments: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true, trim: true, maxlength: 500 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// A post needs either some text or an attached file — never neither.
postSchema.pre('validate', function (next) {
  if (!this.content?.trim() && !this.media?.url) {
    this.invalidate('content', 'A post needs either text or a media attachment');
  }
  next();
});

module.exports = mongoose.model('Post', postSchema);
