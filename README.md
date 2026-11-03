# Drinkly

Drinkly is a web app for people who like making drinks. You can search cocktails from
[TheCocktailDB](https://www.thecocktaildb.com/), read and write reviews, collect drinks into
lists, and follow other users.

It started as a University of Adelaide Web & Database Computing group project (2025).

## Run it locally

You need Node.js 20 or later and MySQL 8.

1. Install dependencies:

   ```sh
   npm install
   ```

2. Start MySQL. If you have Docker, this starts MySQL on port 3306 with the password `drinkly`:

   ```sh
   docker compose up -d
   ```

3. Copy the example environment file and edit it if your database settings are different:

   ```sh
   cp .env.example .env
   ```

4. Create the database and tables:

   ```sh
   npm run db:setup
   ```

5. Start the server, then open http://localhost:3000:

   ```sh
   npm run dev
   ```

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | HTTP port |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | `localhost`, `3306`, `root`, empty, `drinkly` | MySQL connection |
| `SESSION_SECRET` | dev-only value | Signs session cookies. Required when `NODE_ENV=production`. |
| `COCKTAILDB_URL` | TheCocktailDB v1 API | Drink data source |

## Tests

The tests start the app against a real MySQL database called `drinkly_test` (override it with
`TEST_DB_NAME`) and replace TheCocktailDB with a local stub. They erase that database on each run.

```sh
npm test
npm run lint
```

## Project layout

```
src/
  server.js        Starts the HTTP server
  app.js           Express app: middleware, routers, page routes, error handling
  config.js        Reads environment variables
  db.js            MySQL pool, schema setup, transaction helper
  drinks.js        TheCocktailDB client and the local drink cache
  http.js          HttpError and auth guards
  routes/          JSON API: auth, drinks and reviews, lists, users and friends
views/             EJS pages and the shared head/foot partials
public/            CSS, browser scripts, images
db/schema.sql      Database schema
test/              End-to-end API tests
```

## API

All endpoints are under `/api` and use JSON. Endpoints marked with * need a logged-in session.

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/auth/signup` | Create an account (multipart form: `username`, `email`, `password`, optional `avatar`) |
| POST | `/api/auth/login` | Log in with `username` and `password` |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/me` | The current user |
| GET | `/api/drinks?search=` | Search drinks by name |
| GET | `/api/drinks/:id` | One drink |
| GET | `/api/drinks/:id/reviews` | Reviews for a drink, newest first |
| POST | `/api/drinks/:id/reviews` * | Add a review: `score` (0 to 5), `body`, optional `timesDrunk` |
| GET | `/api/lists` * | Your lists |
| POST | `/api/lists` * | Create a list: `name`, optional `description` and `iconUrl`, `drinkIds` |
| DELETE | `/api/lists/:id` * | Delete one of your lists |
| GET | `/api/lists/:id/drinks` * | Drinks in a list |
| GET | `/api/users?search=` * | Find users, with follow status and popularity rank |
| GET | `/api/users/:id/avatar` * | A user's profile image |
| GET | `/api/friends` * | Users you follow |
| PUT | `/api/friends/:id` * | Follow a user |
| DELETE | `/api/friends/:id` * | Unfollow a user |
