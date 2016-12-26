"use strict";

let mongoose = require('mongoose'),
    chalk = require('chalk'),
    errorCtrl = require('./error.controller.js');

let Article = mongoose.model('Article'),
    User = mongoose.model('User'),
    Comment = mongoose.model('Comment');

// Define default response message
let defaultErrorMessage = 'Có lỗi xảy ra. Vui lòng thử lại!',
    defaultSuccessMessage = 'Thực hiện thành công',
    limitPage = 15,
    limitComment = 15;

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
                                            resultMessage: defaultSuccessMessage,
                                        });
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
                'Bài báo này không tồn tại', []);
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
    if (req.query.tag == null || req.query.tag == "") {
        Article.find({}).skip((req.query.page - 1) * limitPage).limit(limitPage)
            .populate('_author _category', 'username nickname avatar name').exec(function (err, articles) {
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
    }
    else {
        Article.find({tags: req.query.tag}).skip((req.query.page - 1) * limitPage).limit(limitPage)
            .populate('_author _category', 'username nickname avatar name').exec(function (err, articles) {
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
    }
};

//action: read, comment, share.
module.exports.doWithArticle = (req, res, action) => {
    Article.findOne({_id: req.params.articleId}, function (err, article) {
        if (err || !article) {
            errorCtrl.sendErrorMessage(res, 404,
                'Bài post này không tồn tại', []);
        }
        else {
            switch (action) {
                case "read":
                    article.readCount++;
                    article.save(function (err, updatedArticle) {
                        if (err) {
                            errorCtrl.sendErrorMessage(res, 404,
                                defaultErrorMessage,
                                errorCtrl.getErrorMessage(err));
                        } else {
                            res.status(200).json({
                                success: true,
                                resultMessage: defaultSuccessMessage,
                                readCount: updatedArticle.readCount
                            });
                        }
                    });
                    break;
                case "share":
                    article.shareCount++;
                    article.save(function (err, updatedArticle) {
                        if (err) {
                            errorCtrl.sendErrorMessage(res, 404,
                                defaultErrorMessage,
                                errorCtrl.getErrorMessage(err));
                        } else {
                            res.status(200).json({
                                success: true,
                                resultMessage: defaultSuccessMessage,
                                shareCount: updatedArticle.shareCount
                            });
                        }
                    });
                    break;
                case "comment":
                    Comment.create(req.body, function (err) {
                        if (err) {
                            console.error(chalk.bgRed('Init comment failed!'));
                            console.log(err);
                        } else {
                            console.info(chalk.blue('Init comment successful!'));
                            article.commentCount++;
                            article.save(function (err, updatedArticle) {
                                if (err) {
                                    errorCtrl.sendErrorMessage(res, 404,
                                        defaultErrorMessage,
                                        errorCtrl.getErrorMessage(err));
                                } else {
                                    res.status(200).json({
                                        success: true,
                                        resultMessage: defaultSuccessMessage,
                                        commentCount: updatedArticle.commentCount
                                    });
                                }
                            });
                        }
                    });
                    break;
            }
        }
    })
};

module.exports.getAllComments =(req, res) => {
    Article.findOne({_id: req.params.articleId}, function (err, article) {
        if (err || !article) {
            errorCtrl.sendErrorMessage(res, 404,
                'Bài báo này không tồn tại', []);
        }
        else {
            Comment.find({_article: req.params.articleId}).skip((req.query.page - 1) * limitComment).limit(limitComment)
                .populate('_user', 'username nickname avatar name').exec(function (err, comments) {
                if (err || !comments) {
                    errorCtrl.sendErrorMessage(res, 404,
                        'Không có bình luận nào', []);
                }
                else {
                    //Arrange list articles in dateCreated order
                    comments.sort(function (a, b) {
                        return (a.dateCreated < b.dateCreated) ? -1 : 1;
                    });
                    res.status(200).json({
                        success: true,
                        resultMessage: defaultSuccessMessage,
                        comments: comments
                    });
                }
            });
        }
    });

};

function isValidArticle(article) {
    if (article._author == "" || article._author == null
    || article._category == "" || article._category == null
    || article.title == "" || article.title == null
    || article.body == "" || article.body == null)
        return false;
    delete article.readCount;
    delete article.shareCount;
    delete article.commentCount;
    return true;
}
