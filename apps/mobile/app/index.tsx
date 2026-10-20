import { ActivityIndicator, View } from 'react-native';

/** Splash while the route guard in _layout restores the session and redirects. */
export default function Index() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator />
    </View>
  );
}
