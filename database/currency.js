import Database from "better-sqlite3";

const db = new Database("currency.db");

// Create the table if it doesn't exist
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    balance INTEGER DEFAULT 0
  )
`,
).run();

function getBalance(userId) {
  const row = db.prepare("SELECT balance FROM users WHERE id = ?").get(userId);
  return row ? row.balance : 0;
}

function addBalance(userId, amount) {
  if (!userId || !amount) {
    throw new Error("[Error] userId and amount cannot be null in addBalance");
  }

  const row = db.prepare("SELECT balance FROM users WHERE id = ?").get(userId);
  const currentBalance = row ? row.balance : 0;

  const newBalance = Math.max(currentBalance + amount, 0);

  if (!row) {
    db.prepare("INSERT INTO users (id, balance) VALUES (?, ?)").run(
      userId,
      amount,
    );
  } else {
    db.prepare("UPDATE users SET balance = ? WHERE id = ?").run(
      newBalance,
      userId,
    );
  }

  return newBalance;
}

function removeBalance(userId, amount) {
  return addBalance(userId, -amount);
}

function getLeaderboard(limit = 5) {
  return db
    .prepare("SELECT id, balance FROM users ORDER BY balance DESC LIMIT ?")
    .all(limit);
}

function resetBalance(userId) {
  const row = db.prepare("SELECT balance FROM users WHERE id = ?").get(userId);

  if (!row) {
    db.prepare("INSERT INTO users (id, balance) VALUES (?, 0)").run(userId);
    return 0;
  } else {
    db.prepare("UPDATE users SET balance = 0 WHERE id = ?").run(userId);
    return 0;
  }
}

function transferBalance(userIdFrom, userIdTo, amount) {
  if (amount <= 0) throw new Error("Amount must be greater than 0");
  if (userIdFrom === userIdTo)
    throw new Error("Cannot transfer to the same user");

  const fromRow = db
    .prepare("SELECT balance FROM users WHERE id = ?")
    .get(userIdFrom);
  const fromBalance = fromRow ? fromRow.balance : 0;

  if (fromBalance < amount) {
    throw new Error("Insufficient balance for transfer");
  }

  const transfer = db.transaction((fromId, toId, amt) => {
    removeBalance(fromId, amt);
    addBalance(toId, amt);
  });

  transfer(userIdFrom, userIdTo, amount);

  return {
    from: getBalance(userIdFrom),
    to: getBalance(userIdTo),
  };
}

export {
  getBalance,
  addBalance,
  removeBalance,
  getLeaderboard,
  resetBalance,
  transferBalance,
};
