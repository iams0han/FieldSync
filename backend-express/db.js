const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_U,
  host: process.env.DB_H,
  database: process.env.DB_N,
  password: process.env.DB_P,
  port: Number(process.env.DB_PT),
});

pool.query("SELECT NOW()")
  .then((r) => {
    console.log("DATABASE CONNECTED:", r.rows[0]);
  })
  .catch((e) => {
    console.error("DATABASE CONNECTION FAILED:", e);
  });

module.exports = pool;