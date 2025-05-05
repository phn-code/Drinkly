var express = require('express');
var router = express.Router();
const db = require('../scripts/db');

//Creating new user
router.post('/', (req,res) => {
  const {username, email, password} = req.body;
  if(!username||!email||!password){
    return res.status(400).json({ error: 'Not enough information' });
  }
  const query = 'INSERT INTO Users (username, email, password) VALUES (?, ?, ?)';
  db.query(query, [username, email, password], (err, result) =>{
    if(err){
      console.error('Error creating user:', err);
      return res.status(500).send('Database error');
    }
    res.status(201).json({ message: 'User created', userId: result.insertId });
  });
});

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
