import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput } from 'react-native';
import { getItemsByDueStatus } from '../db/database';

export default function InventoryScreen() {
  const [items, setItems] = useState([]);
  const [estimatedTime, setEstimatedTime] = useState(0); // New state for estimated time

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await getItemsByDueStatus();
        setItems(data);
      } catch (error) {
        console.error('Error fetching inventory items:', error);
      }
    };

    fetchItems();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.title}>{item.itemType}</Text>
      <Text>Person: {item.personName} (Priority: {item.priority})</Text>
      <Text>PCB Model: {item.pcbModel}</Text>
      <Text>Due Date: {item.dueDate}</Text>
      <Text>Status: {item.status}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListHeaderComponent={<Text style={styles.header}>Inventory</Text>} // Use ListHeaderComponent for the title
      />
      <TextInput
        style={styles.input}
        placeholder="Enter estimated time (in days)"
        value={estimatedTime.toString()}
        onChangeText={(value) => setEstimatedTime(Number(value))} // Convert input to a number
        keyboardType="numeric"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  item: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginTop: 20,
    paddingLeft: 8,
  },
});
