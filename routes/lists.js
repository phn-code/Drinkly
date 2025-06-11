var express = require('express');
var router = express.Router();
const path = require('path');
const db = require('../scripts/db'); // this uses createConnection
router.post('/saveFullList', (req, res) => {
    const { selectedDrinks } = req.body;
    const userId = req.session.userId;
    const { listName, listDescription, selectedListIcon } = req.session.listDetails || {};
    if (!userId || !listName || !selectedDrinks) {
        return res.status(400).json({ error: 'Missing required session data or selected drinks' });
    }

    db.query(
        `INSERT INTO UserLists (user_id, list_name, description, list_icon_url) VALUES (?, ?, ?, ?)`,
        [userId, listName, listDescription || null, selectedListIcon || null],
        (err, result) => {
            if (err) {
                console.error('Error inserting list:', err);
                return res.status(500).json({ error: 'Failed to save list' });
            }

            const listId = result.insertId;
            const insertValues = selectedDrinks.map(drink => [listId, drink.id]);

            db.query(
                `INSERT INTO UserListDrinks (list_id, drink_api_id) VALUES ?`,
                [insertValues],
                (err2) => {
                    if (err2) {
                        console.error('Error inserting drinks:', err2);
                        return res.status(500).json({ error: 'Failed to save list drinks' });
                    }

                    req.session.listDetails = null;
                    res.json({ message: 'List and drinks saved successfully!' });
                }
            );
        }
    );

});
router.get('/getUserLists', (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    db.query(`
    SELECT ul.list_id, ul.list_name, ul.list_icon_url, COUNT(uld.drink_api_id) AS drink_count
    FROM UserLists ul
    LEFT JOIN UserListDrinks uld ON ul.list_id = uld.list_id
    WHERE ul.user_id = ?
    GROUP BY ul.list_id
`, [userId], (err, rows) => {
        if (err) {
            console.error("Error fetching user lists:", err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });

});
router.delete('/:id', (req, res) => {
    const listId = req.params.id;
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    db.query(`SELECT * FROM UserLists WHERE list_id = ? AND user_id = ?`, [listId, userId], (err, rows) => {
        if (err) {
            console.error('Error checking list ownership:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (rows.length === 0) {
            return res.status(404).json({ error: 'List not found or does not belong to user' });
        }

        db.query(`DELETE FROM UserListDrinks WHERE list_id = ?`, [listId], (err2) => {
            if (err2) {
                console.error('Error deleting list drinks:', err2);
                return res.status(500).json({ error: 'Failed to delete drinks' });
            }

            db.query(`DELETE FROM UserLists WHERE list_id = ?`, [listId], (err3) => {
                if (err3) {
                    console.error('Error deleting list:', err3);
                    return res.status(500).json({ error: 'Failed to delete list' });
                }

                res.status(200).json({ message: 'List deleted successfully' });
            });
        });
    });

});
router.get('/:list_id/drinks', (req, res) => {
    const { list_id } = req.params;
    db.query(`SELECT drink_api_id FROM UserListDrinks WHERE list_id = ?`, [list_id], async (err, rows) => {
        if (err) {
            console.error('Error fetching drink IDs:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        const drinkIds = rows.map(row => row.drink_api_id);

        try {
            const drinkPromises = drinkIds.map(async (id) => {
                const res = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${id}`);
                const response = await res.json();
                return response.drinks?.[0];
            });

            const drinks = await Promise.all(drinkPromises);
            const filteredDrinks = drinks.filter(drink => drink);
            res.json(filteredDrinks);
        } catch (apiErr) {
            console.error('API fetch error:', apiErr);
            res.status(500).json({ error: 'Failed to fetch drinks from API.' });
        }
    });
});
module.exports = router;