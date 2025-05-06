var express = require('express');
var router = express.Router();
const path = require('path');


function checkLogin(req, res, next) {
  if (!req.session.userId) {
    console.log("No req session");
    return res.redirect('/login');
  }
  // console.log("Logged in");
  next();
}

/* GET home page. */
router.get('/', checkLogin, function(req, res, next) {
  console.log("Working");
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});


router.get('/checkLogin', (req, res) => {
  if (req.session.userId) {
    res.json({ username: req.session.username });
  } else {
    res.status(401).json({ error: 'Not logged in' });
  }
});



router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

router.get('/friends', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'friends.html'));
});





module.exports = router;
