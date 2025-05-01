import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome'; // Switched to FontAwesome for better clarity
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

            switch (route.name) {
              case 'Add Inventory':
                iconName = 'plus-square'; // Represents adding items
                break;
              case 'Inventory':
                iconName = 'archive'; // Represents inventory management
                break;
              case 'Finance':
                iconName = 'money'; // More familiar finance symbol
                break;
              case 'Manage Entities':
                iconName = 'cogs'; // Better for management settings
                break;
              default:
                iconName = 'question-circle';
            }

            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007bff',
          tabBarInactiveTintColor: '#777',
          tabBarStyle: {
            backgroundColor: '#fff',
            height: 60,
            paddingBottom: 5,
          },
          tabBarLabelStyle: {
            fontSize: 14,
            fontWeight: '600',
          },
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
