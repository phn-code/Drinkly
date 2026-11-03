const config = require('../src/config');
const { applySchema } = require('../src/db');

applySchema(config.db)
  .then(() => console.log(`Schema applied to database "${config.db.database}"`))
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  });
