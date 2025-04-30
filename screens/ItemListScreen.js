import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  TouchableOpacity,
  Switch,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getItemsByDueStatus,
  updateItemStatus,
  updateRepairDetails,
} from '../db/database';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

export default function InventoryScreen() {
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [repairAmount, setRepairAmount] = useState('');
  const [isPaid, setIsPaid] = useState(false);

  // Fetch items and sort them
  const fetchItems = async () => {
    try {
      const data = await getItemsByDueStatus();
      const sortedData = data.sort((a, b) => {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        return b.priority - a.priority; // higher priority first
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

  // Function to send WhatsApp message using Linking API
  const sendWhatsAppMessage = (phoneNumber, message) => {
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(
      message
    )}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (!supported) {
          Alert.alert('Error', 'WhatsApp is not installed on your device.');
        } else {
          return Linking.openURL(url);
        }
      })
      .catch((err) => {
        console.error(err);
        Alert.alert('Error', 'Failed to send WhatsApp message.');
      });
  };

  // Handler for "Done" button: send message or SMS to customer.
  const handleDone = (item) => {
    // Compose a detailed message.
    const message = `Dear ${item.personName}, your ${item.itemType} (${item.pcbModel}) has been repaired and is ready for collection at our shop. Please collect it by ${item.dueDate}. Thank you for choosing us!`;

    // Assume phone number is provided in item.phoneNumber
    const phone = item.phoneNumber || '';
    if (!phone) {
      Alert.alert('No Contact', 'No phone number available for this customer.');
      return;
    }

    // Send via WhatsApp.
    sendWhatsAppMessage(phone, message);
  };

  // Handler for Non-Repairable button
  const handleNonRepairable = async (itemId) => {
    try {
      await updateItemStatus(itemId, 'nonRepairable');
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error('Error marking item as non-repairable:', error);
      Alert.alert('Error', 'Failed to mark item as non-repairable.');
    }
  };

  // Handler for Handed Over button – open modal for repair details input.
  const handleHandedOver = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  // Submit handed over details.
  const submitHandedOver = async () => {
    try {
      await updateRepairDetails(selectedItem.id, parseFloat(repairAmount), isPaid);
      Alert.alert(
        'Handed Over',
        `Repair Amount: ${repairAmount}, Paid: ${isPaid ? 'Yes' : 'No'}`
      );
      setItems((prev) => prev.filter((item) => item.id !== selectedItem.id));
      setModalVisible(false);
      setRepairAmount('');
      setIsPaid(false);
    } catch (error) {
      console.error('Error submitting handed over details:', error);
      Alert.alert('Error', 'Failed to update repair details.');
    }
  };

  // Render each inventory item as a card.
  const renderItem = ({ item }) => {
    const backgroundColor =
      item.status === 'dueToday'
        ? '#d4edda'
        : item.status === 'overdue'
        ? '#f8d7da'
        : '#fff3cd';

    return (
      <View style={[styles.itemCard, { backgroundColor }]}>
        <Text style={styles.itemTitle}>{item.itemType}</Text>
        <Text style={styles.itemText}>
          Person: <Text style={styles.boldText}>{item.personName}</Text> (Priority: {item.priority})
        </Text>
        <Text style={styles.itemText}>PCB Model: {item.pcbModel}</Text>
        <Text style={styles.itemText}>Due Date: {item.dueDate}</Text>
        <Text style={styles.itemText}>Status: {item.status}</Text>
        <View style={styles.iconContainer}>
          <TouchableOpacity onPress={() => handleNonRepairable(item.id)} style={styles.iconButton}>
            <FontAwesome name="times-circle" size={28} color="#dc3545" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDone(item)} style={styles.iconButton}>
            <FontAwesome name="check-circle" size={28} color="#28a745" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleHandedOver(item)} style={styles.iconButton}>
            <FontAwesome name="handshake-o" size={28} color="#007bff" />
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
      />
      {/* Modal for handed over details */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Mark as Handed Over</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter Repair Amount"
              keyboardType="numeric"
              placeholderTextColor="#aaa"
              value={repairAmount}
              onChangeText={setRepairAmount}
            />
            <View style={styles.switchRow}>
              <Text style={styles.modalText}>Paid:</Text>
              <Switch
                value={isPaid}
                onValueChange={setIsPaid}
                trackColor={{ false: '#ccc', true: '#28a745' }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.modalSubmitButton} onPress={submitHandedOver}>
                <Text style={styles.modalButtonText}>Submit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2f5',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  listContent: {
    paddingBottom: 30,
  },
  itemCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  itemTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 8,
  },
  itemText: {
    fontSize: 16,
    marginBottom: 4,
    color: '#555',
  },
  boldText: {
    fontWeight: '600',
    color: '#333',
  },
  iconContainer: {
    flexDirection: 'row',
    marginTop: 15,
    justifyContent: 'space-around',
  },
  iconButton: {
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    fontSize: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
    color: '#333',
    backgroundColor: '#f7f7f7',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    width: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  modalText: {
    fontSize: 18,
    color: '#555',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalSubmitButton: {
    backgroundColor: '#28a745',
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
  },
  modalCancelButton: {
    backgroundColor: '#dc3545',
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 10,
  },
  modalButtonText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
});

//export default InventoryScreen;
