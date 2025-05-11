var express = require('express');
var router = express.Router();
const path = require('path');

const db = require('../scripts/db');


router.get('/searchUsers', function(req, res) {
    let curUser;
    if(!req.session.userId) {
        console.error('Not logged in :');
        return res.status(500).json({ error: 'not logged in' });
    }

    curUser = req.session.userId;

    const searchVal = req.query.search;

    console.log("SEARCHED VALUE: ", searchVal);

    let dbSearch = `
        SELECT Users.id, Users.username,
        CASE
            WHEN Follows.following_id IS NOT NULL THEN TRUE
            ELSE FALSE
        END AS isFriend
        FROM Users
        LEFT JOIN Follows ON Users.id = Follows.following_id AND Follows.follower_id = ?
        WHERE Users.username LIKE ? AND Users.username != ?
        ORDER BY RAND()
        LIMIT 10
    `;


    db.query(dbSearch, [curUser, `%${searchVal}%`, curUser], (err, results) => {
        // res.json()
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database query failed' });
        }

        const users = results.map((user) => ({
            id: user.id,
            name: user.username,
            isFriend: user.isFriend
        }));

        console.log(users);

        res.json({ users });
    });

});


router.post('/toggleFriend', function(req, res) {
    const { friend, removing } = req.body;

    if(removing) {

        let statement = `DELETE FROM Follows WHERE follower_id = ${req.session.userId} AND following_id = ?`;

        db.query(statement, [friend], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database query failed' });
            }
        });

        return res.sendStatus(201);
    }

    let statement = `INSERT INTO Follows VALUES (${req.session.userId}, ?)`;

    // adding in user
    db.query(statement, [friend], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.sendStatus(200);
    });

});





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
