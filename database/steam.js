import Database from "better-sqlite3";

const db = new Database("steam.db");

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS steam_accounts (
    discord_id TEXT PRIMARY KEY,
    steam_id   TEXT NOT NULL
  )
`,
).run();

export function getSteamId(discordId) {
  return (
    db
      .prepare("SELECT steam_id FROM steam_accounts WHERE discord_id = ?")
      .get(discordId)?.steam_id ?? null
  );
}

export function setSteamId(discordId, steamId) {
  db.prepare(
    `INSERT INTO steam_accounts (discord_id, steam_id) VALUES (?, ?)
     ON CONFLICT(discord_id) DO UPDATE SET steam_id = excluded.steam_id`,
  ).run(discordId, steamId);
}
