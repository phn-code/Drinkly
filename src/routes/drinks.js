const express = require('express');
const { HttpError, requireUser } = require('../http');
const { ensureDrinksCached } = require('../drinks');

module.exports = function drinksRouter({ pool, cocktailDb }) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    if (!search) throw new HttpError(400, 'search is required');
    res.json(await cocktailDb.search(search));
  });

  router.get('/:id', async (req, res) => {
    const drink = await cocktailDb.lookup(req.params.id);
    if (!drink) throw new HttpError(404, 'Drink not found');
    res.json(drink);
  });

  router.get('/:id/reviews', async (req, res) => {
    const [rows] = await pool.query(
      `SELECT r.id, u.username, r.score, r.body, r.times_drunk AS timesDrunk, r.created_at AS createdAt
       FROM DrinkReviews r
       JOIN Users u ON u.id = r.user_id
       WHERE r.drink_api_id = ?
       ORDER BY r.created_at DESC, r.id DESC`,
      [req.params.id],
    );
    res.json(rows);
  });

  router.post('/:id/reviews', requireUser, async (req, res) => {
    const score = Number(req.body.score);
    const timesDrunk = req.body.timesDrunk === undefined ? 1 : Number(req.body.timesDrunk);
    const body = typeof req.body.body === 'string' ? req.body.body.trim() : '';
    if (!Number.isInteger(score) || score < 0 || score > 5) throw new HttpError(400, 'score must be 0 to 5');
    if (!Number.isInteger(timesDrunk) || timesDrunk < 1) throw new HttpError(400, 'timesDrunk must be at least 1');
    if (!body) throw new HttpError(400, 'body is required');

    const [cached] = await ensureDrinksCached(pool, cocktailDb, [req.params.id]);
    if (!cached) throw new HttpError(404, 'Drink not found');

    const [result] = await pool.query(
      'INSERT INTO DrinkReviews (user_id, drink_api_id, times_drunk, score, body) VALUES (?, ?, ?, ?, ?)',
      [req.session.user.id, cached, timesDrunk, score, body],
    );
    res.status(201).json({ id: result.insertId });
  });

  return router;
};
