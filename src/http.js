class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function requireUser(req, res, next) {
  if (!req.session.user) throw new HttpError(401, 'Not logged in');
  next();
}

function requireUserPage(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

function parseId(value, label = 'id') {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, `Invalid ${label}`);
  return id;
}

module.exports = { HttpError, requireUser, requireUserPage, parseId };
