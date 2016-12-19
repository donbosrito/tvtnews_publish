'use strict';

let errorHanlder = require('./error.controller');

// Get error message from error object
module.exports.getErrorMessage = (error) => {

    let errorMessages = [];

    if (error.errors) {
        Object.keys(error.errors).forEach((errorName) => {
            errorMessages.push(error.errors[errorName].message);
        });
    } else {
        errorMessages.push(error.message);
    }

    return errorMessages;
};

/**
 * Response an error
 * @param res: Response object
 * @param statusCode: Status code
 * @param resultMessage: Result message
 * @param errors: List of error message
 */
module.exports.sendErrorMessage = (res, statusCode, resultMessage, errors) => {
    res.status(statusCode).json({
        success: false,
        resultMessage: resultMessage,
        errorMessage: errors
    });
};

/***
 * Response system error when execute request
 * @param res
 * @param err
 */
module.exports.sendSystemError = (res, err) => {
    errorHanlder.sendErrorMessage(res, 500,
        'Có lỗi xảy ra. Vui lòng thử lại!',
        errorHanlder.getErrorMessage(err));
};