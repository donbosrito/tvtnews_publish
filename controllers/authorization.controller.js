'use strict';

let mongoose = require('mongoose'),
    jwt = require('jsonwebtoken'),
    development = require('../config/development'),
    errorHandler = require('./error.controller.js');

let User = mongoose.model('User');

module.exports.getAccessToken = (userId, username) => {
    // Generate new token for this user
    return jwt.sign({userId: userId, username: username}, development.token.secretKey, {expiresIn: '100d'});
};

/***
 * Authenticate user
 * @param req
 * @param res
 * @param next
 */
module.exports.authenticate = (req, res, next) => {
    let userId = req.headers._id;
    let accessToken = req.headers.access_token;

    if (!accessToken || !userId) {
        errorHandler.sendErrorMessage(res, 401,
            'Không thể xác thực người dùng. Thiếu thông tin xác thực', []);
    }

    // Authenticate token string
    else {
        try {
            // Decode token string
            let decoded = jwt.verify(accessToken, development.token.secretKey);

            // Find token in database
            User.findOne({_id: decoded.userId, accessToken: accessToken}, function (err, user) {
                if (err) {
                    errorHandler.sendErrorMessage(res, 401,
                        'Không thể xác thực người dùng. Vui lòng thử lại!',
                        errorHandler.getErrorMessage(err));
                } else {
                    if (user && user._id == userId) {
                        next();
                    } else {
                        errorHandler.sendErrorMessage(res, 401,
                            'Thông tin xác thực không chính xác', []);
                    }
                }
            });

        } catch (err) {
            errorHandler.sendErrorMessage(res, 401,
                'Access token hết hạn hoặc không chính xác!',
                errorHandler.getErrorMessage(err));
        }
    }
};