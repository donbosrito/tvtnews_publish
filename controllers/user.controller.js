'use strict';

let mongoose = require('mongoose'),
    chalk = require('chalk'),
    authController = require('./authorization.controller.js'),
    errorHandler = require('./error.controller.js');

let User = mongoose.model('User');

let defaultErrorMessage = 'Có lỗi xảy ra. Vui lòng thử lại!',
    defaultSuccessMessage = 'Thực hiện thành công';

// Check user info is valid or invalid
function isValidUser(user) {
    if (!user.typeMember || (user.typeMember != 'ADMIN' && user.typeMember != 'USER' && user.typeMember != 'AUTHOR'))
        return false;

    if (!user.username || !user.password)
        return false;

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
                user: user.toJSON()
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
    if (!req.body.username || !req.body.password) {
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
        if (err || !user) {
            errorHandler.sendErrorMessage(res, 404,
                'Người dùng này không tồn tại', []);
        }
        else {
            res.status(200).json({
                success: true,
                resultMessage: defaultSuccessMessage,
                user: user.toJSONPublicProfile()
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
    // Check request data
    if (!req.params.userId) {
        errorHandler.sendErrorMessage(res, 400, 'Không đủ thông tin', []);
        return;
    }

    // Update another user's profile
    if (req.headers._userId != req.params.userId) {
        errorHandler.sendErrorMessage(res, 400, 'Bạn không thể cập nhật profile của người khác được', []);
        return;
    }

    User.findOneAndUpdate({_id: req.params.userId}, req.body, {new: true, runValidators: true}, (err, user) => {
        // Has an error when find user
        if (err) {
            errorHandler.sendSystemError(res, err);
            return;
        }

        if (!user) {
            errorHandler.sendErrorMessage(res, 404, 'Tài khoản không tồn tại', []);
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
