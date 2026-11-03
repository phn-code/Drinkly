const path = require('node:path');
const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const { HttpError, requireUserPage } = require('./http');
const authRouter = require('./routes/auth');
const drinksRouter = require('./routes/drinks');
const { listsRouter, LIST_ICONS } = require('./routes/lists');
const { usersRouter, friendsRouter } = require('./routes/users');

function pagesRouter() {
  const router = express.Router();
  const page = (view, title, extra = {}) => (req, res) => res.render(`pages/${view}`, { title, ...extra });

  router.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('pages/login', { title: 'Log In' });
  });
  router.use(requireUserPage);
  router.get('/', page('home', 'Home'));
  router.get('/drinks/:id', (req, res) => res.render('pages/drink', { title: 'Drink', drinkId: req.params.id }));
  router.get('/lists', page('lists', 'Your Lists', { listIcons: LIST_ICONS }));
  router.get('/lists/new', page('create-list', 'Add Drinks to List'));
  router.get('/friends', page('friends', 'Friends'));
  router.get('/about', page('about', 'About'));
  return router;
}

function createApp({ pool, cocktailDb, sessionSecret, isProduction = false, logRequests = true }) {
  const app = express();
  const deps = { pool, cocktailDb };

  app.set('views', path.join(__dirname, '..', 'views'));
  app.set('view engine', 'ejs');
  if (isProduction) app.set('trust proxy', 1);

  if (logRequests) app.use(morgan('dev'));
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000, sameSite: 'lax', httpOnly: true, secure: isProduction },
  }));
  app.use((req, res, next) => {
    res.locals.user = req.session.user ?? null;
    next();
  });

  app.use('/api/auth', authRouter(deps));
  app.use('/api/drinks', drinksRouter(deps));
  app.use('/api/lists', listsRouter(deps));
  app.use('/api/users', usersRouter(deps));
  app.use('/api/friends', friendsRouter(deps));
  app.use('/api', () => {
    throw new HttpError(404, 'Not found');
  });
  app.use(pagesRouter());

  app.use((req, res) => res.status(404).render('pages/not-found', { title: 'Not Found' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.name === 'MulterError' ? 400 : err.status || 500;
    if (status === 500) console.error(err);
    const message = status === 500 ? 'Something went wrong' : err.message;
    if (req.originalUrl.startsWith('/api/')) return res.status(status).json({ error: message });
    res.status(status).send(message);
  });

  return app;
}

module.exports = { createApp };
