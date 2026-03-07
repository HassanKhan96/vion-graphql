import { getDBClient } from "./db";

export const runMigrations = async () => {
  const db = await getDBClient();

  await db.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS avatar_url TEXT;
  `);
};

