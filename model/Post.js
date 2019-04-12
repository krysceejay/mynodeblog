const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//create schema
const PostSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users'
    },
    title: {
      type: String,
      required: true
    },
    body: {
      type: String,
      required: true
    },
    imageUrl: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = Post = mongoose.model('post', PostSchema);
