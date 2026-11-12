import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapViewComponent from '@/components/MapViewComponent';

export default function Page() {
  return (
      <View style={styles.container}>
        <MapViewComponent />
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});