/**
 * Created by apismantis on 03/12/2016.
 */

var mongoose = require('mongoose'),
    config = require('../config/app');

var ObjectId = mongoose.Schema.ObjectId;

var articleSchema = new mongoose.Schema({
    _author: {
        type: ObjectId,
        ref: 'User'
    },

    _category: {
        type: ObjectId,
        ref: 'Category'
    },

    title: {
        type: String,
        required: [true, 'Title is required.']
    },

    poster: {
        type: String,
        default: config.article.defaultPoster
    },

    summary: String,

    body: {
        type: String,
        required: [true, 'Body is required.']
    },

    readCount: {
        type: Number,
        default: 0
    },

    likeCount: {
        type: Number,
        default: 0
    },

    shareCount: {
        type: Number,
        default: 0
    },

    commentCount: {
        type: Number,
        default: 0
    },

    dateCreated: {
        type: Number,
        set: getCurrentTime,
        default: getCurrentTime()
    },

    tags: [String]
});

function getCurrentTime() {
    return parseInt(new Date().getTime() / 1000);
}

articleSchema.index({ tags: 'text', title: 'text' });
mongoose.model('Article', articleSchema);
