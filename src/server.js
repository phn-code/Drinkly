const config = require('./config');
const { createPool } = require('./db');
const { createCocktailDb } = require('./drinks');
const { createApp } = require('./app');

const app = createApp({
  pool: createPool(config.db),
  cocktailDb: createCocktailDb(config.cocktailDbUrl),
  sessionSecret: config.sessionSecret,
  isProduction: config.isProduction,
});

app.listen(config.port, () => {
  console.log(`Drinkly listening on http://localhost:${config.port}`);
});
