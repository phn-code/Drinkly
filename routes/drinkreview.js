var express = require('express');
var router = express.Router();
const db = require('../scripts/db');

//adding a review
router.post('/', (req,res) =>{
    const { user_id, drink_api_id, review_score, review_text, times_drunk } = req.body;
       
    if (!user_id || !drink_api_id || review_score === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const query = 'INSERT INTO DrinkReview (user_id, drink_api_id, review_score, review_text, times_drunk) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [user_id, drink_api_id, review_score, review_text, times_drunk || 1], (err, result) => {
        if (err) {
            console.error('Error creating review:', err);
            return res.status(500).send('Database error');
        }
        res.status(201).json({ message: 'Review created', drink_review_id: result.insertId });
    });
});

//get all reviews for a certain drink
router.get('/drink/:drink_api_id', (req, res) => {
    const { drink_api_id } = req.params;
    const query = 'SELECT * FROM DrinkReview WHERE drink_api_id = ?';
    db.query(query, [drink_api_id], (err, result) => {
        if (err) {
            console.error('Error fetching reviews for drink:', err);
            return res.status(500).send('Database error');
        }
        res.status(200).json(result);
    });
});

//get all reviews from a certain user
router.get('/user/:user_id', (req, res) => {
    const { user_id } = req.params;
    const query = 'SELECT * FROM DrinkReview WHERE user_id = ?';
    db.query(query, [user_id], (err, result) => {
        if (err) {
            console.error('Error fetching reviews by user:', err);
            return res.status(500).send('Database error');
        }
        res.status(200).json(result);
    });

});

module.exports = router;
