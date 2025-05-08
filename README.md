# RepairTrack - PCB Inventory Management System

RepairTrack is a comprehensive inventory management system designed to streamline the process of managing PCB repairs, inventory, and finances. This application is built using React Native and Expo, providing a cross-platform solution for managing repair workflows efficiently.

## Features

### 1. **Add Inventory**
- Add new repair items to the inventory.
- Select item type, customer details, and PCB model.
- Specify estimated repair time for better tracking.

### 2. **Inventory Management**
- View and manage all repair items in the inventory.
- Track items based on their due status:
  - **Upcoming**: Items with future due dates.
  - **Due Today**: Items that need attention today.
  - **Overdue**: Items past their due date.
- Mark items as repaired, handed over, or non-repairable.
- Notify customers via WhatsApp or SMS when repairs are completed.

### 3. **Finance Management**
- View financial summaries, including:
  - Total revenue.
  - Pending payments.
  - Monthly revenue.
- Filter transactions by customer, item type, PCB model, or payment status.
- Mark unpaid transactions as paid.

### 4. **Entity Management**
- Manage key entities such as:
  - **Item Types**: Add, view, and delete item categories.
  - **Persons**: Add, view, and delete customer details.
  - **PCB Models**: Add, view, and delete PCB models.

### 5. **Database Integration**
- Uses SQLite for local data storage.
- Automatically initializes and updates the database schema as needed.
- Ensures data integrity with foreign key constraints and indexing for performance optimization.

## Installation

1. Clone the repository:
   git clone https://github.com/your-repo/repairtrack.git
   cd repairtrack
   Here is a `README.md` file for your project:

```markdown
# PCB Inventory Management System

The **PCB Inventory Management System** is a React Native application designed to streamline the process of managing PCB repairs, inventory, and finances. It provides an intuitive interface for tracking repair items, managing customer details, and monitoring financial transactions.

## Features

### 1. **Add Inventory**
- Add new repair items to the inventory.
- Specify item type, customer details, and PCB model.
- Set estimated repair time for better tracking.

### 2. **Inventory Management**
- View and manage all repair items in the inventory.
- Track items based on their due status:
  - **Upcoming**: Items with future due dates.
  - **Due Today**: Items that need attention today.
  - **Overdue**: Items past their due date.
- Mark items as repaired, handed over, or non-repairable.

### 3. **Finance Management**
- View financial summaries, including:
  - Total revenue.
  - Pending payments.
  - Monthly revenue.
- Filter transactions by customer, item type, PCB model, or payment status.
- Mark unpaid transactions as paid.

### 4. **Entity Management**
- Manage key entities such as:
  - **Item Types**: Add, view, and delete item categories.
  - **Customers**: Add, view, and delete customer details.
  - **PCB Models**: Add, view, and delete PCB models.

### 5. **Database Integration**
- Uses SQLite for local data storage.
- Automatically initializes and updates the database schema as needed.
- Ensures data integrity with foreign key constraints and indexing for performance optimization.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/pcb-inventory.git
   cd pcb-inventory
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Run the app on your desired platform:
   - For Android: `npm run android`
   - For iOS: `npm run ios`
   - For Web: `npm run web`

## Project Structure

```
.
├── App.js                     # Main application entry point
├── db/
│   └── database.js            # SQLite database operations
├── screens/
│   ├── AddItemScreen.js       # Screen for adding new inventory items
│   ├── ItemListScreen.js      # Screen for managing inventory items
│   ├── FinanceScreen.js       # Screen for managing finances
│   └── ManageEntitiesScreen.js # Screen for managing item types, customers, and PCB models
├── assets/                    # App assets (icons, images, etc.)
├── package.json               # Project dependencies and scripts
└── README.md                  # Project documentation
```

## Technologies Used

- **React Native**: For building the mobile application.
- **Expo**: For rapid development and deployment.
- **SQLite**: For local data storage.
- **React Navigation**: For navigation between screens.
- **React Native Vector Icons**: For icons in the UI.

## How It Works

1. **Database Initialization**: The app initializes the SQLite database on startup using the `initDB` function in `db/database.js`.
2. **Entity Management**: Users can manage item types, customers, and PCB models through the "Manage Entities" screen.
3. **Inventory Tracking**: Users can add new repair items, track their status, and update their details as needed.
4. **Finance Tracking**: View financial summaries and manage transactions.

## Future Enhancements

- Add cloud synchronization for multi-device support.
- Implement user authentication and role-based access control.
- Add analytics and reporting features for better insights.
