import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { useFocusEffect } from '@react-navigation/native';
import {
  addItemToDB,
  getAllItemTypes,
  getAllPersons,
  getAllPcbModels,
  initDB,
} from '../db/database';

export default function AddItemScreen() {
  // Form fields
  const [itemTypeId, setItemTypeId] = useState(null);
  const [personId, setPersonId] = useState(null);
  const [pcbModelId, setPcbModelId] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState('');

  // Dropdown data
  const [itemTypes, setItemTypes] = useState([]);
  const [persons, setPersons] = useState([]);
  const [pcbModels, setPcbModels] = useState([]);

  // Database initialization state
  const [dbInitialized, setDbInitialized] = useState(false);

  // Open states for individual dropdowns
  const [openItemType, setOpenItemType] = useState(false);
  const [openPerson, setOpenPerson] = useState(false);
  const [openPcbModel, setOpenPcbModel] = useState(false);

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await initDB(); // Initialize the database
        setDbInitialized(true);
      } catch (error) {
        console.error('Error initializing database:', error);
        Alert.alert('Error', 'Failed to initialize the database.');
      }
    };

    initializeDatabase();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const itemTypesData = await getAllItemTypes();
      const personsData = await getAllPersons();
      const pcbModelsData = await getAllPcbModels();

      setItemTypes(
        itemTypesData.map(item => ({ label: item.name, value: item.id }))
      );
      setPersons(
        personsData.map(person => ({
          label: `${person.name} (${person.phoneNumber})`,
          value: person.id,
        }))
      );
      setPcbModels(
        pcbModelsData.map(model => ({ label: model.name, value: model.id }))
      );
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (dbInitialized) {
        fetchDropdownData(); // Refresh dropdown data when the screen gains focus
      }
    }, [dbInitialized])
  );

  const handleSubmit = async () => {
    if (!itemTypeId || !personId || !pcbModelId || !estimatedTime) {
      Alert.alert('Error', 'Please fill out all fields.');
      return;
    }

    try {
      // Add the item to the database and get the inserted item's ID
      const itemId = await addItemToDB(itemTypeId, personId, pcbModelId, estimatedTime);

      // Fetch the serial number of the newly added item
      const addedItem = await db.getFirstAsync(
        `SELECT serialNumber FROM items WHERE id = ?`,
        [itemId]
      );

      // Display the success message with the serial number
      Alert.alert('Success', `Item added successfully! Serial Number: ${addedItem.serialNumber}`);

      // Clear the form fields
      setItemTypeId(null);
      setPersonId(null);
      setPcbModelId(null);
      setEstimatedTime('');
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Error', 'Failed to add item.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Add New Item</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Item Type</Text>
        <DropDownPicker
          open={openItemType}
          value={itemTypeId}
          items={itemTypes}
          setOpen={setOpenItemType}
          setValue={setItemTypeId}
          setItems={setItemTypes}
          searchable={true}
          searchPlaceholder="Search Item Types..."
          placeholder="Select Item Type"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropDownContainer}
          zIndex={3000}
        />

        <Text style={styles.label}>Person</Text>
        <DropDownPicker
          open={openPerson}
          value={personId}
          items={persons}
          setOpen={setOpenPerson}
          setValue={setPersonId}
          setItems={setPersons}
          searchable={true}
          searchPlaceholder="Search Persons..."
          placeholder="Select Person"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropDownContainer}
          zIndex={2000}
        />

        <Text style={styles.label}>PCB Model</Text>
        <DropDownPicker
          open={openPcbModel}
          value={pcbModelId}
          items={pcbModels}
          setOpen={setOpenPcbModel}
          setValue={setPcbModelId}
          setItems={setPcbModels}
          searchable={true}
          searchPlaceholder="Search PCB Models..."
          placeholder="Select PCB Model"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropDownContainer}
          zIndex={1000}
        />

        <Text style={styles.label}>Estimated Time</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 2 days"
          placeholderTextColor="#aaa"
          value={estimatedTime}
          onChangeText={setEstimatedTime}
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Add Item</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    alignSelf: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    // iOS shadow
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    // Android shadow
    elevation: 5,
  },
  label: {
    fontSize: 16,
    color: '#555',
    fontWeight: '600',
    marginBottom: 5,
    marginTop: 15,
  },
  input: {
    fontSize: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    color: '#333',
    backgroundColor: '#fafafa',
    marginBottom: 15,
  },
  dropdown: {
    borderColor: '#ddd',
    marginBottom: 15,
  },
  dropDownContainer: {
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
});
