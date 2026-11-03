const Database = require("better-sqlite3");
const db = new Database("soal.db");

const fkStatus = db.pragma("foreign_keys", { simple: true });
console.log("Status Foreign Key:", fkStatus);
