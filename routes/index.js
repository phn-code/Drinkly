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


router.get('/friends', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'friends.html'));
});

const db = require('../scripts/db'); // assuming you use mysql2/promise

router.post('/addReview', async (req, res) => {
  const { drink_api_id, times_drunk, review_score, review_text } = req.body;
  const { userId } = req.session; // assumes express-session middleware is in place

  if (!userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  try {
    // STEP 1: Check if the drink already exists
    const [existing] = await db.query('SELECT * FROM Drinks WHERE api_id = ?', [drink_api_id]);

    // STEP 2: If it doesn’t, fetch from CocktailDB and insert
    if (existing.length === 0) {
      const drinkRes = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${drink_api_id}`);
      const drinkData = await drinkRes.json();
      const drink = drinkData.drinks?.[0];

      if (!drink) {
        return res.status(400).json({ error: 'Drink not found in external API' });
      }

      await db.query(`
        INSERT INTO Drinks (
          api_id, name, alternate_name, tags, category,
          iba_category, alcoholic_status, glass_type,
          instructions, thumbnail_url, image_source_url
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          drink.idDrink,
          drink.strDrink,
          drink.strDrinkAlternate,
          drink.strTags,
          drink.strCategory,
          drink.strIBA,
          drink.strAlcoholic,
          drink.strGlass,
          drink.strInstructions,
          drink.strDrinkThumb,
          drink.strImageSource
        ]
      );
    }

    // STEP 3: Insert review
    await db.query(
      `INSERT INTO DrinkReview (user_id, drink_api_id, times_drunk, review_score, review_text)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, drink_api_id, times_drunk || 1, review_score, review_text]
    );

    res.status(200).json({ message: 'Review saved successfully' });

  } catch (err) {
    console.error('Error saving review:', err);
    res.status(500).json({ error: 'Database error while saving review' });
  }

});



module.exports = router;
