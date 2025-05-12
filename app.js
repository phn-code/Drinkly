console.log('Server starting / App initializing...');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const PORT = process.env.PORT || 3000;
const session = require('express-session');


var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');
var loginRouter = require('./routes/login');
var personRouter = require('./routes/friends');

var app = express();

app.use(express.json());
app.use(logger('dev'));
// app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({
    secret: 'test23',
    resave: false,
    saveUninitialized: false,
    cookie: {
         maxAge: 3600000, sameSite: 'lax'
    }
}));

app.use(express.json());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Phucs's different APIs
app.listen(PORT, () => { console.log(`Server is running at http://localhost:${PORT}`); });

var drinksRouter = require('./routes/drinks');
app.use('/drinks', drinksRouter);




app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/', indexRouter);
// app.use('/users', usersRouter);
app.use('/loginUser', loginRouter);
app.use('/friends', personRouter);


app.use(express.static(path.join(__dirname, 'public')));




module.exports = app;
