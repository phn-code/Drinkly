var mysql = require('mysql2');

var db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "test",
  database: "TestDrinklyDb"
});

db.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

module.exports = db;
