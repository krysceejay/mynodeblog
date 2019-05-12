const express = require('express');
const path = require('path');
var fs = require('fs');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const graphqlHttp = require('express-graphql');
const multer = require('multer');
//const csrf = require('csurf');
const flash = require('connect-flash');

const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');
const auth = require('./middleware/auth');
const { clearImage } = require('./util/file');
const app = express();

//const csrfProtection = csrf();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//Route imports
const postRoutes = require('./routes/posts');
const userRoutes = require('./routes/users');

const pageNotFound = require('./controller/404');

//DB Config
const db = require('./config/keys').mongoURI;

mongoose
  .connect(db, { useNewUrlParser: true })
  .then(() => console.log('Mongodb Connected'))
  .catch(err => console.log(err));

//ckeditor upload settings
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'public/upload/');
  },
  filename: (req, file, callback) => {
    callback(null, new Date().getTime() + '_' + file.originalname);
  }
});

var upload = multer({ storage: storage });

//end upload settings

//Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.text({ type: 'application/graphql' }));
app.use(bodyParser.json());
app.use(
  session({ secret: 'mysecret', resave: false, saveUninitialized: false })
);
//app.use(csrfProtection);
app.use(flash());
// app.use(
//   multer({ storage: fileStorage, fileFilter: fileFilter }).single('postimage')
// );
app.use(express.static(path.join(__dirname, 'public')));
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
app.use((req, res, next) => {
  res.locals.isLoggedin = req.session.login;
  //res.locals.csrfToken = req.csrfToken();
  next();
});
app.use(auth);
app.use('/post', postRoutes);
app.use('/user', userRoutes);

// app.put(
//   '/postimage',
//   multer({ storage: fileStorage, fileFilter: fileFilter }).single('postimage'),
//   (req, res, next) => {
//     if (!req.isAuth) {
//       const error = new Error('Not authenticated');
//       error.code = 401;
//       throw error;
//     }
//     if (!req.file) {
//       return res.status(200).json({ message: 'No file provided' });
//     }
//     if (req.body.oldPath) {
//       clearImage(req.body.oldPath);
//     }
//     return res
//       .status(201)
//       .json({ message: 'File stored.', filePath: req.file.path });
//   }
// );

//using ckeditor
//show all image in folder upload to json
app.get('/files', function(req, res) {
  const images = fs.readdirSync('public/upload');
  var sorted = [];
  for (let item of images) {
    if (
      item.split('.').pop() === 'png' ||
      item.split('.').pop() === 'jpg' ||
      item.split('.').pop() === 'jpeg' ||
      item.split('.').pop() === 'svg'
    ) {
      var abc = {
        image: '/upload/' + item,
        folder: '/'
      };
      sorted.push(abc);
    }
  }
  res.send(sorted);
});
//upload image to folder upload
app.post('/upload', upload.array('flFileUpload', 12), function(req, res, next) {
  res.redirect('back');
});

//delete file
app.post('/delete_file', function(req, res, next) {
  var url_del = 'public' + req.body.url_del;
  console.log(url_del);
  if (fs.existsSync(url_del)) {
    fs.unlinkSync(url_del);
  }
  res.redirect('back');
});
//end using ckeditor

app.use(
  '/graphql',
  graphqlHttp({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    customFormatErrorFn(err) {
      if (!err.originalError) {
        return err;
      }
      const data = err.originalError.data;
      const code = err.originalError.code || 500;
      const message = err.message || 'An error occurred';
      const locations = error.locations;
      const stack = error.stack ? error.stack.split('\n') : [];
      const path = error.path;
      return {
        message: message,
        status: code,
        data: data,
        locations: locations,
        stack: stack,
        path: path
      };
    }
  })
);

app.get('/', (req, res) => res.send('hello'));
app.use(pageNotFound.get404);

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server running on port ${port}`));
