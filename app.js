let express = require('express'),
    database = require('./config/database'),
    path = require('path'),
    logger = require('morgan'),
    bodyParser = require('body-parser');

//Define models
require('./models/user.model');
require('./models/category.model');
require('./models/article.model');

//Define routers
let user = require('./routes/user.router'),
    index = require('./routes/index'),
    category = require('./routes/category.router'),
    article = require('./routes/article.router');

let app = express();
database.connect();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/api/v1/users', user);
app.use('/api/v1/categories', category);
app.use('/api/v1/articles', article);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
