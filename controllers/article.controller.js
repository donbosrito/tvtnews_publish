"use strict";

let mongoose = require('mongoose'),
    chalk = require('chalk'),
    errorCtrl = require('./error.controller.js');

let Article = mongoose.model('Article');
let User = mongoose.model('User');

// Define default response message
let defaultErrorMessage = 'Có lỗi xảy ra. Vui lòng thử lại!',
    defaultSuccessMessage = 'Thực hiện thành công',
    limitPage = 10;

module.exports.postNewArticle = function (req, res) {
    if (!isValidArticle(req.body)) {
        res.status(400).json({success: false, message: 'Vui lòng điền đầy đủ thông tin!'});
    }
    else {
        User.findOne({_id: req.body._author},
            function (err, user) {
                // Has an error when find user
                if (err) {
                    errorCtrl.sendErrorMessage(res, 500,
                        defaultErrorMessage,
                        errorCtrl.getErrorMessage(err));
                }
                else {
                    Article.create(req.body, function (err) {
                        if (err) {
                            console.error(chalk.bgRed('Init article failed!'));
                            console.log(err);
                        } else {
                            console.info(chalk.blue('Init article successful!'));
                            user.articleCount++;
                            User.update({_id: req.body._author}, {
                                    $set: {
                                        articleCount: user.articleCount
                                    }
                                },
                                {runValidators: true, override: true}, function (err) {
                                    if (err) {
                                        errorCtrl.sendErrorMessage(res, 404,
                                            defaultErrorMessage,
                                            errorCtrl.getErrorMessage(err));
                                    } else {
                                        res.status(200).json({
                                            success: true,
                                            resultMessage: 'Post bài thành công!'
                                        });
                                        res.send();
                                    }
                                });
                        }
                    });
                }
            });
    }
};

module.exports.getArticleInfo = (req, res) => {
    Article.findOne({_id: req.params.articleId}, function (err, article) {
        if (err || !article) {
            errorCtrl.sendErrorMessage(res, 404,
                'Bài này không tồn tại', []);
        }
        else {
            res.status(200).json({
                success: true,
                resultMessage: defaultSuccessMessage,
                article: article
            });
        }
    });
};

module.exports.getAllArticles = (req, res) => {
    Article.find({}).skip((req.query.page - 1) * limitPage).limit(limitPage)
        .populate('_author', 'username nickname avatar').exec(function (err, articles) {
        if (err || !articles) {
            errorCtrl.sendErrorMessage(res, 404,
                'Không có bài nào', []);
        }
        else {
            //Arrange list articles in dateCreated order
            articles.sort(function (a, b) {
                return (a.dateCreated < b.dateCreated) ? -1 : 1;
            });
            res.status(200).json({
                success: true,
                resultMessage: defaultSuccessMessage,
                articles: articles
            });
        }
    });
};

function isValidArticle(article) {
    return !(article._author == "" || article._author == null
    || article._category == "" || article._category == null
    || article.title == "" || article.title == null
    || article.body == "" || article.body == null);
}
