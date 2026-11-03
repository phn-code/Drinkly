const express = require('express');
const { HttpError, requireUser, parseId } = require('../http');

const avatarUrl = (row) => (row.hasAvatar ? `/api/users/${row.id}/avatar` : null);

function usersRouter({ pool }) {
  const router = express.Router();
  router.use(requireUser);

  // Popularity rank is by follower count; users nobody follows have no rank.
  router.get('/', async (req, res) => {
    const me = req.session.user.id;
    const search = typeof req.query.search === 'string' ? req.query.search : '';
    const [rows] = await pool.query(
      `WITH Ranked AS (
         SELECT following_id, DENSE_RANK() OVER (ORDER BY COUNT(*) DESC) AS popularityRank
         FROM Follows
         GROUP BY following_id
       )
       SELECT u.id, u.username, u.avatar IS NOT NULL AS hasAvatar,
              f.following_id IS NOT NULL AS isFriend, r.popularityRank
       FROM Users u
       LEFT JOIN Follows f ON f.following_id = u.id AND f.follower_id = ?
       LEFT JOIN Ranked r ON r.following_id = u.id
       WHERE u.username LIKE ? AND u.id <> ?
       ORDER BY RAND()
       LIMIT 10`,
      [me, `%${search.replace(/[\\%_]/g, '\\$&')}%`, me],
    );
    res.json(rows.map((row) => ({
      id: row.id,
      username: row.username,
      avatarUrl: avatarUrl(row),
      isFriend: Boolean(row.isFriend),
      popularityRank: row.popularityRank,
    })));
  });

  router.get('/:id/avatar', async (req, res) => {
    const [[row]] = await pool.query('SELECT avatar, avatar_type FROM Users WHERE id = ?', [parseId(req.params.id)]);
    if (!row?.avatar) throw new HttpError(404, 'No avatar');
    res.set({ 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'" });
    res.type(row.avatar_type).send(row.avatar);
  });

  return router;
}

function friendsRouter({ pool }) {
  const router = express.Router();
  router.use(requireUser);

  router.get('/', async (req, res) => {
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.avatar IS NOT NULL AS hasAvatar
       FROM Follows f
       JOIN Users u ON u.id = f.following_id
       WHERE f.follower_id = ?
       ORDER BY u.username`,
      [req.session.user.id],
    );
    res.json(rows.map((row) => ({ id: row.id, username: row.username, avatarUrl: avatarUrl(row), isFriend: true })));
  });

  router.put('/:id', async (req, res) => {
    const friendId = parseId(req.params.id);
    if (friendId === req.session.user.id) throw new HttpError(400, 'You cannot follow yourself');
    try {
      await pool.query(
        'INSERT INTO Follows (follower_id, following_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE follower_id = follower_id',
        [
          req.session.user.id,
          friendId,
        ],
      );
    } catch (err) {
      if (err.code === 'ER_NO_REFERENCED_ROW_2') throw new HttpError(404, 'User not found');
      throw err;
    }
    res.sendStatus(204);
  });

  router.delete('/:id', async (req, res) => {
    await pool.query('DELETE FROM Follows WHERE follower_id = ? AND following_id = ?', [
      req.session.user.id,
      parseId(req.params.id),
    ]);
    res.sendStatus(204);
  });

  return router;
}

module.exports = { usersRouter, friendsRouter };
