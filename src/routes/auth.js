const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { HttpError } = require('../http');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, accept) => accept(null, file.mimetype.startsWith('image/')),
});

function startSession(req, user) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.user = { id: user.id, username: user.username };
      resolve();
    });
  });
}

function requireFields(body, fields) {
  for (const field of fields) {
    if (typeof body[field] !== 'string' || !body[field].trim()) {
      throw new HttpError(400, `${field} is required`);
    }
  }
}

module.exports = function authRouter({ pool }) {
  const router = express.Router();

  router.post('/signup', upload.single('avatar'), async (req, res) => {
    requireFields(req.body, ['username', 'email', 'password']);
    const username = req.body.username.trim();
    const email = req.body.email.trim();
    const passwordHash = await bcrypt.hash(req.body.password, 10);

    let result;
    try {
      [result] = await pool.query(
        'INSERT INTO Users (username, email, password_hash, avatar, avatar_type) VALUES (?, ?, ?, ?, ?)',
        [username, email, passwordHash, req.file?.buffer ?? null, req.file?.mimetype ?? null],
      );
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'Username or email already in use');
      throw err;
    }

    const user = { id: result.insertId, username };
    await startSession(req, user);
    res.status(201).json(user);
  });

  router.post('/login', async (req, res) => {
    requireFields(req.body, ['username', 'password']);
    const [[user]] = await pool.query(
      'SELECT id, username, password_hash FROM Users WHERE username = ?',
      [req.body.username.trim()],
    );
    if (!user || !(await bcrypt.compare(req.body.password, user.password_hash))) {
      throw new HttpError(401, 'Wrong username or password');
    }
    await startSession(req, user);
    res.json({ id: user.id, username: user.username });
  });

  router.post('/logout', (req, res, next) => {
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie('connect.sid');
      if (req.accepts(['html', 'json']) === 'html') return res.redirect('/login');
      res.sendStatus(204);
    });
  });

  router.get('/me', (req, res) => {
    if (!req.session.user) throw new HttpError(401, 'Not logged in');
    res.json(req.session.user);
  });

  return router;
};
