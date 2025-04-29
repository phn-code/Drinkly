var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
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

router.get('/drink/:id', async(req, res) => {
const { id } = req.params;

try{
  const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${id}`);
  const data = await response.json();

  if(!data.drinks){
    return res.status(404).send('Sorry, not found');
  }

  res.render('drinkTemp', { drink: data.drinks[0] });

} catch (err){
  console.error('Cant getting data:', err);
  return res.status(500).json({ error: 'server error' });
}

});

module.exports = router;
