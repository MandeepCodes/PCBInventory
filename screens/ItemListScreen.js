import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Button,
  Alert,
  Modal,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getItemsByDueStatus, updateItemStatus, updateRepairDetails } from '../db/database'; // Add updateRepairDetails function
import FontAwesome from 'react-native-vector-icons/FontAwesome';

export default function InventoryScreen() {
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [repairAmount, setRepairAmount] = useState('');
  const [isPaid, setIsPaid] = useState(false);

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

  useFocusEffect(
    React.useCallback(() => {
      fetchItems();
    }, [])
  );

  // Handle Non-Repairable button
  const handleNonRepairable = async (itemId) => {
    try {
      // Update the item's status in the database
      await updateItemStatus(itemId, 'nonRepairable');

      // Remove the item from the list
      setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error('Error marking item as non-repairable:', error);
      Alert.alert('Error', 'Failed to mark item as non-repairable.');
    }
  };

  // Handle Done button
  const handleDone = (item) => {
    Alert.alert('Done', `Send WhatsApp message to ${item.personName}.`);
    // Placeholder for WhatsApp message implementation
  };

  // Handle Handed Over button
  const handleHandedOver = (item) => {
    setSelectedItem(item);
    setModalVisible(true); // Show modal
  };

  // Submit Handed Over details
  const submitHandedOver = async () => {
    try {
      // Update the item's repair details and status in the database
      await updateRepairDetails(selectedItem.id, parseFloat(repairAmount), isPaid);

      // Show confirmation alert
      Alert.alert(
        'Handed Over',
        `Repair Amount: ${repairAmount}, Paid: ${isPaid ? 'Yes' : 'No'}`
      );

      // Remove the handed-over item from the list
      setItems((prevItems) => prevItems.filter((item) => item.id !== selectedItem.id));

      // Reset modal state
      setModalVisible(false);
      setRepairAmount('');
      setIsPaid(false);
    } catch (error) {
      console.error('Error submitting handed over details:', error);
      Alert.alert('Error', 'Failed to update repair details.');
    }
  };

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
        <View style={styles.iconContainer}>
          <TouchableOpacity onPress={() => handleNonRepairable(item.id)}>
            <FontAwesome name="times-circle" size={24} color="#dc3545" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDone(item)}>
            <FontAwesome name="check-circle" size={24} color="#28a745" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleHandedOver(item)}>
            <FontAwesome name="handshake-o" size={24} color="#007bff" />
          </TouchableOpacity>
        </View>
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
      {/* Modal for Handed Over */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Handed Over</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Repair Amount"
              keyboardType="numeric"
              value={repairAmount}
              onChangeText={setRepairAmount}
            />
            <View style={styles.checkboxContainer}>
              <Text>Paid:</Text>
              <TouchableOpacity onPress={() => setIsPaid(!isPaid)}>
                <FontAwesome
                  name={isPaid ? 'check-square' : 'square-o'}
                  size={24}
                  color="#007bff"
                />
              </TouchableOpacity>
            </View>
            <Button title="Submit" onPress={submitHandedOver} />
            <Button
              title="Cancel"
              onPress={() => setModalVisible(false)}
              color="#dc3545"
            />
          </View>
        </View>
      </Modal>
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
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
});
