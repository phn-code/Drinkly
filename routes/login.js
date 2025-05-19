var express = require('express');
var router = express.Router();
const bcrypt = require('bcryptjs');

// const path = require('path');

const db = require('../scripts/db');
// const req = require('express/lib/request');

router.post('/', (req,res) => {


    const { username, password } = req.body;


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


        bcrypt.compare(password, results[0].password).then((matchesPassword) => {

            if(!matchesPassword) {
                return res.status(401).send('Put in the wrong username/password ');
            }
            console.log("verified password");
            req.session.userId = results[0].id;
            req.session.username = results[0].username;

            res.send("Logged In");

        });


        // console.log("Matches? " + (matchesPassword ? "Y" : "N"));
        // console.log("Matches: " + matchesPassword);

        // console.log(results);


        // return;
    });
});

router.post('/new', (req, res) => {

    const { username, password, email } = req.body;

    console.log(`INPUTS: Username: ${username}, password: ${password}, email: ${email}`);


    db.query('SELECT * FROM Users WHERE username = ?', [username], (err, results) => {
        if(err) {
            console.log("EREROR WITH SQL QUERY");
            console.log(err);
            return res.status(500).send('SERVER ERROR');
        }

        if(results.length !== 0) {
            // not allowed, already a user in there
            return res.status(401).send('Put in the wrong username/password ');
        }

        // else allowed
        // generate the password hash
        bcrypt.hash(password, 10).then((hashP) => {
            db.query('INSERT INTO Users (username, email, password) VALUES (?, ?, ?)', [username, email, hashP], (err2, newRes) => {
                if(err2) {
                    console.log("EREROR WITH SQL QUERY");
                    console.log(err2);
                    return res.status(500).send('SERVER ERROR');

                }

                // req.session.userId = newRes.user_id;
                req.session.userId = newRes.insertId;
                req.session.username = username;

                res.send("User Created");

            });
        });






    });

});

router.post('/logout', (req, res) => {
    console.log("WOrking");

    req.session.destroy(() => {
        res.redirect('/login');
    });

});
//Phuc's new part: 
//Grabs the userID from ethan's cookie
router.get('/profile', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    res.json({ userId: req.session.userId });
});
//Mock Login:
//http://localhost:3000/loginUser/mock-login
router.get('/mock-login', (req, res) => {
    req.session.userId = 123; // or any test ID
    req.session.username = 'testuser'; // optional, for debugging
    res.send('Mock login successful. Session userId set to 123.');
});

//storing user selection for list
router.post('/storeListDetails', (req, res) => {
    const { listName, listDescription, selectedListIcon } = req.body;

    if (!listName) {
        return res.status(400).json({ error: 'List name is required' });
    }

    // Save to session
    req.session.listDetails = {
        listName,
        listDescription,
        selectedListIcon
    };
    res.status(200).json({ message: 'List details saved to session' });
});

router.get('/getListDetails', (req, res) => {
    if (!req.session.listDetails) {
        return res.status(404).json({ error: 'No list details in session' });
    }
    res.json(req.session.listDetails);
});


module.exports = router;


