import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import {
  getFinanceSummary,
  getFilterData,
  updateRepairDetails,
} from '../db/database';
import moment from 'moment';
import { FontAwesome } from '@expo/vector-icons';

export default function FinanceScreen() {
  const [financeData, setFinanceData] = useState({
    totalRevenue: 0,
    pendingPayments: 0,
    monthlyRevenue: 0,
    recentTransactions: [],
  });
  const [refreshing, setRefreshing] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Separate dropdown open states
  const [openPersonName, setOpenPersonName] = useState(false);
  const [openItemType, setOpenItemType] = useState(false);
  const [openPcbModel, setOpenPcbModel] = useState(false);
  const [openIsPaid, setOpenIsPaid] = useState(false);

  // Dropdown values
  const [personName, setPersonName] = useState(null);
  const [itemType, setItemType] = useState(null);
  const [pcbModel, setPcbModel] = useState(null);
  const [isPaid, setIsPaid] = useState(null);

  // Dropdown items
  const [personNameItems, setPersonNameItems] = useState([]);
  const [itemTypeItems, setItemTypeItems] = useState([]);
  const [pcbModelItems, setPcbModelItems] = useState([]);
  const [isPaidItems] = useState([
    { label: 'Paid', value: true },
    { label: 'Unpaid', value: false },
  ]);

  // Custom toggle function for dropdown selection.
  const handleToggleValue = (currentValue, callbackOrValue, setter) => {
    setter((prev) => {
      const newValue =
        typeof callbackOrValue === 'function' ? callbackOrValue(prev) : callbackOrValue;
      return newValue === currentValue ? null : newValue;
    });
  };

  const handlePersonNameChange = (callbackOrValue) =>
    handleToggleValue(personName, callbackOrValue, setPersonName);
  const handleItemTypeChange = (callbackOrValue) =>
    handleToggleValue(itemType, callbackOrValue, setItemType);
  const handlePcbModelChange = (callbackOrValue) =>
    handleToggleValue(pcbModel, callbackOrValue, setPcbModel);
  const handleIsPaidChange = (callbackOrValue) =>
    handleToggleValue(isPaid, callbackOrValue, setIsPaid);

  const fetchFinanceData = async () => {
    try {
      const data = await getFinanceSummary();
      setFinanceData(data);
    } catch (error) {
      console.error('Error fetching finance data:', error);
    }
  };

  const fetchFilterData = async () => {
    try {
      const filterData = await getFilterData();
      setPersonNameItems(
        filterData.personNames.map((name) => ({ label: name, value: name }))
      );
      setItemTypeItems(
        filterData.itemTypes.map((type) => ({ label: type, value: type }))
      );
      setPcbModelItems(
        filterData.pcbModels.map((model) => ({ label: model, value: model }))
      );
    } catch (error) {
      console.error('Error fetching filter data:', error);
    }
  };

  useEffect(() => {
    fetchFinanceData();
    fetchFilterData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFinanceData();
    setRefreshing(false);
  };

  // IMPORTANT: Convert transaction.isPaid to Boolean before comparing
  const applyFilters = (transactions) => {
    return transactions.filter((transaction) => {
      const matchesPerson = personName ? transaction.personName === personName : true;
      const matchesItemType = itemType ? transaction.itemType === itemType : true;
      const matchesPcbModel = pcbModel ? transaction.pcbModel === pcbModel : true;
      const matchesPaidStatus = isPaid !== null ? Boolean(transaction.isPaid) === isPaid : true;
      return matchesPerson && matchesItemType && matchesPcbModel && matchesPaidStatus;
    });
  };

  // Function to mark an unpaid transaction as paid.
  const markItemAsPaid = async (item) => {
    Alert.alert(
      'Confirm Payment',
      'Mark this transaction as paid?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              // Update the repair details marking as paid.
              // Note: updateRepairDetails(itemId, repairAmount, isPaid) sets isPaid and status
              await updateRepairDetails(item.id, item.repairAmount, true);
              await fetchFinanceData(); // Refresh the data after updating
            } catch (error) {
              console.error('Error marking item as paid:', error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderTransaction = ({ item }) => {
    // Apply dynamic background color: greenish for paid, reddish for unpaid.
    const transactionContainerStyle = [
      styles.transactionItem,
      { backgroundColor: item.isPaid ? '#d4edda' : '#f8d7da' },
    ];

    return (
      <View style={transactionContainerStyle}>
        <Text style={styles.transactionText}>
          {item.personName} - ₹{item.repairAmount}
        </Text>
        <Text style={styles.transactionDetails}>
          {item.itemType} - {item.pcbModel}
        </Text>
        <Text style={styles.transactionDate}>
          {moment(item.updatedAt).format('DD-MM-YYYY HH:mm')}
        </Text>
        {/* Show a "Mark as Paid" button only if the transaction is unpaid */}
        {!item.isPaid && (
          <TouchableOpacity
            style={styles.markButton}
            onPress={() => markItemAsPaid(item)}
          >
            <Text style={styles.markButtonText}>Mark as Paid</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Finance Summary</Text>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Total Revenue</Text>
          <Text style={styles.summaryValue}>₹{financeData.totalRevenue}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Pending Payments</Text>
          <Text style={styles.summaryValue}>₹{financeData.pendingPayments}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Monthly Revenue</Text>
          <Text style={styles.summaryValue}>₹{financeData.monthlyRevenue}</Text>
        </View>
      </View>

      {filtersVisible && (
        <View style={styles.filtersContainer}>
          <View style={{ zIndex: 4000, marginBottom: 10 }}>
            <DropDownPicker
              open={openPersonName}
              value={personName}
              items={personNameItems}
              setOpen={setOpenPersonName}
              setValue={handlePersonNameChange}
              placeholder="Filter by Person Name"
              searchable={true}
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropDownContainer}
            />
          </View>

          <View style={{ zIndex: 3000, marginBottom: 10 }}>
            <DropDownPicker
              open={openItemType}
              value={itemType}
              items={itemTypeItems}
              setOpen={setOpenItemType}
              setValue={handleItemTypeChange}
              placeholder="Filter by Item Type"
              searchable={true}
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropDownContainer}
            />
          </View>

          <View style={{ zIndex: 2000, marginBottom: 10 }}>
            <DropDownPicker
              open={openPcbModel}
              value={pcbModel}
              items={pcbModelItems}
              setOpen={setOpenPcbModel}
              setValue={handlePcbModelChange}
              placeholder="Filter by PCB Model"
              searchable={true}
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropDownContainer}
            />
          </View>

          <View style={{ zIndex: 1000, marginBottom: 10 }}>
            <DropDownPicker
              open={openIsPaid}
              value={isPaid}
              items={isPaidItems}
              setOpen={setOpenIsPaid}
              setValue={handleIsPaidChange}
              setItems={() => {}}
              placeholder="Filter by Paid/Unpaid"
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropDownContainer}
            />
          </View>
        </View>
      )}

      <Text style={styles.sectionHeader}>Recent Transactions</Text>
      <FlatList
        data={applyFilters(financeData.recentTransactions)}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTransaction}
        style={styles.transactionList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setFiltersVisible(!filtersVisible)}
      >
        <FontAwesome name="filter" size={24} color="#fff" />
      </TouchableOpacity>
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
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  filtersContainer: {
    marginBottom: 20,
  },
  dropdown: {
    borderColor: '#ccc',
  },
  dropDownContainer: {
    borderColor: '#ccc',
  },
  transactionList: {
    marginTop: 10,
  },
  transactionItem: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  transactionText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionDetails: {
    fontSize: 14,
    color: '#6c757d',
  },
  transactionDate: {
    fontSize: 14,
    color: '#6c757d',
  },
  markButton: {
    marginTop: 10,
    backgroundColor: '#007bff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  markButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  filterButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007bff',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
});
