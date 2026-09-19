import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    const res = await pool.query('SELECT id, name, source_url FROM centers LIMIT 5');
    console.log("CENTERS IN DB:");
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

check();
