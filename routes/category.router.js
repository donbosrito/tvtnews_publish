var express = require('express'),
    router = express.Router(),
    categoryController = require('../controllers/category.controller');

router
    .post('/', function (req, res) {
        categoryController.postNewCategory(req, res);
    })

    .get('/', function (req, res) {
        categoryController.getAllCategories(req, res);
    })

    .get('/:categoryId/articles', function (req, res) {
        categoryController.getAllArticles(req, res);
    });
module.exports = router;
