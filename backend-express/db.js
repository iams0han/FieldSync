const { Pool } = require("pg");

console.log("DB CONFIG:", {
  user: process.env.DB_U,
  host: process.env.DB_H,
  database: process.env.DB_N,
  port: process.env.DB_PT,
  passwordSet: !!process.env.DB_P,
});

const pool = new Pool({
  user: process.env.DB_U,
  host: process.env.DB_H,
  database: process.env.DB_N,
  password: process.env.DB_P,
  port: Number(process.env.DB_PT),
});

module.exports = pool;