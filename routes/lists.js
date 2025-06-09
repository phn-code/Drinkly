var express = require('express');
var router = express.Router();
const path = require('path');
const pool = require('../scripts/db');  


router.post('/saveFullList', async (req, res) => {
    const { selectedDrinks } = req.body;
    const userId = req.session.userId;
    const { listName, listDescription, selectedListIcon } = req.session.listDetails || {};

    if (!userId || !listName || !selectedDrinks) {
        return res.status(400).json({ error: 'Missing required session data or selected drinks' });
    }

    try {
        // Insert the list
        const [result] = await pool.execute(
            `INSERT INTO UserLists (user_id, list_name, description, list_icon_url) VALUES (?, ?, ?, ?)`,
            [userId, listName, listDescription || null, selectedListIcon || null]
        );

        const listId = result.insertId;
        const insertValues = selectedDrinks.map(drink => [listId, drink.id]);

        // Insert the drinks for the list - batch insert
        await pool.query(
            `INSERT INTO UserListDrinks (list_id, drink_api_id) VALUES ?`,
            [insertValues]
        );

        req.session.listDetails = null;
        res.json({ message: 'List and drinks saved successfully!' });

    } catch (err) {
        console.error('Error saving full list:', err);
        res.status(500).json({ error: 'Failed to save list' });
    }
});

router.get('/getUserLists', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const [rows] = await pool.query(`
            SELECT ul.list_id, ul.list_name, ul.list_icon_url, COUNT(uld.drink_api_id) AS drink_count
            FROM UserLists ul
            LEFT JOIN UserListDrinks uld ON ul.list_id = uld.list_id
            WHERE ul.user_id = ?
            GROUP BY ul.list_id
        `, [userId]);

        res.json(rows);
    } catch (err) {
        console.error("Error fetching user lists:", err);
        res.status(500).json({ error: 'Database error' });
    }
});

router.delete('/:id', async (req, res) => {
    const listId = req.params.id;
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const [rows] = await pool.query(`SELECT * FROM UserLists WHERE list_id = ? AND user_id = ?`, [listId, userId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'List not found or does not belong to user' });
        }

        await pool.query(`DELETE FROM UserListDrinks WHERE list_id = ?`, [listId]);
        await pool.query(`DELETE FROM UserLists WHERE list_id = ?`, [listId]);
        res.status(200).json({ message: 'List deleted successfully' });
    } catch (err) {
        console.error('Error deleting list:', err);
        res.status(500).json({ error: 'Failed to delete list' });
    }
});

router.get('/:list_id/drinks', async (req, res) => {
    const { list_id } = req.params;

    try {
        const [rows] = await pool.query(`
            SELECT drink_api_id
            FROM UserListDrinks
            WHERE list_id = ?
        `, [list_id]);

        const drinkIds = rows.map(row => row.drink_api_id);

        const drinkPromises = drinkIds.map(async (id) => {
            const res = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${id}`);
            const response = await res.json();
            return response.drinks?.[0];
        });

        const drinks = await Promise.all(drinkPromises);
        const filteredDrinks = drinks.filter(drink => drink); // remove nulls

        res.json(filteredDrinks);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch drinks from API.' });
    }
});

module.exports = router;
