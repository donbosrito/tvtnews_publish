/**
 * Created by apismantis on 03/12/2016.
 */

let mongoose = require('mongoose'),
    config = require('../config/app');

let categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required.']
    },
});

mongoose.model('Category', categorySchema);