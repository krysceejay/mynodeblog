const axios = require('axios');
const flashError = require('../middleware/flashmsg');
exports.showRegisterUserForm = (req, res, next) => {
  if (req.session.login) {
    return res.redirect('/user/dashboard');
  }
  let msg = req.flash('error');
  errorMessage = flashError.flashErrorMessages(msg);
  res.render('user/register', {
    pageTitle: 'Signup',
    errorMessage
  });
};

exports.registerUser = async (req, res, next) => {
  //console.log(req.body);
  const username = req.body.username;
  const uemail = req.body.uemail;
  const password = req.body.password;
  try {
    const regUser = await axios({
      url: 'http://localhost:5000/graphql',
      method: 'post',
      data: {
        query: `
      mutation {
        createUser(userInput: {email: "${uemail}", name: "${username}", password: "${password}"}){
          _id
          email
        }
      }
        `
      }
    });

    res.redirect('/user/login');
  } catch (err) {
    req.flash('error', err.response.data.errors[0].message);
    res.redirect('/user/register');
  }
};

exports.showLoginForm = (req, res, next) => {
  if (req.session.login) {
    return res.redirect('/user/dashboard');
  }
  let msg = req.flash('error');
  errorMessage = flashError.flashErrorMessages(msg);

  res.render('user/login', {
    errorMessage
  });
};

exports.loginUser = async (req, res, next) => {
  const uemail = req.body.uemail;
  const password = req.body.password;
  //const csrfToken = req.body._csrf;
  //axios.defaults.headers.common['csrf-token'] = req.body._csrf;
  try {
    const signinUser = await axios({
      url: 'http://localhost:5000/graphql',
      method: 'post',
      data: {
        query: `
        query {
          login(email: "${uemail}", password: "${password}") {
             token
             userId
           }
         }
        `
      }
    });
    req.session.token = signinUser.data.data.login.token;
    req.session.login = true;

    res.redirect('/user/dashboard');
  } catch (err) {
    req.flash('error', err.response.data.errors[0].message);
    //console.log(err.response.data.errors[0].message);
    return res.redirect('/user/login');
  }
};

exports.dashboard = (req, res, next) => {
  res.render('user/dashboard');
};

exports.logoutUser = (req, res, next) => {
  req.session.destroy(() => {
    res.redirect('/user/login');
  });
};
