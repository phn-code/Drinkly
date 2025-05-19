var express = require('express');
var router = express.Router();
const path = require('path');
const db = require('../scripts/db'); 

router.post('/saveFullList', async (req, res) => {
    const { selectedDrinks } = req.body;
    const userId = req.session.userId;
    const { listName, listDescription, selectedListIcon } = req.session.listDetails || {};

    if (!userId || !listName || !selectedDrinks) {
        return res.status(400).json({ error: 'Missing required session data or selected drinks' });
    }

    const conn = db;

    try {
        const [result] = await conn.execute(
            `INSERT INTO UserLists (user_id, list_name, description, list_icon_url) VALUES (?, ?, ?, ?)`,
            [userId, listName, listDescription || null, selectedListIcon || null]
        );  
    
        const listId = result.insertId;
        const insertValues = selectedDrinks.map(drink => [listId, drink.id]);
    
        await db.query(
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
        const [rows] = await db.query(`
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

module.exports = router;
