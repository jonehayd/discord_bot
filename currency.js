// currency.js
const Database = require("better-sqlite3");
const db = new Database("currency.db");

// Create the table if it doesn’t exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    balance INTEGER DEFAULT 0
  )
`).run();

function getBalance(userId) {
  const row = db.prepare("SELECT balance FROM users WHERE id = ?").get(userId);
  return row ? row.balance : 0;
}

function addBalance(userId, amount) {
  const row = db.prepare("SELECT balance FROM users WHERE id = ?").get(userId);

  if (!row) {
    db.prepare("INSERT INTO users (id, balance) VALUES (?, ?)").run(userId, amount);
    return amount;
  } else {
    const newBalance = row.balance + amount;
    db.prepare("UPDATE users SET balance = ? WHERE id = ?").run(newBalance, userId);
    return newBalance;
  }
}

function removeBalance(userId, amount) {
  return addBalance(userId, -amount);
}

function getLeaderboard(limit = 10) {
  return db.prepare("SELECT id, balance FROM users ORDER BY balance DESC LIMIT ?").all(limit);
}

module.exports = { getBalance, addBalance, removeBalance, getLeaderboard };
