'use strict';

let mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.ObjectId;

let commentSchema = new mongoose.Schema({
    _user: {
        type: ObjectId,
        ref: 'User',
        required: [true, 'User id is required.']
    },

    _article: {
        type: ObjectId,
        ref: 'Article',
        required: [true, 'Article id is required.']
    },

    dateCommented: {
        type: Number,
        set: getCurrentTime,
        default: getCurrentTime,
    },

    message: {
        type: String,
        required: [true, 'Message have not body']
    },

    _reply: [
        {
            _user: {
                type: ObjectId,
                ref: 'User',
                required: [true, 'User id is required']
            },
            dateCommented: {
                type: Number,
                set: getCurrentTime,
                default: getCurrentTime,
            },
            message: {
                type: String,
                required: [true, 'Message have not body']
            },
        }
    ]
});

function getCurrentTime() {
    return parseInt(new Date().getTime() / 1000);
}

mongoose.model('Comment', commentSchema);
