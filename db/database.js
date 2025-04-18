import { openDatabaseAsync } from 'expo-sqlite';

let db; // Database instance

// Initialize the database
export const initDB = async () => {
  try {
    db = await openDatabaseAsync('inventory.db');
    
    // Create table if not exists
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        itemType TEXT NOT NULL,
        personName TEXT NOT NULL,
        pcbModel TEXT NOT NULL,
        estimatedTime TEXT NOT NULL
      );
    `);
    
    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Add an item to the database
export const addItemToDB = async (itemType, personName, pcbModel, estimatedTime) => {
  if (!db) throw new Error('Database not initialized - call initDB first');
  
  try {
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO items (itemType, personName, pcbModel, estimatedTime) VALUES (?, ?, ?, ?);`,
        [itemType, personName, pcbModel, estimatedTime]
      );
    });
    return { success: true };
  } catch (error) {
    console.error('Error adding item:', error);
    throw error;
  }
};

// Fetch all items from the database
export const getAllItems = async () => {
  if (!db) throw new Error('Database not initialized - call initDB first');
  
  try {
    const result = await db.getAllAsync('SELECT * FROM items;');
    return result;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
};