const express = require('express');
const router = express.Router();
const userController = require("./controllers/userController");
const postController = require("./controllers/postController");
const followController = require("./controllers/followController");


// user rotte

router.get('/', userController.home);
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', userController.logout);


// profile rotte
router.get('/profile/:username', userController.ifUserExist, userController.sharedProfileData, userController.profilePostsScreen);


// post rotte

router.get('/create-post', userController.mustBeLoggedIn, postController.viewCreateScreen);
router.post('/create-post', userController.mustBeLoggedIn, postController.create);
router.get('/post/:id', postController.viewSingle);
router.get('/post/:id/edit', userController.mustBeLoggedIn, postController.viewEditScreen);
router.post('/post/:id/edit', userController.mustBeLoggedIn, postController.edit);
router.post('/post/:id/delete', userController.mustBeLoggedIn, postController.delete);
router.post('/search', postController.search);


// follow rotte
router.post('/addFollow/:username', userController.mustBeLoggedIn, followController.addFollow);
router.post('/removeFollow/:username', userController.mustBeLoggedIn, followController.removeFollow);

module.exports = router;