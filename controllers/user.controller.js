'use strict';

let mongoose = require('mongoose'),
    chalk = require('chalk'),
    authController = require('./authorization.controller.js'),
    errorHandler = require('./error.controller.js');

let User = mongoose.model('User'),
    Article = mongoose.model('Article');

let defaultErrorMessage = 'Có lỗi xảy ra. Vui lòng thử lại!',
    defaultSuccessMessage = 'Thực hiện thành công',
    limitUser = 15,
    limitArticle = 15;

// Check user info is valid or invalid
function isValidUser(user) {
    if (user.typeMember != 'ADMIN' && user.typeMember != 'USER' && user.typeMember != 'AUTHOR')
        return false;

    if (!user.username || !user.password)
        return false;

    delete user.articleCount;
    delete user.likedArticles;
    return true;
}

// Save token and response user info
function responseUserInfo(res, user, token) {
    user.accessToken = token;

    User.update({_id: user._id}, user, {new: true}, function (err) {
        if (err) {
            errorHandler.sendErrorMessage(res, 422,
                defaultErrorMessage, errorHandler.getErrorMessage(err));
        } else {
            res.status(200).json({
                success: true,
                resultMessage: defaultSuccessMessage,
                user: user.toJSONPrivate()
            });
        }
    });
}

/**
 * Sign up new account
 * @param req: Request body
 * @param res: Response
 */
module.exports.signUp = (req, res) => {
    // Check request data
    if (!isValidUser(req.body)) {
        errorHandler.sendErrorMessage(res, 400,
            'Bạn chưa điền số tên tài khoản hoặc mật khẩu', []);
        return;
    }

    User.findOne({username: req.body.username}, (err, user) => {
        // Has an error when find user
        if (err) {
            errorHandler.sendSystemError(res, err);
        }

        // Existing the same user in database
        else if (user) {
            errorHandler.sendErrorMessage(res, 409,
                'Tài khoảng này đã được đăng ký. ' +
                'Vui lòng đăng nhập hoặc tạo tài khoản bằng tên tài khoản khác', []);
        }

        // Create new account
        else {
            User.create(req.body, function (err, user) {
                if (err || !user) {
                    errorHandler.sendSystemError(res, err);
                }
                else {
                    let token = authController.getAccessToken(user._id, user.username);
                    responseUserInfo(res, user, token);
                }
            });
        }
    });
};

/**
 * Sign in account
 * @param req: Request body
 * @param res
 */
module.exports.signIn = (req, res) => {
    // Check request data
    if (!req.body.username || !req.body.password) {
        errorHandler.sendErrorMessage(res, 400, 'Bạn chưa điền tên tài khoản hoặc mật khẩu', []);
        return;
    }

    // Authenticate user
    User.findOne({username: req.body.username},
        function (err, user) {
            // Has an error when find user
            if (err) {
                errorHandler.sendSystemError(res, err);
                return;
            }

            // Wrong email or password
            if (!user) {
                errorHandler.sendErrorMessage(res, 401,
                    'Tài khoản này không tồn tại', []);
            }
            else {
                if (user.authenticate(req.body.password)) {
                    let token = authController.getAccessToken(user._id, user.username);

                    if (token) {
                        responseUserInfo(res, user, token);
                    } else {
                        errorHandler.sendSystemError(res, err);
                    }
                } else {
                    errorHandler.sendErrorMessage(res, 401,
                        'Sai mật khẩu đăng nhập', []);
                }
            }
        });
};

/***
 * Sign in with Facebook
 * @param req
 * @param res
 */
module.exports.signInWithFacebook = (req, res) => {
    let typeAccountId = req.body.typeAccountId;
    let typeAccount = req.body.typeAccount;

    if (!typeAccount || !typeAccountId) {
        errorHandler.sendErrorMessage(res, 400, 'Thiếu thông tin đăng nhập', []);
        return;
    }

    User.findOne({typeAccount: typeAccount, typeAccountId: typeAccountId}, (err, user) => {
        if (err) {
            errorHandler.sendSystemError(res, err);
            return;
        }

        if (!user) {
            errorHandler.sendErrorMessage(res, 401, 'Người dùng chưa đăng ký', []);
            return;
        }

        let token = authController.getAccessToken(user._id, user.username);
        if (token) {
            responseUserInfo(res, user, token);
        } else {
            errorHandler.sendSystemError(res, err);
        }
    });
};

/***
 * Get user info
 * @param req
 * @param res
 */
module.exports.getUserInfo = (req, res) => {
    User.findOne({_id: req.params.userId}, function (err, user) {
        if (err)
            errorCtrl.sendErrorMessage(res, 404,
                defaultErrorMessage, []);
        else if (!user)
            errorCtrl.sendErrorMessage(res, 404,
                'Người dùng này không tồn tại', []);
        else {
            res.status(200).json({
                success: true,
                resultMessage: defaultSuccessMessage,
                user: user.toJSONPrivate()
            });
        }
    });
};

/***
 * Update profile
 * @param req
 * @param res
 */
module.exports.updateProfile = (req, res) => {
    // Update another user's profile
    if (req.headers._id != req.params.userId) {
        errorHandler.sendErrorMessage(res, 400, 'Bạn không thể cập nhật profile của người khác được', []);
        return;
    }

    User.findOneAndUpdate({_id: req.params.userId}, req.body, {new: true, runValidators: true}, (err, user) => {
        // Has an error when find user
        if (err) {
            errorHandler.sendSystemError(res, err);
            return;
        }

        else {
            res.status(200).json({
                success: true,
                resultMessage: defaultSuccessMessage,
                user: user.toJSON()
            });
        }
    });
};

module.exports.getAllUsers = (req, res) => {
    User.find({}).skip((req.query.page - 1) * limitUser).limit(limitUser).exec(function (err, users) {
        // Has an error when find user
        if (err) {
            errorHandler.sendSystemError(res, err);
            return;
        }

        if (!users) {
            errorHandler.sendErrorMessage(res, 404, 'Không có tài khoản nào trong hệ thống', []);
        }
        else {
            User.count().exec(function (err, count) {
                let pages;
                if (count % limitArticle == 0)
                    pages = count / limitArticle;
                else
                    pages = parseInt((count / limitArticle) + 1);
                res.status(200).json({
                    success: true,
                    resultMessage: defaultSuccessMessage,
                    users: users,
                    pages: pages
                });
            });
        }
    });
};

module.exports.likeArticle = (req, res) => {
    let userId = req.params.userId,
        articleId = req.body._article;

    if (!articleId) {
        errorHandler.sendErrorMessage(res, 400, 'Thiếu ID bài báo', []);
        return;
    }

    User.findOne({_id: userId}, (err, user) => {
        if (err) {
            errorHandler.sendSystemError(res, err);
            return;
        }

        // User not found
        if (!user) {
            errorHandler.sendErrorMessage(res, 404, 'Người dùng không tồn tại', []);
            return;
        }

        // Check like article
        if (isLiked(articleId, user.likedArticles)) {
            errorHandler.sendErrorMessage(res, 400, 'Bạn đã like bài báo này rồi', []);
            return;
        }

        // Like Article
        Article.findOne({_id: articleId}, function (err, article) {
            if (err || !article) {
                errorCtrl.sendErrorMessage(res, 404,
                    'Bài báo này không tồn tại', []);
            }
            else {
                article.likeCount++;
                article.save(function (err, updatedArticle) {
                    if (err) {
                        errorCtrl.sendErrorMessage(res, 404,
                            defaultErrorMessage,
                            errorCtrl.getErrorMessage(err));
                    } else {
                        user.likedArticles.push(article);
                        user.save((err) => {
                            if (err) {
                                errorHandler.sendSystemError(res, err);
                            } else {
                                res.status(200).json({
                                    success: true,
                                    resultMessage: defaultSuccessMessage
                                });
                            }
                        });
                    }
                });
            }
        });
    });
};

module.exports.getAllArticleByUser = (req, res) => {
    Article.find({_author: req.params.userId})
        .skip((req.query.page - 1) * limitArticle).limit(limitArticle)
        .populate('_category _author', 'name username nickname avatar').exec(function (err, articles) {
        if (err)
            errorCtrl.sendErrorMessage(res, 500,
                defaultErrorMessage, []);
        else if (!articles)
            errorCtrl.sendErrorMessage(res, 404,
                'Không có bài báo nào', []);
        else {
            Article.count({_author: req.params.userId}).exec(function (err, count) {
                let pages;
                if (count % limitArticle == 0)
                    pages = count / limitArticle;
                else
                    pages = parseInt((count / limitArticle) + 1);
                //Arrange list articles in dateCreated order
                articles.sort(function (a, b) {
                    return (a.dateCreated < b.dateCreated) ? 1 : -1;
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
};

module.exports.unlikeArticle = (req, res) => {
    let userId = req.params.userId,
        articleId = req.body._article;

    if (!articleId) {
        errorHandler.sendErrorMessage(res, 400, 'Thiếu ID bài báo', []);
        return;
    }

    User.findOne({_id: userId}, (err, user) => {
        if (err) {
            errorHandler.sendSystemError(res, err);
            return;
        }

        // User not found
        if (!user) {
            errorHandler.sendErrorMessage(res, 404, 'Người dùng không tồn tại', []);
            return;
        }

        // Check like article
        if (!isLiked(articleId, user.likedArticles)) {
            errorHandler.sendErrorMessage(res, 400, 'Bạn đang chưa like bài báo này', []);
            return;
        }

        // Unlike article
        for (let i = 0; i < user.likedArticles.length; i++) {
            if (user.likedArticles[i] == articleId) {
                Article.findOne({_id: articleId}, function (err, article) {
                    if (err || !article) {
                        errorCtrl.sendErrorMessage(res, 404,
                            'Bài báo này không tồn tại', []);
                    }
                    else {
                        article.likeCount--;
                        article.save(function (err, updatedArticle) {
                            if (err) {
                                errorCtrl.sendErrorMessage(res, 404,
                                    defaultErrorMessage,
                                    errorCtrl.getErrorMessage(err));
                            } else {
                                user.likedArticles.splice(i, 1);
                                user.save((err) => {
                                    if (err) {
                                        errorHandler.sendSystemError(res, err);
                                    } else {
                                        res.status(200).json({
                                            success: true,
                                            resultMessage: defaultSuccessMessage
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
                break;
            }
        }
    });
};

module.exports.getLikedArticles = (req, res) => {
    let userId = req.params.userId;
    User.findOne({_id: userId}, {'likedArticles': {$slice: [(req.query.page - 1) * limitArticle, limitArticle]}})
        .populate('likedArticles', 'title summary poster category likeCount readCount commentCount dateCreated').exec(function (err, user) {
        if (err) {
            errorHandler.sendSystemError(res, err);
            return;
        }

        if (!user) {
            errorHandler.sendErrorMessage(res, 404, 'Người dùng không tồn tại', []);
            return;
        }

        let count = user.likedArticles.length,
            pages;
        if (count % limitArticle == 0)
            pages = count / limitArticle;
        else
            pages = parseInt((count / limitArticle) + 1);
        res.status(200).json({
            success: true,
            resultMessage: defaultSuccessMessage,
            likedArticles: user.likedArticles,
            pages: pages
        });
    });
};

function isLiked(articleId, listArticles) {
    for (let i = 0; i < listArticles.length; i++) {
        if (listArticles[i] == articleId)
            return true;
    }
    return false;
}
