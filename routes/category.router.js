var express = require('express'),
    router = express.Router(),
    categoryController = require('../controllers/category.controller');

router
    .post('/', (req, res) => {
        categoryController.postNewCategory(req, res);
    })

    .get('/', (req, res) => {
        categoryController.getAllCategories(req, res);
    })

    .get('/:categoryId/articles', (req, res) => {
        categoryController.getAllArticles(req, res);
    });
module.exports = router;
