require('dotenv').config();
var mysql = require('mysql2');

var db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'test',
  database: 'Drinkly'
  // port: process.env.DB_PORT || 3306
});



db.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

module.exports = db;
