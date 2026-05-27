import { SymbolView } from 'expo-symbols';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, Spacing } from '@/constants/theme';
import { useRecording } from '@/context/recording-context';

const BUTTON_SIZE = 64;
// How much the button rises above the top of the tab bar
const RAISE = BUTTON_SIZE * 0.4;

export function RecordFab() {
  const insets = useSafeAreaInsets();
  const { recordingState, startRecording, stopRecording } = useRecording();

  const isRecording = recordingState === 'recording';
  const isProcessing = recordingState === 'processing';

  // Pulse animation while recording
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isRecording) {
      pulseRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.12, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      pulseRef.current.start();
    } else {
      pulseRef.current?.stop();
      Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    }
  }, [isRecording, pulseAnim]);

  const handlePress = async () => {
    if (isRecording) {
      await stopRecording();
    } else if (recordingState === 'idle') {
      await startRecording();
    }
  };

  const buttonColor = isRecording ? '#e05454' : isProcessing ? '#888888' : '#3c87f7';

  // Position the button centered at the top of the native tab bar
  const bottomOffset = insets.bottom + BottomTabInset - RAISE;

  return (
    <View style={[styles.wrapper, { bottom: bottomOffset }]} pointerEvents="box-none">
      <Pressable
        onPress={handlePress}
        disabled={isProcessing}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
        <Animated.View
          style={[
            styles.button,
            { backgroundColor: buttonColor, transform: [{ scale: pulseAnim }] },
          ]}>
          {isRecording ? (
            <View style={styles.stopIcon} />
          ) : isProcessing ? (
            <SymbolView
              name={{ ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' }}
              size={22}
              tintColor="#fff"
            />
          ) : (
            <SymbolView
              name={{ ios: 'mic.fill', android: 'mic', web: 'mic' }}
              size={28}
              tintColor="#fff"
            />
          )}
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    alignSelf: 'center',
    // Allow touches to pass through the transparent area around the button
    zIndex: 100,
  },
  pressable: {
    borderRadius: BUTTON_SIZE / 2,
  },
  pressed: {
    opacity: 0.8,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  stopIcon: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
});
