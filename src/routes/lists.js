const express = require('express');
const { HttpError, requireUser, parseId } = require('../http');
const { ensureDrinksCached } = require('../drinks');
const { inTransaction } = require('../db');

const LIST_ICONS = [1, 2, 3, 4, 5, 6].map((n) => `/images/list-icons/${n}.jpeg`);

const MAX_NAME_LENGTH = 100;
const MAX_DRINKS = 50;

function parseNewList(body = {}) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const iconUrl = body.iconUrl || null;
  const drinkIds = Array.isArray(body.drinkIds) ? body.drinkIds.map(String) : [];

  if (!name) throw new HttpError(400, 'name is required');
  if (name.length > MAX_NAME_LENGTH) throw new HttpError(400, `name must be at most ${MAX_NAME_LENGTH} characters`);
  if (drinkIds.length > MAX_DRINKS) throw new HttpError(400, `A list can hold at most ${MAX_DRINKS} drinks`);
  if (iconUrl !== null && !LIST_ICONS.includes(iconUrl)) throw new HttpError(400, 'Unknown icon');
  if (drinkIds.length === 0) throw new HttpError(400, 'Select at least one drink');
  return { name, description: description || null, iconUrl, drinkIds };
}

function listsRouter({ pool, cocktailDb }) {
  const router = express.Router();
  router.use(requireUser);

  router.get('/', async (req, res) => {
    const [rows] = await pool.query(
      `SELECT l.id, l.name, l.description, l.icon_url AS iconUrl, COUNT(ld.drink_api_id) AS drinkCount
       FROM UserLists l
       LEFT JOIN UserListDrinks ld ON ld.list_id = l.id
       WHERE l.user_id = ?
       GROUP BY l.id
       ORDER BY l.name`,
      [req.session.user.id],
    );
    res.json(rows);
  });

  router.post('/', async (req, res) => {
    const list = parseNewList(req.body);
    const drinkIds = await ensureDrinksCached(pool, cocktailDb, list.drinkIds);
    if (drinkIds.length === 0) throw new HttpError(400, 'None of the selected drinks exist');

    const id = await inTransaction(pool, async (conn) => {
      const [result] = await conn.query(
        'INSERT INTO UserLists (user_id, name, description, icon_url) VALUES (?, ?, ?, ?)',
        [req.session.user.id, list.name, list.description, list.iconUrl],
      );
      await conn.query('INSERT INTO UserListDrinks (list_id, drink_api_id) VALUES ?', [
        drinkIds.map((drinkId) => [result.insertId, drinkId]),
      ]);
      return result.insertId;
    }).catch((err) => {
      if (err.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'You already have a list with that name');
      throw err;
    });

    res.status(201).json({ id });
  });

  router.delete('/:id', async (req, res) => {
    const [result] = await pool.query('DELETE FROM UserLists WHERE id = ? AND user_id = ?', [
      parseId(req.params.id),
      req.session.user.id,
    ]);
    if (result.affectedRows === 0) throw new HttpError(404, 'List not found');
    res.sendStatus(204);
  });

  router.get('/:id/drinks', async (req, res) => {
    const listId = parseId(req.params.id);
    const [[list]] = await pool.query('SELECT id FROM UserLists WHERE id = ? AND user_id = ?', [
      listId,
      req.session.user.id,
    ]);
    if (!list) throw new HttpError(404, 'List not found');
    const [rows] = await pool.query(
      `SELECT d.api_id AS id, d.name, d.thumbnail_url AS thumbnail
       FROM UserListDrinks ld
       JOIN Drinks d ON d.api_id = ld.drink_api_id
       WHERE ld.list_id = ?
       ORDER BY ld.added_at, d.name`,
      [listId],
    );
    res.json(rows);
  });

  return router;
}

module.exports = { listsRouter, LIST_ICONS };
