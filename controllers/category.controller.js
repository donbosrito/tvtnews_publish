'use strict';

let mongoose = require('mongoose'),
    chalk = require('chalk'),
    errorCtrl = require('./error.controller');


let Category = mongoose.model('Category');
let Article = mongoose.model('Article');

// Define default response message
let defaultErrorMessage = 'Có lỗi xảy ra. Vui lòng thử lại!',
    defaultSuccessMessage = 'Thực hiện thành công',
    limitPage = 10;

module.exports.postNewCategory = (req, res) => {
    if (req.authenticatedUser.typeMember != "ADMIN")
        res.status(405).json({success: false, message: 'Chức năng này chỉ dùng cho quản trị!'});

    else if (!req.body.name || req.body.name == "") {
        res.status(400).json({success: false, message: 'Vui lòng điền đầy đủ thông tin!'});
    }
    else {
        Category.create(req.body, function (err) {
            if (err)
                errorCtrl.sendErrorMessage(res, 404,
                    defaultErrorMessage, []);
            else {
                res.status(200).json({
                    success: true,
                    resultMessage: 'Post bài thành công!'
                });
                res.send();
            }
        });
    }
};

module.exports.getAllCategories = (req, res) => {
    Category.find({}, function (err, categories) {
        if (err)
            errorCtrl.sendErrorMessage(res, 404,
                defaultErrorMessage, []);
        else if (!categories)
            errorCtrl.sendErrorMessage(res, 404,
                'Không có thể loại nào', []);
        else {
            res.status(200).json({
                success: true,
                resultMessage: defaultSuccessMessage,
                categories: categories
            });
        }
    });
};

//Get all article in category
module.exports.getAllArticles = (req, res) => {
    Article.find({_category: req.params.categoryId}).skip((req.query.page - 1) * limitPage).limit(limitPage)
        .populate('_author _category', 'username nickname avatar name').exec(function(err, articles) {
        if (err)
            errorCtrl.sendErrorMessage(res, 404,
                defaultErrorMessage, []);
        else if (!articles)
            errorCtrl.sendErrorMessage(res, 404,
                'Không có bài báo nào', []);
        else {
            Article.count().exec(function(err, count) {
                //Arrange list articles in dateCreated order
                articles.sort(function (a, b) {
                    return (a.dateCreated < b.dateCreated) ? -1 : 1;
                });
                res.status(200).json({
                    success: true,
                    resultMessage: defaultSuccessMessage,
                    articles: articles,
                    pages: (count / limitPage) + 1
                });
            });
        }
    })
};
