var express = require('express');
var router = express.Router();

// const path = require('path');

const db = require('../scripts/db');
// const req = require('express/lib/request');

router.post('/', (req,res) => {


    const {username, password } = req.body;


    db.query('SELECT * FROM Users WHERE username = ?', [username], (err, results) => {
        if(err) {
            console.log("EREROR WITH SQL QUERY");
            console.log(err);
            return res.status(500).send('SERVER ERORR');
        }

        if(results.length === 0) {
            return res.status(401).send('Put in the wrong username/password ');
        }

        // SOMEONE IMPLEMENT CHEKC PASSWORD
        res.send("exists");


    });
});


module.exports = router;


