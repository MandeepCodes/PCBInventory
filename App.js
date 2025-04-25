import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons'; // Import icons
import AddItemScreen from './screens/AddItemScreen';
import ItemListScreen from './screens/ItemListScreen';
import FinanceScreen from './screens/FinanceScreen';
import ManageEntitiesScreen from './screens/ManageEntitiesScreen';

import { initDB } from './db/database';

const Tab = createBottomTabNavigator();

export default function App() {
  useEffect(() => {
    initDB();
  }, []);

  return (
    <NavigationContainer>
      <Tab.Navigator
  screenOptions={({ route }) => ({
    tabBarIcon: ({ color, size }) => {
      let iconName;

      if (route.name === 'Add Inventory') {
        iconName = 'add-circle-outline';
      } else if (route.name === 'Inventory') {
        iconName = 'list-circle-outline';
      } else if (route.name === 'Finance') {
        iconName = 'cash-outline';
      } else if (route.name === 'Manage Entities') {
        iconName = 'settings-outline';
      }

      return <Icon name={iconName} size={size} color={color} />;
    },
    tabBarActiveTintColor: 'tomato',
    tabBarInactiveTintColor: 'gray',
  })}
>
  <Tab.Screen name="Add Inventory" component={AddItemScreen} />
  <Tab.Screen name="Inventory" component={ItemListScreen} />
  <Tab.Screen name="Finance" component={FinanceScreen} />
  <Tab.Screen name="Manage Entities" component={ManageEntitiesScreen} />
</Tab.Navigator>

    </NavigationContainer>
  );
}
