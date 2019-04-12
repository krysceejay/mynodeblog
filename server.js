const path = require('path');
const fs = require('fs');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const graphqlHttp = require('express-graphql');
const multer = require('multer');
const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');
const auth = require('./middleware/auth');
const app = express();

//DB Config
const db = require('./config/keys').mongoURI;

mongoose
  .connect(db, { useNewUrlParser: true })
  .then(() => console.log('Mongodb Connected'))
  .catch(err => console.log(err));

const fileStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'images');
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

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
};

//Body parser middleware
//app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('postimage')
);

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'OPTIONS,GET,POST,PUT,PATCH,DELETE'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (res.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.put('/postimage', (req, res, next) => {
  if (!req.file) {
    return res.status(200).json({ message: 'No file provided' });
  }
  if (req.body.oldPath) {
    clearImage(req.body.oldPath);
  }
  return res
    .status(201)
    .json({ message: 'File stored.', filePath: req.file.path });
});

app.use(auth);

app.use(
  '/graphql',
  graphqlHttp({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    formatError(err) {
      if (!err.originalError) {
        return err;
      }
      const data = err.originalError.data;
      const code = err.originalError.code || 500;
      const message = err.message || 'An error occurred';
      return { message: message, status: code, data: data };
    }
  })
);

app.get('/', (req, res) => res.send('hello'));

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server running on port ${port}`));
