import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

import { AppBootstrap } from './src/presentation/navigation/AppBootstrap';
import { AppProviders } from './src/presentation/providers/AppProviders';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppProviders>
          <NavigationContainer>
            <StatusBar style="dark" />
            <AppBootstrap />
          </NavigationContainer>
        </AppProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
