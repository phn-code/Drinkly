var express = require('express');
var router = express.Router();
const path = require('path');

const db = require('../scripts/db');


router.get('/getRandomUsers', function(req, res) {

    db.query('SELECT * FROM Users ORDER BY RAND() LIMIT 10', (err, results) => {
        // res.json()
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database query failed' });
        }

        const users = results.map((user) => ({
            id: user.id,
            name: user.username
        }));

        console.log(users);

        res.json({ users });
    });

});


module.exports = router;
