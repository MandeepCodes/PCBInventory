import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, FlatList, TouchableOpacity } from 'react-native';
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
  const [entityType, setEntityType] = useState('itemType'); // 'itemType', 'person', or 'pcbModel'
  const [entities, setEntities] = useState([]);
  const [newEntry, setNewEntry] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [priority, setPriority] = useState(1);

  // Fetch entities when the screen is first rendered or when the entity type changes
  useEffect(() => {
    fetchEntities();
  }, [entityType]);

  const fetchEntities = async () => {
    try {
      let data = [];
      if (entityType === 'itemType') {
        data = await getAllItemTypes();
      } else if (entityType === 'person') {
        data = await getAllPersons();
      } else if (entityType === 'pcbModel') {
        data = await getAllPcbModels();
      }
      setEntities(data);
    } catch (error) {
      console.error(`Error fetching ${entityType}s:`, error);
    }
  };

  const handleAddEntity = async () => {
    try {
      if (entityType === 'person') {
        await addPerson(newEntry, phoneNumber, priority);
      } else if (entityType === 'itemType') {
        await addItemType(newEntry);
      } else if (entityType === 'pcbModel') {
        await addPcbModel(newEntry);
      }
      Alert.alert('Success', `${entityType} added successfully!`);
      setNewEntry('');
      setPhoneNumber('');
      setPriority(1);
      fetchEntities(); // Refresh the list after adding
    } catch (error) {
      console.error(`Error adding ${entityType}:`, error);
      Alert.alert('Error', `Failed to add ${entityType}.`);
    }
  };

  const handleDeleteEntity = async (id) => {
    try {
      if (entityType === 'itemType') {
        await removeItemType(id);
      } else if (entityType === 'person') {
        await removePerson(id);
      } else if (entityType === 'pcbModel') {
        await removePcbModel(id);
      }
      Alert.alert('Success', `${entityType} deleted successfully!`);
      fetchEntities(); // Refresh the list after deleting
    } catch (error) {
      console.error(`Error deleting ${entityType}:`, error);
      Alert.alert('Error', `Failed to delete ${entityType}.`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <Button title="Item Types" onPress={() => setEntityType('itemType')} />
        <Button title="Persons" onPress={() => setEntityType('person')} />
        <Button title="PCB Models" onPress={() => setEntityType('pcbModel')} />
      </View>

      <Text style={styles.label}>Manage {entityType}</Text>
      <FlatList
        data={entities}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.entityItemContainer}>
            <Text style={styles.entityItem}>
              {item.name || `${item.name} (${item.phoneNumber})`}
            </Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteEntity(item.id)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <TextInput
        style={styles.input}
        placeholder={`Enter ${entityType} name`}
        value={newEntry}
        onChangeText={setNewEntry}
      />
      {entityType === 'person' && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter phone number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter priority (1-5)"
            value={priority.toString()}
            onChangeText={(value) => setPriority(Number(value))}
            keyboardType="numeric"
          />
        </>
      )}
      <Button title={`Add ${entityType}`} onPress={handleAddEntity} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  entityItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  entityItem: {
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#ff4d4d',
    padding: 5,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
