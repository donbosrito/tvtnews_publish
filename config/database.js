let config = require('./development'),
    chalk = require('chalk'),
    mongoose = require('mongoose');

// Connect to database
module.exports.connect = function () {
    mongoose.connect(config.db.uri, function (err) {
        if (err) {
            console.error(chalk.red('Could not connect to mlab database!'));
            console.log(err);
        } else {
            // Enable database debug mode
            mongoose.set('debug', config.db.debug);
            console.info(chalk.bgGreen.bold('Connected to mlab database!'));
        }
    });
};

// Disconnect to database
module.exports.disconnect = function () {
    mongoose.disconnect(function (err) {
        if (err) {
            console.info(chalk.yellow('Can not disconnected to mlab database!'));
        } else {
            console.info(chalk.bgGreen.bold('Disconnected to mlab database!'));
        }
    });
};
