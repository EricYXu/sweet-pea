import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getConversation } from '@/services/storage';
import type { Conversation, Utterance } from '@/types/conversation';
import { useTheme } from '@/hooks/use-theme';

const TAB_BAR_HEIGHT = 60;
const RECORD_BUTTON_OVERHANG = 32;

/** Speaker colors — cycles through a fixed palette for A, B, C… */
const SPEAKER_COLORS = ['#3c87f7', '#e07b3c', '#3cb87a', '#c43cf7', '#f73c3c', '#f7c13c'];

function speakerColor(speaker: string): string {
  const index = speaker.charCodeAt(0) - 'A'.charCodeAt(0);
  return SPEAKER_COLORS[index % SPEAKER_COLORS.length];
}

/** Format mm:ss from milliseconds. */
function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/** Format duration in seconds as "1h 23m" / "45m" / "30s". */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs > 0) return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
  return `${mins}m`;
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [conversation, setConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    if (id) getConversation(id).then((c) => setConversation(c ?? null));
  }, [id]);

  if (!conversation) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText themeColor="textSecondary">Loading…</ThemedText>
      </ThemedView>
    );
  }

  const speakers = Array.from(new Set(conversation.utterances.map((u) => u.speaker))).sort();

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + Spacing.two, borderBottomColor: theme.backgroundElement },
        ]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            size={22}
            tintColor={theme.text}
          />
        </Pressable>
        <View style={styles.headerTextGroup}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {conversation.title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatDuration(conversation.duration)}
            {speakers.length > 0 && `  ·  ${speakers.length} speaker${speakers.length !== 1 ? 's' : ''}`}
          </ThemedText>
        </View>
      </View>

      {/* Speaker legend */}
      {speakers.length > 0 && (
        <View style={styles.legend}>
          {speakers.map((s) => (
            <View key={s} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: speakerColor(s) }]} />
              <ThemedText type="small" themeColor="textSecondary">
                Speaker {s}
              </ThemedText>
            </View>
          ))}
        </View>
      )}

      {/* Transcript */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom + TAB_BAR_HEIGHT + RECORD_BUTTON_OVERHANG + Spacing.four,
          },
        ]}>
        {conversation.status === 'processing' && (
          <ThemedView type="backgroundElement" style={styles.statusCard}>
            <ThemedText type="small" themeColor="textSecondary">
              Transcription in progress…
            </ThemedText>
          </ThemedView>
        )}

        {conversation.status === 'error' && (
          <ThemedView type="backgroundElement" style={styles.statusCard}>
            <ThemedText type="small" style={{ color: '#e05454' }}>
              {conversation.error ?? 'Transcription failed.'}
            </ThemedText>
          </ThemedView>
        )}

        {conversation.utterances.map((utterance, i) => (
          <UtteranceRow key={i} utterance={utterance} />
        ))}
      </ScrollView>
    </ThemedView>
  );
}

function UtteranceRow({ utterance }: { utterance: Utterance }) {
  const color = speakerColor(utterance.speaker);

  return (
    <View style={styles.utteranceRow}>
      {/* Speaker label */}
      <View style={styles.utteranceMeta}>
        <View style={[styles.speakerBadge, { backgroundColor: color + '22' }]}>
          <ThemedText type="small" style={[styles.speakerLabel, { color }]}>
            {utterance.speaker}
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary" style={styles.timestamp}>
          {formatTimestamp(utterance.start)}
        </ThemedText>
      </View>

      {/* Speech text */}
      <ThemedText type="default" style={styles.utteranceText}>
        {utterance.text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: Spacing.two,
    marginLeft: -Spacing.two,
  },
  pressed: {
    opacity: 0.6,
  },
  headerTextGroup: {
    flex: 1,
    gap: 2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.four,
  },
  statusCard: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
  },
  utteranceRow: {
    gap: Spacing.one,
  },
  utteranceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  speakerBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Spacing.one,
  },
  speakerLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timestamp: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  utteranceText: {
    lineHeight: 26,
  },
});
