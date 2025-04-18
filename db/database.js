import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('inventory.db');

// Initialize the database
export const initDB = () => {
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        itemType TEXT NOT NULL,
        personName TEXT NOT NULL,
        pcbModel TEXT NOT NULL,
        estimatedTime TEXT NOT NULL
      );`,
      [],
      () => console.log('Table initialized successfully'),
      (_, error) => console.error('Error initializing table:', error)
    );
  });
};

// Add an item to the database
export const addItemToDB = (itemType, personName, pcbModel, estimatedTime) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO items (itemType, personName, pcbModel, estimatedTime) VALUES (?, ?, ?, ?);`,
        [itemType, personName, pcbModel, estimatedTime],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

// Fetch all items from the database
export const getAllItems = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM items;`,
        [],
        (_, { rows }) => resolve(rows._array),
        (_, error) => reject(error)
      );
    });
  });
};