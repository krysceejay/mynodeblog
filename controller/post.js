const axios = require('axios');
const flashError = require('../middleware/flashmsg');
const { clearImage } = require('../util/file');
exports.showAddPostForm = (req, res, next) => {
  let msg = req.flash('error');
  errorMessage = flashError.flashErrorMessages(msg);
  res.render('post/addpost');
};

exports.allPost = async (req, res, next) => {
  try {
    const getPosts = await axios({
      url: 'http://localhost:5000/graphql',
      method: 'post',
      headers: {
        Authorization: 'Bearer ' + req.session.token
      },
      data: {
        query: `
        query {
          getPosts(page: 1){
            posts{
              _id
              title
              body
              imageUrl
              status
              user{
                name
              }
              createdAt
              updatedAt

            }
            totalPosts
          }
         }
        `
      }
    });

    res.render('post/posts', {
      allPosts: getPosts.data.data.getPosts.posts
    });
  } catch (err) {
    if (err.response.data.errors[0].message == 'Not authenticated') {
      req.session.destroy(() => {
        return res.redirect('/user/login');
      });
    }
    //req.flash('error', err.response.data.errors[0].message);
    console.log(err.response.data.errors[0].message);
    //return res.redirect('/user/login');
  }
};

exports.createPost = async (req, res, next) => {
  if (!req.file) {
    // return res.status(200).json({ message: 'No file provided' });
    req.flash('error', 'No file provided');
    return res.redirect('/post/addpost');
  }
  if (req.body.oldPath) {
    clearImage(req.body.oldPath);
  }

  const title = req.body.title;
  const category = req.body.category;
  const poststatus = req.body.poststatus;
  const body = req.body.postbody;
  const imageUrl = req.file.filename;

  if (poststatus == '1') {
    status = true;
  } else {
    status = false;
  }

  try {
    await axios({
      url: 'http://localhost:5000/graphql',
      method: 'post',
      headers: {
        Authorization: 'Bearer ' + req.session.token
      },
      data: {
        query: `
        mutation AddPost($title: String!, $category: [String!], $body: String!, $imageUrl: String!, $status: Boolean!) {
          createPost(postInput: {title: $title, body: $body, category: $category, status: $status , imageUrl: $imageUrl}) {
                  _id
                  title
                }
              }
        `,
        variables: {
          title,
          body,
          category,
          imageUrl,
          status
        }
      }
    });

    res.redirect('/post');
  } catch (err) {
    console.log(err.response.data.errors[0]);
    // req.flash('error', err.response.data.errors[0].message);
    // res.redirect('/user/register');
  }
};
