import { openDatabaseAsync } from 'expo-sqlite';

let db = null;

// Helper function to check table existence
const tableExists = async (tableName) => {
  const result = await db.getAllAsync(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
    [tableName]
  );
  return result.length > 0;
};

// Initialize database with proper typing
export const initDB = async () => {
  try {
    // Open database connection
    db = await openDatabaseAsync('inventory.db');
    await db.execAsync('PRAGMA foreign_keys = ON;');

    // Create reference tables first
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS persons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        phoneNumber TEXT NOT NULL,
        priority INTEGER NOT NULL DEFAULT 1
      );
    `);

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

    // Check if migration is needed
    const itemsExists = await tableExists('items');
    let needsMigration = false;

    if (itemsExists) {
      const itemsColumns = await db.getAllAsync('PRAGMA table_info(items)');
      needsMigration = !itemsColumns.some(col => col.name === 'personId');
    }

    if (needsMigration) {
      console.log('Performing database migration...');
      await db.withTransactionAsync(async () => {
        // Create default entries
        await db.runAsync(
          'INSERT OR IGNORE INTO itemTypes (name) VALUES ("Default Type")'
        );
        await db.runAsync(
          'INSERT OR IGNORE INTO pcbModels (name) VALUES ("Default Model")'
        );
        await db.runAsync(
          'INSERT OR IGNORE INTO persons (name, phoneNumber) VALUES ("Default Person", "000-0000")'
        );

        // Backup old table
        await db.execAsync('ALTER TABLE items RENAME TO items_old');

        // Create new items table
        await db.execAsync(`
          CREATE TABLE items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            itemTypeId INTEGER NOT NULL,
            personId INTEGER NOT NULL,
            pcbModelId INTEGER NOT NULL,
            estimatedTime TEXT NOT NULL,
            FOREIGN KEY (itemTypeId) REFERENCES itemTypes(id) ON DELETE CASCADE,
            FOREIGN KEY (personId) REFERENCES persons(id) ON DELETE CASCADE,
            FOREIGN KEY (pcbModelId) REFERENCES pcbModels(id) ON DELETE CASCADE
          );
        `);

        // Migrate data
        const [defaultType] = await db.getAllAsync('SELECT id FROM itemTypes LIMIT 1');
        const [defaultPerson] = await db.getAllAsync('SELECT id FROM persons LIMIT 1');
        const [defaultModel] = await db.getAllAsync('SELECT id FROM pcbModels LIMIT 1');

        await db.execAsync(`
          INSERT INTO items (id, itemTypeId, personId, pcbModelId, estimatedTime)
          SELECT 
            id, 
            ${defaultType.id},
            ${defaultPerson.id},
            ${defaultModel.id},
            estimatedTime
          FROM items_old
        `);

        await db.execAsync('DROP TABLE items_old');
      });
    } else {
      // Create fresh items table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          itemTypeId INTEGER NOT NULL,
          personId INTEGER NOT NULL,
          pcbModelId INTEGER NOT NULL,
          estimatedTime TEXT NOT NULL,
          FOREIGN KEY (itemTypeId) REFERENCES itemTypes(id) ON DELETE CASCADE,
          FOREIGN KEY (personId) REFERENCES persons(id) ON DELETE CASCADE,
          FOREIGN KEY (pcbModelId) REFERENCES pcbModels(id) ON DELETE CASCADE
        );
      `);
    }

    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

// Rest of your CRUD operations remain the same as previous version
// (addItemToDB, getAllItems, deleteItem, addPerson, etc.)

// ==================== ITEM OPERATIONS ====================
export const addItemToDB = async (itemTypeId, personId, pcbModelId, estimatedTime) => {
  if (!db) throw new Error('Database not initialized');
  
  try {
    return await db.withTransactionAsync(async () => {
      const result = await db.runAsync(
        `INSERT INTO items (itemTypeId, personId, pcbModelId, estimatedTime) VALUES (?, ?, ?, ?)`,
        [itemTypeId, personId, pcbModelId, estimatedTime]
      );
      return result.lastInsertRowId;
    });
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
      ORDER BY items.id DESC
    `);
  } catch (error) {
    console.error('Error fetching items:', error);
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

// ==================== PERSON OPERATIONS ====================
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
  try {
    return await db.getAllAsync(`
      SELECT *, 
        (SELECT COUNT(*) FROM items WHERE personId = persons.id) AS itemCount
      FROM persons 
      ORDER BY name
    `);
  } catch (error) {
    console.error('Error fetching persons:', error);
    throw error;
  }
};

export const removePerson = async (personId) => {
  if (!db) throw new Error('Database not initialized');
  
  try {
    await db.withTransactionAsync(async () => {
      // Update items referencing this person
      await db.runAsync(
        'UPDATE items SET personId = (SELECT id FROM persons LIMIT 1) WHERE personId = ?',
        [personId]
      );
      await db.runAsync('DELETE FROM persons WHERE id = ?', [personId]);
    });
    return true;
  } catch (error) {
    console.error('Error deleting person:', error);
    throw error;
  }
};

// ==================== ITEM TYPE OPERATIONS ====================
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
  try {
    return await db.getAllAsync(`
      SELECT *, 
        (SELECT COUNT(*) FROM items WHERE itemTypeId = itemTypes.id) AS itemCount
      FROM itemTypes 
      ORDER BY name
    `);
  } catch (error) {
    console.error('Error fetching item types:', error);
    throw error;
  }
};

export const removeItemType = async (typeId) => {
  if (!db) throw new Error('Database not initialized');
  
  try {
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        'UPDATE items SET itemTypeId = (SELECT id FROM itemTypes LIMIT 1) WHERE itemTypeId = ?',
        [typeId]
      );
      await db.runAsync('DELETE FROM itemTypes WHERE id = ?', [typeId]);
    });
    return true;
  } catch (error) {
    console.error('Error deleting item type:', error);
    throw error;
  }
};

// ==================== PCB MODEL OPERATIONS ====================
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
  try {
    return await db.getAllAsync(`
      SELECT *, 
        (SELECT COUNT(*) FROM items WHERE pcbModelId = pcbModels.id) AS itemCount
      FROM pcbModels 
      ORDER BY name
    `);
  } catch (error) {
    console.error('Error fetching PCB models:', error);
    throw error;
  }
};

export const removePcbModel = async (modelId) => {
  if (!db) throw new Error('Database not initialized');
  
  try {
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        'UPDATE items SET pcbModelId = (SELECT id FROM pcbModels LIMIT 1) WHERE pcbModelId = ?',
        [modelId]
      );
      await db.runAsync('DELETE FROM pcbModels WHERE id = ?', [modelId]);
    });
    return true;
  } catch (error) {
    console.error('Error deleting PCB model:', error);
    throw error;
  }
};

// ==================== UTILITY METHODS ====================
export const resetDatabase = async () => {
  try {
    await db.closeAsync();
    await db.deleteAsync();
    console.log('Database reset successfully');
    return true;
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
};

export const databaseStatus = async () => {
  if (!db) return { initialized: false };
  
  try {
    const tables = await db.getAllAsync(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );
    return {
      initialized: true,
      tables: tables.map(t => t.name),
      itemCount: (await db.getFirstAsync('SELECT COUNT(*) as count FROM items'))?.count || 0
    };
  } catch (error) {
    return { initialized: false, error: error.message };
  }
};