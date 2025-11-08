// PURPOSE: Copy all data from SOURCE to TARGET Postgres databases (simplified learning version)

import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();
const { Client } = pkg;

async function syncDatabases() {
  const source = new Client({ connectionString: process.env.DATABASE_URL_MASTER });
  const target = new Client({ connectionString: process.env.DATABASE_URL_SLAVE });

  try {
    await source.connect();
    await target.connect();
    console.log("Connected to both databases");

    const tablesRes = await source.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type='BASE TABLE';
    `);
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log("📋 Found tables:", tables);


    for (const table of tables) {
      console.log(`\n Syncing table: ${table}`);

      // Clear target table first (fresh copy)
      await target.query(`DELETE FROM "${table}"`);

      // Fetch all rows from source
      const res = await source.query(`SELECT * FROM "${table}"`);
      if (res.rows.length === 0) {
        console.log(`  - No rows to copy.`);
        continue;
      }

      const cols = Object.keys(res.rows[0]);
      const colNames = cols.map(c => `"${c}"`).join(", ");

      for (const row of res.rows) {
        const values = cols.map(c => row[c]);
        const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
        const query = `INSERT INTO "${table}" (${colNames}) VALUES (${placeholders})`;
        await target.query(query, values);
      }

      console.log(`  - Copied ${res.rows.length} rows`);
    }

    console.log("Data sync completed successfully!");
  } catch (err) {
    console.error("Sync error:", err);
  } finally {
    await source.end();
    await target.end();
  }
}

syncDatabases();
