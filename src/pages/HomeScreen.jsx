import { StyleSheet, View } from 'react-native';
import MapViewComponent from '../components/MapViewComponent';
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <MapViewComponent />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});