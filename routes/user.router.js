'use strict';

let express = require('express'),
    router = express.Router();

let userController = require('../controllers/user.controller'),
    authController = require('../controllers/authorization.controller');

router
// Sign up new account
    .post('/', (req, res) => {
        userController.signUp(req, res);
    })

    // Update profile
    .put('/:userId', (req, res, next) => {
        authController.authenticate(req, res, next);
    }, (req, res) => {
        userController.updateProfile(req, res);
    })

    //Get all users
    .get('/', (req, res) => {
        userController.getAllUsers(req, res);
    })

    // Get user info
    .get('/:userId', (req, res, next) => {
        authController.authenticate(req, res, next);
    }, (req, res) => {
        userController.getUserInfo(req, res);
    })

    // Sign in account
    .post('/sign-in', (req, res) => {
        userController.signIn(req, res);
    })

    // Sign in with facebook
    .post('/sign-in-facebook', (req, res) => {
        userController.signInWithFacebook(req, res);
    })

    // Like article
    .post('/:userId/like-article', (req, res, next) => {
        authController.authenticate(req, res, next);
    }, (req, res) => {
        userController.likeArticle(req, res);
    })

    // unlike article
    .delete('/:userId/unlike-article', (req, res, next) => {
        authController.authenticate(req, res, next);
    }, (req, res) => {
        userController.unlikeArticle(req, res);
    })

    .get('/:userId/liked-articles', (req, res, next) => {
        authController.authenticate(req, res, next);
    }, (req, res) => {
        userController.getLikedArticles(req, res);
    });
module.exports = router;
