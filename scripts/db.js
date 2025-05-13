require('dotenv').config();
var mysql = require('mysql2');

var db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'test',
  database: process.env.DB_NAME || 'Drinkly',
  port: process.env.DB_PORT || 3306
});



db.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

module.exports = db;
