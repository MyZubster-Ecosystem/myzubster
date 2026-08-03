const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema(
  {
    gardenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Garden',
      required: true,
      index: true,
    },
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    thumbnailPath: {
      type: String,
      default: null,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    width: {
      type: Number,
      default: null,
    },
    height: {
      type: Number,
      default: null,
    },
    caption: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500,
    },
    uploadedBy: {
      type: String,
      trim: true,
      default: 'anonymous',
    },
  },
  {
    versionKey: false,
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('Photo', photoSchema);
