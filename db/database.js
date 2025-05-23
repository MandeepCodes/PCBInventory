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

// Helper function to create indexes
const createIndex = async (indexName, tableName, columnName) => {
  await db.execAsync(`CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName}(${columnName});`);
};

// Initialize database with proper typing
export const initDB = async () => {
  try {
    // Open database connection
    db = await openDatabaseAsync('inventory.db');
    await db.execAsync('PRAGMA foreign_keys = ON;');

    // Create reference tables
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

    // Check if the items table exists
    const itemsExists = await tableExists('items');
    if (itemsExists) {
      // Check for missing columns in the items table
      const itemsColumns = await db.getAllAsync('PRAGMA table_info(items)');
      const requiredColumns = [
        { name: 'repairAmount', type: 'REAL DEFAULT 0' },
        { name: 'isPaid', type: 'INTEGER DEFAULT 0' },
        { name: 'status', type: 'TEXT DEFAULT "upcoming"' },
        { name: 'updatedAt', type: 'TEXT' },
        { name: 'serialNumber', type: 'TEXT UNIQUE' } // Add serialNumber column
      ];

      for (const column of requiredColumns) {
        const columnExists = itemsColumns.some(col => col.name === column.name);
        if (!columnExists) {
          await db.execAsync(`ALTER TABLE items ADD COLUMN ${column.name} ${column.type}`);
        }
      }
    } else {
      // Create the items table if it doesn't exist
      await db.execAsync(`
        CREATE TABLE items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          itemTypeId INTEGER NOT NULL,
          personId INTEGER NOT NULL,
          pcbModelId INTEGER NOT NULL,
          estimatedTime INTEGER NOT NULL, -- Store as an integer (number of days)
          createdAt TEXT NOT NULL, -- ISO 8601 timestamp
          repairAmount REAL DEFAULT 0, -- New column for repair amount
          isPaid INTEGER DEFAULT 0, -- New column for payment status (0 = unpaid, 1 = paid)
          status TEXT DEFAULT "upcoming", -- New column for item status
          updatedAt TEXT, -- New column for last update timestamp
          serialNumber TEXT UNIQUE, -- New column for serial number
          FOREIGN KEY (itemTypeId) REFERENCES itemTypes(id) ON DELETE CASCADE,
          FOREIGN KEY (personId) REFERENCES persons(id) ON DELETE CASCADE,
          FOREIGN KEY (pcbModelId) REFERENCES pcbModels(id) ON DELETE CASCADE
        );
      `);
    }

    // Create indexes for performance optimization
    await createIndex('idx_items_personId', 'items', 'personId');
    await createIndex('idx_items_itemTypeId', 'items', 'itemTypeId');
    await createIndex('idx_items_pcbModelId', 'items', 'pcbModelId');
    await createIndex('idx_items_status', 'items', 'status');

    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

// ==================== ITEM OPERATIONS ====================
export const addItemToDB = async (itemTypeId, personId, pcbModelId, estimatedTime) => {
  if (!db) throw new Error('Database not initialized');

  try {
    const currentTime = new Date().toISOString(); // Get the current timestamp
    return await db.withTransactionAsync(async () => {
      // Get the last serial number
      const lastSerial = await db.getFirstAsync(
        `SELECT serialNumber FROM items ORDER BY id DESC LIMIT 1`
      );

      // Generate the next serial number
      let nextSerial = 'AA001';
      if (lastSerial?.serialNumber) {
        const prefix = lastSerial.serialNumber.slice(0, 2); // Extract "AA"
        const number = parseInt(lastSerial.serialNumber.slice(2), 10); // Extract "001"
        nextSerial = `${prefix}${String(number + 1).padStart(3, '0')}`; // Increment and pad
      }

      // Insert the new item
      const result = await db.runAsync(
        `INSERT INTO items (itemTypeId, personId, pcbModelId, estimatedTime, createdAt, serialNumber) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [itemTypeId, personId, pcbModelId, estimatedTime, currentTime, nextSerial]
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
      SELECT items.id, items.serialNumber, items.status, items.createdAt, items.updatedAt, 
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

// Fetch items by due status, excluding "nonRepairable" and "handedOver"
export const getItemsByDueStatus = async () => {
  if (!db) throw new Error('Database not initialized');

  try {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    return await db.getAllAsync(`
      SELECT items.id, items.status, items.createdAt, items.updatedAt, 
        persons.name as personName, persons.phoneNumber, persons.priority,
        itemTypes.name as itemType,
        pcbModels.name as pcbModel,
        DATE(items.createdAt, '+' || items.estimatedTime || ' days') as dueDate,
        CASE 
          WHEN DATE(items.createdAt, '+' || items.estimatedTime || ' days') = ? THEN 'dueToday'
          WHEN DATE(items.createdAt, '+' || items.estimatedTime || ' days') < ? THEN 'overdue'
          ELSE 'upcoming'
        END as status
      FROM items
      JOIN persons ON items.personId = persons.id
      JOIN itemTypes ON items.itemTypeId = itemTypes.id
      JOIN pcbModels ON items.pcbModelId = pcbModels.id
      WHERE items.status NOT IN ('nonRepairable', 'handedOver') -- Exclude these statuses
      ORDER BY persons.priority DESC, items.createdAt ASC
    `, [today, today]);
  } catch (error) {
    console.error('Error fetching items by due status:', error);
    throw error;
  }
};

// Update item status (e.g., "nonRepairable" or "handedOver") and log the timestamp
export const updateItemStatus = async (itemId, status) => {
  if (!db) throw new Error('Database not initialized');

  try {
    const updatedAt = new Date().toISOString(); // Log the current timestamp
    await db.runAsync(
      'UPDATE items SET status = ?, updatedAt = ? WHERE id = ?',
      [status, updatedAt, itemId]
    );
    console.log(`Item ID ${itemId} marked as ${status} at ${updatedAt}`);
  } catch (error) {
    console.error('Error updating item status:', error);
    throw error;
  }
};

// Update repair details and mark the item as "handedOver"
export const updateRepairDetails = async (itemId, repairAmount, isPaid) => {
  if (!db) throw new Error('Database not initialized');

  try {
    const updatedAt = new Date().toISOString(); // Log the current timestamp
    await db.runAsync(
      'UPDATE items SET repairAmount = ?, isPaid = ?, status = ?, updatedAt = ? WHERE id = ?',
      [repairAmount, isPaid ? 1 : 0, 'handedOver', updatedAt, itemId]
    );
    console.log(`Repair details updated for item ID ${itemId} at ${updatedAt}`);
  } catch (error) {
    console.error('Error updating repair details:', error);
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

export const getFinanceSummary = async () => {
  if (!db) throw new Error('Database not initialized');

  try {
    const totalRevenueResult = await db.getFirstAsync(
      'SELECT SUM(repairAmount) as totalRevenue FROM items WHERE status = "handedOver" AND isPaid = 1'
    );
    const pendingPaymentsResult = await db.getFirstAsync(
      'SELECT SUM(repairAmount) as pendingPayments FROM items WHERE status = "handedOver" AND isPaid = 0'
    );
    const monthlyRevenueResult = await db.getFirstAsync(
      `SELECT SUM(repairAmount) as monthlyRevenue 
       FROM items 
       WHERE status = "handedOver" AND isPaid = 1 
       AND strftime('%Y-%m', updatedAt) = strftime('%Y-%m', 'now')`
    );
    const recentTransactions = await db.getAllAsync(
      `SELECT items.id, items.serialNumber, items.repairAmount, items.isPaid, items.updatedAt, 
              persons.name as personName, 
              itemTypes.name as itemType, 
              pcbModels.name as pcbModel
       FROM items
       JOIN persons ON items.personId = persons.id
       JOIN itemTypes ON items.itemTypeId = itemTypes.id
       JOIN pcbModels ON items.pcbModelId = pcbModels.id
       WHERE items.status = "handedOver"
       ORDER BY items.updatedAt DESC`
    );

    return {
      totalRevenue: totalRevenueResult?.totalRevenue || 0,
      pendingPayments: pendingPaymentsResult?.pendingPayments || 0,
      monthlyRevenue: monthlyRevenueResult?.monthlyRevenue || 0,
      recentTransactions,
    };
  } catch (error) {
    console.error('Error fetching finance summary:', error);
    throw error;
  }
};

export const getFilterData = async () => {
  if (!db) throw new Error('Database not initialized');

  try {
    const personNames = await db.getAllAsync('SELECT DISTINCT name FROM persons');
    const itemTypes = await db.getAllAsync('SELECT DISTINCT name FROM itemTypes');
    const pcbModels = await db.getAllAsync('SELECT DISTINCT name FROM pcbModels');

    return {
      personNames: personNames.map((row) => row.name),
      itemTypes: itemTypes.map((row) => row.name),
      pcbModels: pcbModels.map((row) => row.name),
    };
  } catch (error) {
    console.error('Error fetching filter data:', error);
    throw error;
  }
};