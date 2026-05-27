import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { RecordFab } from '@/components/record-fab';
import { RecordingProvider } from '@/context/recording-context';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <RecordingProvider>
        <View style={{ flex: 1 }}>
          <AnimatedSplashOverlay />
          <AppTabs />
          <RecordFab />
        </View>
      </RecordingProvider>
    </ThemeProvider>
  );
}
