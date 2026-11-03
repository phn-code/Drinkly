const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startTestApp } = require('./helpers');

let ctx;
before(async () => {
  ctx = await startTestApp();
});
after(() => ctx.close());

test('signup, me, logout, login', async () => {
  const alice = ctx.client();
  const signup = await alice.signup('alice');
  assert.equal(signup.status, 201);
  assert.equal(signup.data.username, 'alice');

  assert.deepEqual((await alice.get('/api/auth/me')).data, signup.data);
  assert.equal((await alice.post('/api/auth/logout')).status, 204);
  assert.equal((await alice.get('/api/auth/me')).status, 401);

  assert.equal((await alice.post('/api/auth/login', { username: 'alice', password: 'nope' })).status, 401);
  const login = await alice.post('/api/auth/login', { username: 'alice', password: 'secret' });
  assert.equal(login.status, 200);
  assert.equal((await alice.get('/api/auth/me')).data.username, 'alice');
});

test('duplicate signup is a conflict and missing fields are rejected', async () => {
  assert.equal((await ctx.client().signup('alice')).status, 409);
  const form = new FormData();
  form.append('username', 'nobody');
  assert.equal((await ctx.client().post('/api/auth/signup', form)).status, 400);
});

test('malformed and oversized input is a 400, not a 500', async () => {
  const user = ctx.client();
  assert.equal((await user.post('/api/auth/login')).status, 400);
  assert.equal((await user.signup('x'.repeat(51))).status, 400);
  await user.signup('validator');
  assert.equal((await user.post('/api/lists')).status, 400);
  assert.equal((await user.post('/api/drinks/11007/reviews')).status, 400);
  assert.equal((await user.post('/api/lists', { name: 'x'.repeat(101), drinkIds: ['11007'] })).status, 400);
  assert.equal(
    (await user.post('/api/lists', { name: 'Big', drinkIds: Array.from({ length: 51 }, (_, i) => String(i)) })).status,
    400,
  );
  assert.equal((await user.post('/api/drinks/11007/reviews', { score: 5, body: 'x'.repeat(2001) })).status, 400);
});

test('the old mock-login backdoor is gone', async () => {
  const user = ctx.client();
  await user.signup('nobackdoor');
  assert.equal((await user.get('/loginUser/mock-login')).status, 404);
  assert.equal((await user.get('/api/auth/me')).data.username, 'nobackdoor');
});

const PAGES = {
  '/': '<h1>Home</h1>',
  '/lists': '<h1>Your Lists</h1>',
  '/lists/new': 'Add Drinks to Your List',
  '/friends': '<h1>Friends</h1>',
  '/about': '<h1>About Drinkly</h1>',
  '/drinks/11007': 'data-drink-id="11007"',
};

test('pages redirect to login when logged out and render when logged in', async () => {
  const anon = ctx.client();
  for (const path of Object.keys(PAGES)) {
    const res = await anon.get(path);
    assert.equal(res.status, 302, path);
    assert.equal(res.headers.get('location'), '/login', path);
  }
  assert.match((await anon.get('/login')).data, /<h1>Log In<\/h1>/);

  const user = ctx.client();
  await user.signup('pagevisitor');
  for (const [path, marker] of Object.entries(PAGES)) {
    const res = await user.get(path);
    assert.equal(res.status, 200, path);
    assert.ok(res.data.includes(marker), `${path} renders ${marker}`);
  }
  assert.match((await user.get('/')).data, /Welcome, pagevisitor!/);
  assert.equal((await user.get('/login')).headers.get('location'), '/');
});

test('search and lookup return normalized drinks', async () => {
  const client = ctx.client();
  const results = (await client.get('/api/drinks?search=marg')).data;
  assert.equal(results.length, 1);
  assert.deepEqual(results[0].ingredients, [
    { name: 'Tequila', measure: '1 1/2 oz' },
    { name: 'Lime juice', measure: null },
  ]);
  assert.deepEqual((await client.get('/api/drinks?search=zzz')).data, []);
  assert.equal((await client.get('/api/drinks')).status, 400);
  assert.equal((await client.get('/api/drinks/11000')).data.name, 'Mojito');
  assert.equal((await client.get('/api/drinks/999')).status, 404);
});

test('reviews require login, cache the drink, and list newest first', async () => {
  const bob = ctx.client();
  assert.equal((await bob.post('/api/drinks/11007/reviews', { score: 5, body: 'x' })).status, 401);
  await bob.signup('bob');

  assert.equal((await bob.post('/api/drinks/11007/reviews', { score: 9, body: 'x' })).status, 400);
  assert.equal((await bob.post('/api/drinks/11007/reviews', { score: 5, body: '  ' })).status, 400);
  assert.equal((await bob.post('/api/drinks/999/reviews', { score: 5, body: 'x' })).status, 404);

  assert.equal((await bob.post('/api/drinks/11007/reviews', { score: 4, body: 'Good' })).status, 201);
  assert.equal((await bob.post('/api/drinks/11007/reviews', { score: 5, body: 'Better' })).status, 201);

  const reviews = (await bob.get('/api/drinks/11007/reviews')).data;
  assert.deepEqual(reviews.map((r) => [r.username, r.body, r.score]), [
    ['bob', 'Better', 5],
    ['bob', 'Good', 4],
  ]);
  const [[cached]] = await ctx.pool.query('SELECT name FROM Drinks WHERE api_id = ?', ['11007']);
  assert.equal(cached.name, 'Margarita');
});

test('lists: create, read, validate, isolate per user, delete', async () => {
  const carol = ctx.client();
  assert.equal((await carol.get('/api/lists')).status, 401);
  await carol.signup('carol');

  const icon = '/images/list-icons/2.jpeg';
  const created = await carol.post('/api/lists', {
    name: 'Summer', description: 'Hot days', iconUrl: icon, drinkIds: ['11007', '11000', '999'],
  });
  assert.equal(created.status, 201);

  assert.equal((await carol.post('/api/lists', { name: 'Summer', drinkIds: ['11007'] })).status, 409);
  assert.equal((await carol.post('/api/lists', { name: 'X', drinkIds: [] })).status, 400);
  assert.equal((await carol.post('/api/lists', { name: 'X', drinkIds: ['999'] })).status, 400);
  assert.equal(
    (await carol.post('/api/lists', { name: 'X', iconUrl: 'javascript:alert(1)', drinkIds: ['11007'] })).status,
    400,
  );

  const lists = (await carol.get('/api/lists')).data;
  assert.deepEqual(lists, [{ id: created.data.id, name: 'Summer', description: 'Hot days', iconUrl: icon, drinkCount: 2 }]);

  const drinks = (await carol.get(`/api/lists/${created.data.id}/drinks`)).data;
  assert.deepEqual(drinks.map((d) => d.name).sort(), ['Margarita', 'Mojito']);

  const dave = ctx.client();
  await dave.signup('dave');
  assert.deepEqual((await dave.get('/api/lists')).data, []);
  assert.equal((await dave.get(`/api/lists/${created.data.id}/drinks`)).status, 404);
  assert.equal((await dave.delete(`/api/lists/${created.data.id}`)).status, 404);

  assert.equal((await carol.delete(`/api/lists/${created.data.id}`)).status, 204);
  assert.deepEqual((await carol.get('/api/lists')).data, []);
  const [[{ n }]] = await ctx.pool.query('SELECT COUNT(*) AS n FROM UserListDrinks');
  assert.equal(n, 0);
});

test('concurrent list saves do not interfere', async () => {
  const user = ctx.client();
  await user.signup('busy');
  await user.post('/api/lists', { name: 'Taken', drinkIds: ['11007'] });
  // Duplicate-name saves roll back; their rollback must not undo the unique saves running alongside.
  const results = await Promise.all(
    Array.from({ length: 16 }, (_, i) => user.post('/api/lists', {
      name: i % 2 ? 'Taken' : `L${i}`,
      drinkIds: ['11007', '11000'],
    })),
  );
  assert.deepEqual(results.map((r) => r.status), Array.from({ length: 16 }, (_, i) => (i % 2 ? 409 : 201)));
  const lists = (await user.get('/api/lists')).data;
  assert.equal(lists.length, 9);
  assert.ok(lists.filter((l) => l.name !== 'Taken').every((l) => l.drinkCount === 2));
});

test('friends: search, follow, unfollow, popularity, avatars', async () => {
  const png = new Blob([Buffer.from('89504e470d0a1a0a', 'hex')], { type: 'image/png' });
  const erin = ctx.client();
  const frank = ctx.client();
  const erinId = (await erin.signup('erin')).data.id;
  const frankId = (await frank.signup('frank', { avatar: png })).data.id;

  assert.equal((await erin.put(`/api/friends/${erinId}`)).status, 400);
  assert.equal((await erin.put('/api/friends/999999')).status, 404);

  assert.equal((await erin.put(`/api/friends/${frankId}`)).status, 204);
  assert.equal((await erin.put(`/api/friends/${frankId}`)).status, 204);

  const friends = (await erin.get('/api/friends')).data;
  assert.deepEqual(friends, [
    { id: frankId, username: 'frank', avatarUrl: `/api/users/${frankId}/avatar`, isFriend: true },
  ]);

  assert.equal((await fetch(ctx.baseUrl + friends[0].avatarUrl)).status, 401);
  const avatar = await erin.get(friends[0].avatarUrl);
  assert.equal(avatar.status, 200);
  assert.equal(avatar.headers.get('content-type'), 'image/png');
  assert.equal(avatar.headers.get('x-content-type-options'), 'nosniff');

  const svg = new Blob(['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'], { type: 'image/png' });
  assert.equal((await ctx.client().signup('mallory', { avatar: svg })).status, 400);

  // gina has one follower, frank two, so frank ranks above gina.
  const gina = ctx.client();
  const ginaId = (await gina.signup('gina')).data.id;
  await gina.put(`/api/friends/${frankId}`);
  await erin.put(`/api/friends/${ginaId}`);
  const [frankResult] = (await erin.get('/api/users?search=frank')).data;
  const [ginaResult] = (await erin.get('/api/users?search=gina')).data;
  assert.equal(frankResult.popularityRank, 1);
  assert.equal(ginaResult.popularityRank, 2);
  assert.equal(frankResult.isFriend, true);
  assert.deepEqual((await erin.get('/api/users?search=erin')).data, [], 'search excludes yourself');
  assert.deepEqual((await erin.get('/api/users?search=_')).data, []);
  await erin.delete(`/api/friends/${ginaId}`);

  assert.equal((await erin.delete(`/api/friends/${frankId}`)).status, 204);
  assert.deepEqual((await erin.get('/api/friends')).data, []);
  assert.equal((await erin.get('/api/users?search=frank')).data[0].isFriend, false);
});

test('unknown api routes return JSON 404', async () => {
  const res = await ctx.client().get('/api/nope');
  assert.equal(res.status, 404);
  assert.deepEqual(res.data, { error: 'Not found' });
});
