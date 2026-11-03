const fs = require('node:fs/promises');
const path = require('node:path');
const mysql = require('mysql2/promise');

const SCHEMA_PATH = path.join(__dirname, '..', 'db', 'schema.sql');

function createPool(dbConfig) {
  return mysql.createPool({ ...dbConfig, connectionLimit: 10 });
}

async function applySchema(dbConfig) {
  const { database, ...serverConfig } = dbConfig;
  const connection = await mysql.createConnection({ ...serverConfig, multipleStatements: true });
  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
    await connection.query(`USE \`${database}\``);
    await connection.query(await fs.readFile(SCHEMA_PATH, 'utf8'));
  } finally {
    await connection.end();
  }
}

async function inTransaction(pool, work) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = { createPool, applySchema, inTransaction };
