let express = require('express'),
    router = express.Router();

let articleController = require('../controllers/article.controller'),
    authController = require('../controllers/authorization.controller.js');


router
    .post('/', function (req, res, next) {
        authController.authenticate(req, res, next);
    }, function (req, res, next) {
        // add article here
        articleController.postNewArticle(req, res);
    })

    .get('/:articleId', function (req, res) {
        articleController.getArticleInfo(req, res);
    })

    .get('/', function (req, res) {
        articleController.getAllArticles(req, res);
    });

module.exports = router;