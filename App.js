import React from 'react';
import { Platform, StyleSheet, Text, View, StatusBar } from 'react-native';
import RootNavigation from './navigation/RootNavigation';

export default class App extends React.Component {
  render()
   {
    return (
      <View style={styles.container}>
        {Platform.OS === 'ios' && <StatusBar barStyle="default" />}
        <RootNavigation />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D3D3D3',
    // alignItems: 'center',
    // justifyContent: 'center',
  },
});
