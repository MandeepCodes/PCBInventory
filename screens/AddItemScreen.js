import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { addItemToDB, getAllItemTypes, getAllPersons, getAllPcbModels, initDB } from '../db/database';

export default function AddItemScreen() {
  const [itemTypeId, setItemTypeId] = useState(null);
  const [personId, setPersonId] = useState(null);
  const [pcbModelId, setPcbModelId] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [itemTypes, setItemTypes] = useState([]);
  const [persons, setPersons] = useState([]);
  const [pcbModels, setPcbModels] = useState([]);
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await initDB(); // Initialize the database
        setDbInitialized(true); // Set the state to indicate the database is ready
      } catch (error) {
        console.error('Error initializing database:', error);
        Alert.alert('Error', 'Failed to initialize the database.');
      }
    };

    initializeDatabase();
  }, []);

  useEffect(() => {
    if (!dbInitialized) return; // Wait until the database is initialized

    const fetchDropdownData = async () => {
      try {
        const itemTypesData = await getAllItemTypes();
        const personsData = await getAllPersons();
        const pcbModelsData = await getAllPcbModels();

        setItemTypes(itemTypesData.map(item => ({ label: item.name, value: item.id })));
        setPersons(personsData.map(person => ({
          label: `${person.name} (${person.phoneNumber})`,
          value: person.id,
        })));
        setPcbModels(pcbModelsData.map(model => ({ label: model.name, value: model.id })));
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      }
    };

    fetchDropdownData();
  }, [dbInitialized]); // Run this effect only after the database is initialized

  const handleSubmit = async () => {
    if (!itemTypeId || !personId || !pcbModelId || !estimatedTime) {
      Alert.alert('Error', 'Please fill out all fields.');
      return;
    }

    try {
      await addItemToDB(itemTypeId, personId, pcbModelId, estimatedTime);
      Alert.alert('Success', 'Item added successfully!');

      // Clear the form
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
    <View style={styles.container}>
      <Text style={styles.label}>Item Type</Text>
      <RNPickerSelect
        onValueChange={setItemTypeId}
        items={itemTypes}
        value={itemTypeId}
        placeholder={{ label: 'Select Item Type', value: null }}
        style={pickerSelectStyles}
      />

      <Text style={styles.label}>Person</Text>
      <RNPickerSelect
        onValueChange={setPersonId}
        items={persons}
        value={personId}
        placeholder={{ label: 'Select Person', value: null }}
        style={pickerSelectStyles}
      />

      <Text style={styles.label}>PCB Model</Text>
      <RNPickerSelect
        onValueChange={setPcbModelId}
        items={pcbModels}
        value={pcbModelId}
        placeholder={{ label: 'Select PCB Model', value: null }}
        style={pickerSelectStyles}
      />

      <Text style={styles.label}>Estimated Time</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 2 days"
        value={estimatedTime}
        onChangeText={setEstimatedTime}
      />

      <Button title="Add Item" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
});

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
    marginBottom: 15,
  },
  inputAndroid: {
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
    marginBottom: 15,
  },
};
