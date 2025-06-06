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

router.get('/search', async(req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Wrong name for da drink' });

  try {
    const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(name)}`);
    const data = await response.json();
    return res.json(data);

  }catch (err) {
    return res.status(500).json({ error: 'something wrong' });
  }

});

router.get('/drink/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${id}`);
    const data = await response.json();

    if (!data.drinks) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json({ drink: data.drinks[0] });
  } catch (err) {
    console.error('Error fetching drink:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/api/review', async (req, res) => {
  const { drink_api_id, review_score, review_text } = req.body;
  const user_id = req.session.userId;

  if (!user_id) return res.status(401).json({ error: 'Not logged in' });

  try {
    await db.query(
      `INSERT INTO DrinkReview (user_id, drink_api_id, review_score, review_text)
       VALUES (?, ?, ?, ?)`,
      [user_id, drink_api_id, review_score, review_text]
    );

    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Error review:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


router.get('/friends', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'friends.html'));
});





module.exports = router;
