console.log('Server starting / App initializing...');
var express = require('express');
var app = express();

var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require('express-session');

var indexRouter = require('./routes/index');
var loginRouter = require('./routes/login');
var personRouter = require('./routes/friends');
var drinksRouter = require('./routes/drinks');
var listsRouter = require('./routes/lists');
const listRoutes = require('./routes/lists');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    secret: 'test23',
    resave: false,
    saveUninitialized: false,
    cookie: {
         maxAge: 3600000,
         sameSite: 'lax'
    }
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/loginUser', loginRouter);
app.use('/friends', personRouter);
app.use('/drinks', drinksRouter);
app.use('/lists', listsRouter);
app.use('/lists', listRoutes);

module.exports = app;
