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
    if (req.authenticatedUser.typeMember != "AUTHOR" && req.authenticatedUser.typeMember != "ADMIN")
        res.status(405).json({success: false, message: 'Chức năng này chỉ dùng cho nhà báo và quản trị!'});

    else if (!isValidArticle(req.body)) {
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
                            errorCtrl.sendErrorMessage(res, 500,
                                defaultErrorMessage,
                                errorCtrl.getErrorMessage(err));
                        } else {
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
    Article.findOne({_id: req.params.articleId})
        .populate('_author _category', 'username nickname avatar name')
        .exec(function (err, article) {
            if (err)
                errorCtrl.sendErrorMessage(res, 500,
                    defaultErrorMessage, []);
            else if (!article)
                errorCtrl.sendErrorMessage(res, 404,
                    'Bài post này không tồn tại', []);
            else {
                article.readCount ++;
                article.save((err) => {
                    if (err) {
                        errorHandler.sendSystemError(res, err);
                    } else {
                        res.status(200).json({
                            success: true,
                            resultMessage: defaultSuccessMessage,
                            article: article
                        });
                    }
                });
            }
        });
};

module.exports.getAllArticles = (req, res) => {
    if (req.query.search == undefined || req.query.search == "") {
        console.log("Action get all");
        Article.find({}).skip((req.query.page - 1) * limitPage).limit(limitPage)
            .populate('_author _category', 'username nickname avatar name').exec(function (err, articles) {
            if (err)
                errorCtrl.sendErrorMessage(res, 500,
                    defaultErrorMessage, []);
            else if (!articles)
                errorCtrl.sendErrorMessage(res, 404,
                    'Không có bài báo nào', []);
            else {
                Article.count().exec(function (err, count) {
                    let pages;
                    if (count % limitPage == 0)
                        pages = count / limitPage;
                    else
                        pages = parseInt((count / limitPage) + 1);
                    //Arrange list articles in dateCreated and read, comment, like order
                    if (req.query.action == "trending") {
                        console.log('trending action');
                        articles.sort(function (a, b) {
                            return sortTrendingArticle(a, b);
                        });
                    }
                    else if (req.query.action == "popular") {
                        console.log('popular action');
                        articles.sort(function (a, b) {
                            return sortPopularArticle(a, b);
                        });
                    }
                    else {
                        console.log('hot news action');
                        articles.sort(function (a, b) {
                            return sortHotNewsArticle(a, b);
                        });
                    }
                    res.status(200).json({
                        success: true,
                        resultMessage: defaultSuccessMessage,
                        articles: articles,
                        pages: pages
                    });
                });
            }
        });
    }
    else {
        console.log("Action search");
        Article.find({$text: {$search: req.query.search}})
            .populate('_author _category', 'username nickname avatar name')
            .skip((req.query.page - 1) * limitPage).limit(limitPage)
            .exec((err, articles) => {
                if (err)
                    errorCtrl.sendErrorMessage(res, 500,
                        defaultErrorMessage,
                        errorCtrl.getErrorMessage(err));

                else if (!articles)
                    errorCtrl.sendErrorMessage(res, 404,
                        'Không có bài báo nào', []);

                else {
                    Article.count({$text: {$search: req.query.search}}).exec(function (err, count) {
                        let pages;
                        if (count % limitPage == 0)
                            pages = count / limitPage;
                        else
                            pages = parseInt((count / limitPage) + 1);
                        //Arrange list articles in dateCreated order
                        articles.sort(function (a, b) {
                            return (parseInt(a.dateCreated / 604800) < parseInt(b.dateCreated) / 604800) ? 1 : -1;
                        });
                        articles.sort(function (a, b) {
                            return (a.readCount < b.readCount) ? 1 : -1;
                        });
                        res.status(200).json({
                            success: true,
                            resultMessage: defaultSuccessMessage,
                            articles: articles,
                            pages: pages
                        });
                    });
                }
            });
    }
};

function sortPopularArticle(a, b) {

    var o1 = parseInt(a.dateCreated / 604800);
    var o2 = parseInt(b.dateCreated / 604800);

    var p1 = a.commentCount;
    var p2 = b.commentCount;

    if (o1 < o2) return 1;
    if (o1 > o2) return -1;
    if (p1 < p2) return 1;
    if (p1 > p2) return -1;
    return 0;
}

function sortTrendingArticle(a, b) {

    var o1 = parseInt(a.dateCreated / 604800);
    var o2 = parseInt(b.dateCreated / 604800);

    var p1 = a.likeCount;
    var p2 = b.likeCount;

    if (o1 < o2) return 1;
    if (o1 > o2) return -1;
    if (p1 < p2) return 1;
    if (p1 > p2) return -1;
    return 0;
}

function sortHotNewsArticle(a, b) {

    var o1 = parseInt(a.dateCreated / 604800);
    var o2 = parseInt(b.dateCreated / 604800);

    var p1 = a.readCount;
    var p2 = b.readCount;

    if (o1 < o2) return 1;
    if (o1 > o2) return -1;
    if (p1 < p2) return 1;
    if (p1 > p2) return -1;
    return 0;
}

//action: read, comment, share.
module.exports.doWithArticle = (req, res, action) => {
    Article.findOne({_id: req.params.articleId}, function (err, article) {
        if (err)
            errorCtrl.sendErrorMessage(res, 404,
                defaultErrorMessage, []);
        else if (!article)
            errorCtrl.sendErrorMessage(res, 404,
                'Bài post này không tồn tại', []);
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
                    req.body._user = req.headers._id;
                    req.body._article = req.params.articleId;
                    if (req.body.replyFor != undefined && req.body.replyFor != "") {
                        delete req.body._reply;
                        Comment.findOneAndUpdate({_id: req.body.replyFor}, {
                            $push: {
                                _reply: req.body
                                // _user: ObjectId(req.body._user),
                                // _category: ObjectId(req.body._category),
                                // message: req.body.message
                            }
                        }, {safe: true, upsert: true}, (err, comment) => {
                            if (err) {
                                errorCtrl.sendErrorMessage(res, 500,
                                    defaultErrorMessage,
                                    errorCtrl.getErrorMessage(err));
                                return;
                            }
                            else if (!comment) {
                                errorCtrl.sendErrorMessage(res, 404,
                                    "Bình luận này không tồn tại",
                                    errorCtrl.getErrorMessage(err));
                                return;
                            }
                            else {
                                res.status(200).json({
                                    success: true,
                                    resultMessage: defaultSuccessMessage,
                                    commentCount: article.commentCount
                                });
                            }
                        });
                    }
                    else {
                        Comment.create(req.body, function (err) {
                            if (err) {
                                errorCtrl.sendErrorMessage(res, 500,
                                    defaultErrorMessage,
                                    errorCtrl.getErrorMessage(err));
                            } else {
                                article.commentCount++;
                                article.save(function (err) {
                                    if (err) {
                                        errorCtrl.sendErrorMessage(res, 404,
                                            defaultErrorMessage,
                                            errorCtrl.getErrorMessage(err));
                                    } else {
                                        res.status(200).json({
                                            success: true,
                                            resultMessage: defaultSuccessMessage,
                                            commentCount: article.commentCount
                                        });
                                    }
                                });
                            }
                        });
                    }
                    break;
            }
        }
    })
};

module.exports.getCountLike = (req, res) => {
    Article.findOne({_id: req.params.articleId}, function (err, article) {
        if (err)
            errorCtrl.sendErrorMessage(res, 404,
                defaultErrorMessage, []);
        else if (!article)
            errorCtrl.sendErrorMessage(res, 404,
                'Bài post này không tồn tại', []);
        else {
            User.count({likedArticles: req.params.articleId}, function (err, count) {
                if (err) {
                    errorCtrl.sendErrorMessage(res, 404,
                        'Có lỗi xảy ra, vui lòng thử lại', []);
                }
                else {
                    res.status(200).json({
                        success: true,
                        resultMessage: defaultSuccessMessage,
                        countLikes: count
                    });
                }
            });
        }
    });
};

module.exports.getAllComments = (req, res) => {
    Comment.find({_article: req.params.articleId,}).skip((req.query.page - 1) * limitComment).limit(limitComment)
        .populate('_user _reply._user', 'username nickname avatar name').exec(function (err, comments) {
        if (err)
            errorCtrl.sendErrorMessage(res, 404,
                defaultErrorMessage, []);
        else if (!comments)
            errorCtrl.sendErrorMessage(res, 404,
                'Không có bình luận nào', []);
        else {
            Comment.count({
                _article: req.params.articleId,
                replyFor: undefined
            }).exec(function (err, count) {
                let pages;
                if (count % limitComment == 0)
                    pages = count / limitComment;
                else
                    pages = parseInt((count / limitComment) + 1);
                //Arrange list articles in dateCreated order
                comments.sort(function (a, b) {
                    return (a.dateCommented < b.dateCommented) ? -1 : 1;
                });
                res.status(200).json({
                    success: true,
                    resultMessage: defaultSuccessMessage,
                    comments: comments,
                    pages: pages
                });
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
    delete article.likeCount;
    return true;
}
