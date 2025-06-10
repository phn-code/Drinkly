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

router.post('/api/review', (req, res) => {
  const { drink_api_id, review_score, review_text } = req.body;
  const user_id = req.session.userId;

  if (!user_id) return res.status(401).json({ error: 'Not logged in' });

  db.query(
    `INSERT INTO DrinkReview (user_id, drink_api_id, review_score, review_text)
     VALUES (?, ?, ?, ?)`,
    [user_id, drink_api_id, review_score, review_text],
    (err, results) => {
      if (err) {
        console.error('Error saving review:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      res.status(201).json({ success: true });
    }
  );
});


router.get('/friends', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'friends.html'));
});

const db = require('../scripts/db');

router.post('/addReview', (req, res) => {
  const { drink_api_id, times_drunk, review_score, review_text } = req.body;
  const { userId } = req.session;

  if (!userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  db.query('SELECT * FROM Drinks WHERE api_id = ?', [drink_api_id], (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error' });

    if (results.length === 0) {
      // Fetch and insert drink
      fetch(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${drink_api_id}`)
        .then(r => r.json())
        .then(drinkData => {
          const drink = (drinkData.drinks && drinkData.drinks[0]) || null;
          if (!drink) return res.status(400).json({ error: 'Drink not found in external API' });

          db.query(`
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
            ],
            (err2) => {
              if (err2) return res.status(500).json({ error: 'Insert drink failed' });
              insertReview(); // drink inserted, now insert review
            }
          );
        })
        .catch(() => res.status(500).json({ error: 'Failed to fetch drink info' }));
    } else {
      insertReview(); // drink already exists, insert review
    }

    function insertReview() {
      db.query(
        `INSERT INTO DrinkReview (user_id, drink_api_id, times_drunk, review_score, review_text)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, drink_api_id, times_drunk || 1, review_score, review_text],
        (err3) => {
          if (err3) return res.status(500).json({ error: 'Insert review failed' });
          res.status(200).json({ message: 'Review saved successfully' });
        }
      );
    }
  });
});

router.get('/getReviews/:drinkId', (req, res) => {
  const drink_api_id = req.params.drinkId;

  db.query(`
    SELECT r.review_text, r.review_score, u.username
    FROM DrinkReview r
    JOIN Users u ON r.user_id = u.id
    WHERE r.drink_api_id = ?
    ORDER BY r.drink_review_time DESC
  `, [drink_api_id], (err, rows) => {
    if (err) {
      console.error("❌ Error fetching reviews:", err);
      return res.status(500).json({ error: "Failed to fetch reviews" });
    }

    res.json(rows);
  });
});

router.post('/addReview', (req, res) => {
  const { drink_api_id, times_drunk, review_score, review_text } = req.body;
  const { userId } = req.session;

  if (!userId) return res.status(401).json({ error: 'Not logged in' });

  // Step 1: Check if drink exists
  db.query('SELECT * FROM Drinks WHERE api_id = ?', [drink_api_id], (err, result) => {
    if (err) return res.status(500).json({ error: 'DB error during drink check' });

    if (result.length === 0) {
      // Fetch drink info from external API
      fetch(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${drink_api_id}`)
        .then(res => res.json())
        .then(drinkData => {
          const drink = drinkData.drinks?.[0];
          if (!drink) return res.status(400).json({ error: 'Drink not found in API' });

          // Insert new drink into DB
          const sql = `
            INSERT INTO Drinks (
              api_id, name, alternate_name, tags, category,
              iba_category, alcoholic_status, glass_type,
              instructions, thumbnail_url, image_source_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

          const values = [
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
          ];

          db.query(sql, values, (err2) => {
            if (err2) return res.status(500).json({ error: 'DB error saving drink' });

            insertReview();
          });
        })
        .catch(() => res.status(500).json({ error: 'Error fetching from external API' }));
    } else {
      insertReview();
    }

    function insertReview() {
      const insertSql = `
        INSERT INTO DrinkReview (user_id, drink_api_id, times_drunk, review_score, review_text)
        VALUES (?, ?, ?, ?, ?)`;

      db.query(insertSql, [userId, drink_api_id, times_drunk || 1, review_score, review_text], (err3) => {
        if (err3) return res.status(500).json({ error: 'DB error saving review' });
        res.json({ message: 'Review saved successfully' });
      });
    }
  });
});




module.exports = router;
