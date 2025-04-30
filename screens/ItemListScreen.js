import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; // Import useFocusEffect
import { getItemsByDueStatus } from '../db/database';

export default function InventoryScreen() {
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch items from the database
  const fetchItems = async () => {
    try {
      const data = await getItemsByDueStatus();

      // Sort by dueDate first, then by priority
      const sortedData = data.sort((a, b) => {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);

        // Compare dates first
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;

        // If dates are the same, compare priority (higher priority first)
        return b.priority - a.priority;
      });

      setItems(sortedData);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  };

  // Use useFocusEffect to refresh the list when the screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      fetchItems();
    }, [])
  );

  const renderItem = ({ item }) => {
    // Determine the background color based on the item's status
    const backgroundColor =
      item.status === 'dueToday'
        ? '#d4edda' // Light green for due today
        : item.status === 'overdue'
        ? '#f8d7da' // Red for overdue
        : '#fff3cd'; // Yellow for upcoming

    return (
      <View style={[styles.item, { backgroundColor }]}>
        <Text style={styles.title}>{item.itemType}</Text>
        <Text>Person: {item.personName} (Priority: {item.priority})</Text>
        <Text>PCB Model: {item.pcbModel}</Text>
        <Text>Due Date: {item.dueDate}</Text>
        <Text>Status: {item.status}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListHeaderComponent={() => <Text style={styles.header}>Inventory</Text>}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
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
});
