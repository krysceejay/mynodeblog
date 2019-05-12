const path = require('path');
const express = require('express');
const userController = require('../controller/user');
//const rootDir = require('../util/path');
const clientAuth = require('../middleware/clientAuth');
const router = express.Router();

router.get('/register', userController.showRegisterUserForm);

router.post('/register', userController.registerUser);

router.get('/login', userController.showLoginForm);

router.post('/login', userController.loginUser);
router.post('/logout', userController.logoutUser);

router.get('/dashboard', clientAuth, userController.dashboard);

module.exports = router;
