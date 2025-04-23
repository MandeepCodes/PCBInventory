import { openDatabaseAsync } from 'expo-sqlite';

let db; // Database instance

// Initialize the database
export const initDB = async () => {
  try {
    db = await openDatabaseAsync('inventory.db');
    await db.execAsync('PRAGMA foreign_keys = ON;');

    // Check if migration is needed
    const itemsColumns = await db.getAllAsync('PRAGMA table_info(items)');
    const hasPersonId = itemsColumns.some(col => col.name === 'personId');

    if (!hasPersonId) {
      console.log('Performing database migration...');
      await db.withTransactionAsync(async () => {
        // Backup old items table
        await db.execAsync('ALTER TABLE items RENAME TO items_old');

        // Create new tables with current schema
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS persons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            phoneNumber TEXT NOT NULL,
            priority INTEGER NOT NULL DEFAULT 1
          );
        `);

        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            itemTypeId INTEGER NOT NULL,
            personId INTEGER NOT NULL,
            pcbModelId INTEGER NOT NULL,
            estimatedTime TEXT NOT NULL,
            FOREIGN KEY (itemTypeId) REFERENCES itemTypes(id),
            FOREIGN KEY (personId) REFERENCES persons(id),
            FOREIGN KEY (pcbModelId) REFERENCES pcbModels(id)
          );
        `);

        // Migrate data (adjust according to your old schema)
        await db.execAsync(`
          INSERT INTO items (id, itemTypeId, personId, pcbModelId, estimatedTime)
          SELECT id, 1 AS itemTypeId, 1 AS personId, 1 AS pcbModelId, estimatedTime
          FROM items_old
        `);

        // Cleanup old table
        await db.execAsync('DROP TABLE items_old');
      });
    }

    // Create other tables if they don't exist
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS itemTypes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS pcbModels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      );
    `);

    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// CRUD Operations for Items
export const addItemToDB = async (itemTypeId, personId, pcbModelId, estimatedTime) => {
  if (!db) throw new Error('Database not initialized');
  
  try {
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO items (itemTypeId, personId, pcbModelId, estimatedTime) VALUES (?, ?, ?, ?);`,
        [itemTypeId, personId, pcbModelId, estimatedTime]
      );
    });
    return { success: true };
  } catch (error) {
    console.error('Error adding item:', error);
    throw error;
  }
};

export const getAllItems = async () => {
  if (!db) throw new Error('Database not initialized');
  
  try {
    return await db.getAllAsync(`
      SELECT items.*, 
        persons.name as personName,
        itemTypes.name as itemType,
        pcbModels.name as pcbModel
      FROM items
      JOIN persons ON items.personId = persons.id
      JOIN itemTypes ON items.itemTypeId = itemTypes.id
      JOIN pcbModels ON items.pcbModelId = pcbModels.id
    `);
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
};

// CRUD Operations for Persons
export const addPerson = async (name, phoneNumber, priority = 1) => {
  if (!db) throw new Error('Database not initialized');
  
  try {
    const result = await db.runAsync(
      'INSERT INTO persons (name, phoneNumber, priority) VALUES (?, ?, ?)',
      [name, phoneNumber, priority]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding person:', error);
    throw error;
  }
};

export const getAllPersons = async () => {
  if (!db) throw new Error('Database not initialized');
  return await db.getAllAsync('SELECT * FROM persons ORDER BY name');
};

// CRUD Operations for Item Types
export const addItemType = async (name) => {
  if (!db) throw new Error('Database not initialized');
  
  try {
    const result = await db.runAsync(
      'INSERT INTO itemTypes (name) VALUES (?)',
      [name]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding item type:', error);
    throw error;
  }
};

export const getAllItemTypes = async () => {
  if (!db) throw new Error('Database not initialized');
  return await db.getAllAsync('SELECT * FROM itemTypes ORDER BY name');
};

// CRUD Operations for PCB Models
export const addPcbModel = async (name) => {
  if (!db) throw new Error('Database not initialized');
  
  try {
    const result = await db.runAsync(
      'INSERT INTO pcbModels (name) VALUES (?)',
      [name]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding PCB model:', error);
    throw error;
  }
};

export const getAllPcbModels = async () => {
  if (!db) throw new Error('Database not initialized');
  return await db.getAllAsync('SELECT * FROM pcbModels ORDER BY name');
};

// Advanced Methods
export const getItemsByPerson = async (personId) => {
  if (!db) throw new Error('Database not initialized');
  
  try {
    return await db.getAllAsync(
      `SELECT * FROM items WHERE personId = ?`,
      [personId]
    );
  } catch (error) {
    console.error('Error fetching items by person:', error);
    throw error;
  }
};

export const deleteItem = async (itemId) => {
  if (!db) throw new Error('Database not initialized');
  
  try {
    await db.runAsync('DELETE FROM items WHERE id = ?', [itemId]);
    return true;
  } catch (error) {
    console.error('Error deleting item:', error);
    throw error;
  }
};