import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { addItemToDB } from '../db/database';

export default function AddItemScreen() {
  const [itemType, setItemType] = useState('');
  const [personName, setPersonName] = useState('');
  const [pcbModel, setPcbModel] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');

  const handleSubmit = async () => {
    if (!itemType || !personName || !pcbModel || !estimatedTime) {
      Alert.alert('Error', 'Please fill out all fields.');
      return;
    }

    try {
      await addItemToDB(itemType, personName, pcbModel, estimatedTime);
      Alert.alert('Success', 'Item added successfully!');

      // Clear the form
      setItemType('');
      setPersonName('');
      setPcbModel('');
      setEstimatedTime('');
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Error', 'Failed to add item.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Item Type</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., AC, Washing Machine"
        value={itemType}
        onChangeText={setItemType}
      />

      <Text style={styles.label}>Person Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter person's name"
        value={personName}
        onChangeText={setPersonName}
      />

      <Text style={styles.label}>PCB Model</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Samsung, LG"
        value={pcbModel}
        onChangeText={setPcbModel}
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
