import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Pager } from 'react-native-pager-view';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import {
  getAllItemTypes,
  getAllPersons,
  getAllPcbModels,
  addPerson,
  addItemType,
  addPcbModel,
  removeItemType,
  removePerson,
  removePcbModel,
} from '../db/database';

export default function ManageEntitiesScreen() {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'itemType', title: 'Item Types' },
    { key: 'person', title: 'Persons' },
    { key: 'pcbModel', title: 'PCB Models' },
  ]);

  const [entities, setEntities] = useState({
    itemType: [],
    person: [],
    pcbModel: [],
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [newEntry, setNewEntry] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [priority, setPriority] = useState(1);

  // Fetch all entities on component mount
  useEffect(() => {
    const fetchAllEntities = async () => {
      try {
        const [itemTypes, persons, pcbModels] = await Promise.all([
          getAllItemTypes(),
          getAllPersons(),
          getAllPcbModels(),
        ]);
        setEntities({
          itemType: itemTypes,
          person: persons,
          pcbModel: pcbModels,
        });
      } catch (error) {
        console.error('Error fetching entities:', error);
        Alert.alert('Error', 'Failed to fetch entities. Please try again.');
      }
    };

    fetchAllEntities();
  }, []);

  // Fetch entities for a specific type
  const fetchEntitiesForType = async (type) => {
    try {
      let data = [];
      if (type === 'itemType') {
        data = await getAllItemTypes();
      } else if (type === 'person') {
        data = await getAllPersons();
      } else if (type === 'pcbModel') {
        data = await getAllPcbModels();
      }
      setEntities((prev) => ({ ...prev, [type]: data }));
    } catch (error) {
      console.error(`Error fetching ${type}s:`, error);
      Alert.alert('Error', `Failed to fetch ${type}s. Please try again.`);
    }
  };

  // Handle adding a new entity
  const handleAddEntity = async () => {
    const currentType = routes[index].key;

    if (!newEntry.trim()) {
      Alert.alert('Error', 'Please enter a valid name.');
      return;
    }

    if (currentType === 'person') {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(phoneNumber)) {
        Alert.alert('Error', 'Please enter a valid 10-digit phone number.');
        return;
      }

      if (priority < 1 || priority > 5) {
        Alert.alert('Error', 'Priority must be between 1 and 5.');
        return;
      }
    }

    try {
      if (currentType === 'person') {
        await addPerson(newEntry.trim(), phoneNumber, priority);
      } else if (currentType === 'itemType') {
        await addItemType(newEntry.trim());
      } else if (currentType === 'pcbModel') {
        await addPcbModel(newEntry.trim());
      }
      Alert.alert('Success', `${currentType} added successfully!`);
      setNewEntry('');
      setPhoneNumber('');
      setPriority(1);
      await fetchEntitiesForType(currentType);
      setModalVisible(false);
    } catch (error) {
      console.error(`Error adding ${currentType}:`, error);
      Alert.alert('Error', `Failed to add ${currentType}.`);
    }
  };

  // Handle deleting an entity
  const handleDeleteEntity = async (id) => {
    const currentType = routes[index].key;
    try {
      if (currentType === 'itemType') {
        await removeItemType(id);
      } else if (currentType === 'person') {
        await removePerson(id);
      } else if (currentType === 'pcbModel') {
        await removePcbModel(id);
      }
      Alert.alert('Success', `${currentType} deleted successfully!`);
      await fetchEntitiesForType(currentType);
    } catch (error) {
      console.error(`Error deleting ${currentType}:`, error);
      Alert.alert('Error', `Failed to delete ${currentType}.`);
    }
  };

  // Render a list for each tab
  const renderScene = ({ route }) => {
    const data = entities[route.key] || [];
    const titles = {
      itemType: 'Item Types',
      person: 'Persons',
      pcbModel: 'PCB Models',
    };
    return (
      <View style={styles.sceneContainer}>
        <FlatList
          data={data}
          keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
          renderItem={({ item }) => (
            <View style={styles.entityItemContainer}>
              <Text style={styles.entityItemText}>
                {route.key === 'person'
                  ? `${item.name} (${item.phoneNumber})`
                  : item.name}
              </Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteEntity(item.id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No {titles[route.key].toLowerCase()} found!
            </Text>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: Dimensions.get('window').width }}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: '#007bff' }}
            style={{ backgroundColor: '#fff' }}
            activeColor="#007bff"
            inactiveColor="#777"
            labelStyle={{ fontWeight: '600', fontSize: 16 }}
          />
        )}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        accessibilityLabel="Add new entity"
        accessibilityHint="Opens a modal to add a new entity"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              Add {routes[index].key === 'itemType'
                ? 'Item Type'
                : routes[index].key === 'person'
                ? 'Person'
                : 'PCB Model'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter name"
              placeholderTextColor="#999"
              value={newEntry}
              onChangeText={setNewEntry}
            />
            {routes[index].key === 'person' && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Enter phone number"
                  placeholderTextColor="#999"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter priority (1-5)"
                  placeholderTextColor="#999"
                  value={priority.toString()}
                  keyboardType="numeric"
                  onChangeText={(value) => setPriority(Number(value))}
                />
              </>
            )}
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleAddEntity}
              >
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#dc3545' }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  sceneContainer: {
    flex: 1,
    padding: 20,
  },
  entityItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  entityItemText: {
    fontSize: 16,
    color: '#333',
  },
  deleteButton: {
    backgroundColor: '#ff4d4d',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#007bff',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  fabText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    fontSize: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 15,
    color: '#333',
    backgroundColor: '#f7f7f7',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  modalButtonText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
});
