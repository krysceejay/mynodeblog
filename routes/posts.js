const path = require('path');
const express = require('express');
const multer = require('multer');
const postController = require('../controller/post');
//const rootDir = require('../util/path');
const clientAuth = require('../middleware/clientAuth');

const fileStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'public/upload');
  },
  filename: (req, file, callback) => {
    callback(null, new Date().getTime() + '_' + file.originalname);
  }
});

const fileFilter = (req, file, callback) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    callback(null, true);
  } else {
    callback(null, false);
  }
};

const router = express.Router();

router.get('/addpost', clientAuth, postController.showAddPostForm);
router.get('/', clientAuth, postController.allPost);
router.post(
  '/createpost',
  clientAuth,
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('postimage'),
  postController.createPost
);

module.exports = router;
