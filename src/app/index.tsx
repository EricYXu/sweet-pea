import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConversationCard } from '@/components/conversation-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useRecording } from '@/context/recording-context';
import { getConversations } from '@/services/storage';
import type { Conversation } from '@/types/conversation';

const TAB_BAR_HEIGHT = 60;
const RECORD_BUTTON_OVERHANG = 32; // half of the raised button

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { registerConversationListener, recordingState, elapsedSeconds } = useRecording();

  // Load conversations from storage on mount
  useEffect(() => {
    getConversations().then(setConversations);
  }, []);

  // Listen for new / updated conversations from the recording context
  useEffect(() => {
    registerConversationListener((updated) => {
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === updated.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = updated;
          return next;
        }
        return [updated, ...prev];
      });
    });
  }, [registerConversationListener]);

  const handleCardPress = useCallback(
    (id: string) => {
      router.push({ pathname: '/conversation/[id]', params: { id } });
    },
    [router]
  );

  const isRecording = recordingState === 'recording';
  const isProcessing = recordingState === 'processing';

  const formatElapsed = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <ThemedView style={styles.container}>
      {/* Recording banner */}
      {(isRecording || isProcessing) && (
        <View style={[styles.banner, { paddingTop: insets.top + Spacing.two }]}>
          <View style={styles.bannerDot} />
          <ThemedText type="small" style={styles.bannerText}>
            {isRecording
              ? `Recording  ${formatElapsed(elapsedSeconds)}`
              : 'Transcribing…'}
          </ThemedText>
        </View>
      )}

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: isRecording || isProcessing ? Spacing.two : insets.top + Spacing.three,
            paddingBottom: insets.bottom + TAB_BAR_HEIGHT + RECORD_BUTTON_OVERHANG + Spacing.four,
          },
        ]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <ThemedText type="subtitle" style={styles.heading}>
            Conversations
          </ThemedText>
        }
        ListEmptyComponent={
          <ThemedView type="backgroundElement" style={styles.emptyState}>
            <ThemedText type="default" style={styles.emptyIcon}>
              🎙️
            </ThemedText>
            <ThemedText type="default" style={styles.emptyTitle}>
              No conversations yet
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptySubtitle}>
              Tap the microphone button to start recording.
            </ThemedText>
          </ThemedView>
        }
        renderItem={({ item }) => (
          <ConversationCard
            conversation={item}
            onPress={() => handleCardPress(item.id)}
          />
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
    backgroundColor: '#3c87f715',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3c87f740',
  },
  bannerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e05454',
  },
  bannerText: {
    color: '#3c87f7',
    fontVariant: ['tabular-nums'],
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  heading: {
    paddingBottom: Spacing.two,
  },
  separator: {
    height: Spacing.two,
  },
  emptyState: {
    borderRadius: Spacing.three,
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    fontWeight: '600',
  },
  emptySubtitle: {
    textAlign: 'center',
  },
});
