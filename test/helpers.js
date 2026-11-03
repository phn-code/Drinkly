const http = require('node:http');
const config = require('../src/config');
const { applySchema, createPool } = require('../src/db');
const { createCocktailDb } = require('../src/drinks');
const { createApp } = require('../src/app');

const RAW_DRINKS = [
  {
    idDrink: '11007', strDrink: 'Margarita', strCategory: 'Ordinary Drink', strAlcoholic: 'Alcoholic',
    strGlass: 'Cocktail glass', strInstructions: 'Rub the rim. Shake.', strDrinkThumb: 'https://img/margarita.jpg',
    strIngredient1: 'Tequila', strMeasure1: '1 1/2 oz ', strIngredient2: 'Lime juice', strMeasure2: null,
    strIngredient3: null,
  },
  {
    idDrink: '11000', strDrink: 'Mojito', strCategory: 'Cocktail', strAlcoholic: 'Alcoholic',
    strGlass: 'Highball glass', strInstructions: 'Muddle mint.', strDrinkThumb: 'https://img/mojito.jpg',
    strIngredient1: 'Light rum', strMeasure1: '2-3 oz ',
  },
];

function startCocktailDbStub() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://stub');
    let drinks = null;
    if (url.pathname.endsWith('/search.php')) {
      const s = url.searchParams.get('s').toLowerCase();
      drinks = RAW_DRINKS.filter((d) => d.strDrink.toLowerCase().includes(s));
    } else if (url.pathname.endsWith('/lookup.php')) {
      drinks = RAW_DRINKS.filter((d) => d.idDrink === url.searchParams.get('i'));
    }
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ drinks: drinks?.length ? drinks : null }));
  });
  return new Promise((resolve) => server.listen(0, () => resolve(server)));
}

const TABLES = ['UserListDrinks', 'UserLists', 'DrinkReviews', 'Drinks', 'Follows', 'Users'];

async function startTestApp() {
  const dbConfig = { ...config.db, database: process.env.TEST_DB_NAME || 'drinkly_test' };
  await applySchema(dbConfig);
  const pool = createPool(dbConfig);
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of TABLES) await pool.query(`TRUNCATE TABLE ${table}`);
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');

  const stub = await startCocktailDbStub();
  const app = createApp({
    pool,
    cocktailDb: createCocktailDb(`http://127.0.0.1:${stub.address().port}`),
    sessionSecret: 'test',
    logRequests: false,
  });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  return {
    baseUrl,
    pool,
    client: () => createClient(baseUrl),
    async close() {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
      stub.close();
      await pool.end();
    },
  };
}

function createClient(baseUrl) {
  let cookie = null;
  async function request(method, path, body) {
    const headers = { Accept: 'application/json' };
    if (cookie) headers.Cookie = cookie;
    let payload;
    if (body instanceof FormData) payload = body;
    else if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }
    const res = await fetch(baseUrl + path, { method, headers, body: payload, redirect: 'manual' });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    const type = res.headers.get('content-type') || '';
    const data = type.includes('json') ? await res.json() : type.startsWith('image/') ? await res.arrayBuffer() : await res.text();
    return { status: res.status, data, headers: res.headers };
  }
  return {
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
    put: (path, body) => request('PUT', path, body),
    delete: (path) => request('DELETE', path),
    async signup(username, extra = {}) {
      const form = new FormData();
      form.append('username', username);
      form.append('email', `${username}@example.com`);
      form.append('password', 'secret');
      for (const [key, value] of Object.entries(extra)) form.append(key, value);
      return request('POST', '/api/auth/signup', form);
    },
  };
}

module.exports = { startTestApp };
