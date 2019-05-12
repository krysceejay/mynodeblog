const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const User = require('../model/User');
const Post = require('../model/Post');
const Category = require('../model/Category');
const keys = require('../config/keys');

const { clearImage } = require('../util/file');

module.exports = {
  createUser: async function({ userInput }, req) {
    //const email = args.userInput.email
    const errors = [];
    if (!validator.isEmail(userInput.email)) {
      errors.push({ message: 'Email is invalid' });
    }

    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 6 })
    ) {
      errors.push({ message: 'Invalid password or password too short' });
    }

    if (errors.length > 0) {
      const error = new Error('Invalid input');
      error.data = errors;
      error.code = 422;
      throw error;
    }

    const existingUser = await User.findOne({ email: userInput.email });

    if (existingUser) {
      const error = new Error('User exists already');
      throw error;
    }
    const hashedPw = await bcrypt.hash(userInput.password, 12);
    const user = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashedPw
    });
    const createdUser = await user.save();

    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },

  login: async function({ email, password }) {
    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error('User not found');
      error.code = 401;
      throw error;
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error('Password is incorrect.');
      error.code = 401;
      throw error;
    }
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email
      },
      keys.secretOrKey,
      { expiresIn: '1h' }
    );
    return { token: token, userId: user._id.toString() };
  },
  createPost: async function({ postInput }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated');
      error.code = 401;
      throw error;
    }

    const errors = [];
    if (validator.isEmpty(postInput.title)) {
      errors.push({ message: 'Post title is required' });
    }
    if (validator.isEmpty(postInput.body)) {
      errors.push({ message: 'Post body is required' });
    }
    if (errors.length > 0) {
      const error = new Error('Invalid input');
      error.data = errors;
      error.code = 422;
      throw error;
    }

    const user = await User.findById(req.userId);

    if (!user) {
      const error = new Error('Invalid user');
      error.code = 401;
      throw error;
    }

    const post = new Post({
      title: postInput.title,
      body: postInput.body,
      imageUrl: postInput.imageUrl,
      category: postInput.category,
      status: postInput.status,
      user: user
    });
    const createdPost = await post.save();
    user.posts.push(createdPost);
    await user.save();
    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toDateString(),
      updatedAt: createdPost.updatedAt.toDateString()
    };
  },
  getPosts: async function({ page }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated');
      error.code = 401;
      throw error;
    }
    if (!page) {
      page = 1;
    }
    const perPage = 20;
    const totalPosts = await Post.find().countDocuments();
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(page - 1)
      .limit(perPage)
      .populate('user');
    return {
      posts: posts.map(p => {
        return {
          ...p._doc,
          _id: p._id.toString(),
          createdAt: p.createdAt.toDateString(),
          updatedAt: p.updatedAt.toDateString()
        };
      }),
      totalPosts: totalPosts
    };
  },
  getPost: async function({ id }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated');
      error.code = 401;
      throw error;
    }

    const post = await Post.findById(id).populate('user');
    if (!post) {
      const error = new Error('No post found');
      error.code = 404;
      throw error;
    }

    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString()
    };
  },
  updatePost: async function({ id, postInput }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated');
      error.code = 401;
      throw error;
    }

    const post = await Post.findById(id).populate('user');
    if (!post) {
      const error = new Error('No post found');
      error.code = 404;
      throw error;
    }
    if (post.user._id.toString() !== req.userId.toString()) {
      const error = new Error('Not authorized');
      error.code = 403;
      throw error;
    }
    const errors = [];
    if (validator.isEmpty(postInput.title)) {
      errors.push({ message: 'Post title is required' });
    }
    if (validator.isEmpty(postInput.body)) {
      errors.push({ message: 'Post body is required' });
    }
    if (errors.length > 0) {
      const error = new Error('Invalid input');
      error.data = errors;
      error.code = 422;
      throw error;
    }
    post.title = postInput.title;
    post.body = postInput.body;
    if (postInput.imageUrl !== 'undefined') {
      post.imageUrl = postInput.imageUrl;
    }

    const updatedPost = await post.save();

    return {
      ...updatedPost._doc,
      _id: updatedPost._id.toString(),
      createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString()
    };
  },
  deletePost: async function({ id }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated');
      error.code = 401;
      throw error;
    }
    const post = await Post.findById(id);
    if (!post) {
      const error = new Error('No post found');
      error.code = 404;
      throw error;
    }
    if (post.user.toString() !== req.userId.toString()) {
      const error = new Error('Not authorized');
      error.code = 403;
      throw error;
    }
    clearImage(post.imageUrl);
    await Post.findByIdAndRemove(id);
    const user = await User.findById(req.userId);
    user.posts.pull(id);
    await user.save();
    return true;
  },
  getUser: async function(arg, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated');
      error.code = 401;
      throw error;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('No user found');
      error.code = 404;
      throw error;
    }
    return {
      ...user._doc,
      _id: user._id.toString()
    };
  },
  createCategory: async function({ name }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated');
      error.code = 401;
      throw error;
    }
    const errors = [];
    if (validator.isEmpty(name)) {
      errors.push({ message: 'Category name is required' });
    }
    if (errors.length > 0) {
      const error = new Error('Invalid input');
      error.data = errors;
      error.code = 422;
      throw error;
    }

    const user = await User.findById(req.userId);

    if (!user) {
      const error = new Error('Invalid user');
      error.code = 401;
      throw error;
    }

    const category = new Category({
      name
    });
    const createdCategory = await category.save();
    return {
      ...createdCategory._doc,
      _id: createdCategory._id.toString(),
      createdAt: createdCategory.createdAt.toISOString(),
      updatedAt: createdCategory.updatedAt.toISOString()
    };
  },
  greeting(pr) {
    if (pr.name) {
      return `Hello ${pr.name}`;
    } else {
      return 'Hello';
    }
  }
};
