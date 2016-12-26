let express = require('express'),
    router = express.Router();

let articleController = require('../controllers/article.controller'),
    authController = require('../controllers/authorization.controller.js');

router
    .post('/', (req, res, next) => {
        authController.authenticate(req, res, next);
    }, (req, res, next) => {
        // add article here
        articleController.postNewArticle(req, res);
    })

    .get('/:articleId', (req, res) => {
        articleController.getArticleInfo(req, res);
    })

    .get('/', (req, res) => {
        articleController.getAllArticles(req, res);
    })

    .post('/:articleId/read-post', (req, res) => {
        articleController.doWithArticle(req, res, 'read');
    })

    .post('/:articleId/share-post', (req, res) => {
        articleController.doWithArticle(req, res, 'share');
    })

    .post('/:articleId/comments', (req, res, next) => {
        authController.authenticate(req, res, next)
    }, (req, res) => {
        articleController.doWithArticle(req, res, 'comment');
    })

    .get('/:articleId/comments', (req, res) => {
        articleController.getAllComments(req, res);
    })

    .get('/:articleId/count-likes', (req, res) => {
        articleController.getCountLike(req, res);
    });

module.exports = router;