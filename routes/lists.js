var express = require('express');
var router = express.Router();
const path = require('path');
const db = require('../scripts/db'); 
const axios = require('axios'); 
router.post('/saveFullList', async (req, res) => {
    const userId = req.session.userId;
    const { listName, description, listIconUrl, selectedDrinks } = req.body;

    if (!userId) {}
    if (!listName || !selectedDrinks || !Array.isArray(selectedDrinks) || selectedDrinks.length === 0) {
    }

    const connection = db.promise(); 

    try {
        await connection.beginTransaction();

        const successfullyProcessedDrinkApiIds = new Set();
        for (const selectedDrink of selectedDrinks) {
            const drinkApiId = selectedDrink.id;
            if (!drinkApiId) {  }

            const [existingDrinks] = await connection.query('SELECT api_id FROM Drinks WHERE api_id = ?', [drinkApiId]);

            if (existingDrinks.length > 0) {
                successfullyProcessedDrinkApiIds.add(drinkApiId);
                console.log(`Drink ${drinkApiId} already in local DB.`);
            } else {
                const cocktailDbResponse = await axios.get(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${drinkApiId}`);
                const drinkData = cocktailDbResponse.data.drinks ? cocktailDbResponse.data.drinks[0] : null;

                if (drinkData) {
                    const newDrink = { 
                        api_id: drinkData.idDrink, name: drinkData.strDrink,
                        alternate_name: drinkData.strDrinkAlternate || null, tags: drinkData.strTags || null,
                        category: drinkData.strCategory || null, iba_category: drinkData.strIBA || null,
                        alcoholic_status: drinkData.strAlcoholic || null, glass_type: drinkData.strGlass,
                        instructions: drinkData.strInstructions || null, thumbnail_url: drinkData.strDrinkThumb || null,
                        image_source_url: drinkData.strImageSource || null
                    };
                    await connection.query( // Use connection.query
                        `INSERT INTO Drinks (api_id, name, alternate_name, tags, category, iba_category, alcoholic_status, glass_type, instructions, thumbnail_url, image_source_url)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
                        [newDrink.api_id, newDrink.name, newDrink.alternate_name, newDrink.tags, newDrink.category, newDrink.iba_category, newDrink.alcoholic_status, newDrink.glass_type, newDrink.instructions, newDrink.thumbnail_url, newDrink.image_source_url]
                    );
                    successfullyProcessedDrinkApiIds.add(drinkApiId);
                    console.log(`Inserted/Updated drink ${drinkApiId} into local DB.`);
                } else { }
            }
        }

        if (selectedDrinks.length > 0 && successfullyProcessedDrinkApiIds.size === 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'None of the selected drinks could be processed. List not saved.' });
        }

        let newListId;
        try {
            const [listResult] = await connection.query( // Use connection.query
                'INSERT INTO UserLists (user_id, list_name, description, list_icon_url) VALUES (?, ?, ?, ?)',
                [userId, listName, description || null, listIconUrl || null]
            );
            newListId = listResult.insertId;
            console.log(`New list created with ID: ${newListId} for user ${userId}`);
        } catch (listInsertError) {
            await connection.rollback();
            if (listInsertError.code === 'ER_DUP_ENTRY') { }
            console.error('Error inserting new list:', listInsertError);
            return res.status(500).json({ error: 'Failed to create the new list.' });
        }

        if (newListId && successfullyProcessedDrinkApiIds.size > 0) {
            const userListDrinksValues = Array.from(successfullyProcessedDrinkApiIds).map(validDrinkId => [newListId, validDrinkId]);
            try {
                await connection.query( // Use connection.query
                    'INSERT INTO UserListDrinks (list_id, drink_api_id) VALUES ?',
                    [userListDrinksValues]
                );
                console.log(`${successfullyProcessedDrinkApiIds.size} drinks added to list ${newListId}`);
            } catch (linkError) {
                await connection.rollback();
                console.error('Error inserting into UserListDrinks:', linkError);
                return res.status(500).json({ error: 'Failed to add drinks to the new list after list creation.' });
            }
        }

        await connection.commit();
        req.session.listDetails = null;
        res.status(201).json({ message: 'List and drinks saved successfully!', listId: newListId });

    } catch (error) {
        try {
            if (connection && typeof connection.rollback === 'function') { // Check if rollback is a function
                 await connection.rollback(); 
                 console.log("Transaction rolled back due to error.");
            }
        } catch (rollbackError) {
            console.error("Error during rollback:", rollbackError);
        }
        console.error('Overall error in saveFullList:', error);
        res.status(500).json({ error: 'An unexpected error occurred while saving the list.' });
    }
});

router.get('/getUserLists', async (req, res) => { // Changed to async
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const [rows] = await db.promise().query(`
            SELECT ul.list_id, ul.list_name, ul.list_icon_url, COUNT(uld.drink_api_id) AS drink_count
            FROM UserLists ul
            LEFT JOIN UserListDrinks uld ON ul.list_id = uld.list_id
            WHERE ul.user_id = ?
            GROUP BY ul.list_id
            ORDER BY ul.list_name ASC
        `, [userId]);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching user lists:", err);
        return res.status(500).json({ error: 'Database error while fetching lists' });
    }
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