import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Conversation } from '@/types/conversation';

interface Props {
  conversation: Conversation;
  onPress: () => void;
}

/** Formats a duration in seconds as "1h 23m" or "45m" or "30s". */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs > 0) return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
  return `${mins}m`;
}

/** Formats an ISO date string as "Today 2:34 PM" or "May 23, 2:34 PM". */
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (isToday) return `Today, ${time}`;

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + `, ${time}`;
}

/** Count of unique speakers, e.g. "2 speakers". */
function speakerCount(conversation: Conversation): string | null {
  if (conversation.status !== 'complete') return null;
  const speakers = new Set(conversation.utterances.map((u) => u.speaker));
  const n = speakers.size;
  return n > 0 ? `${n} speaker${n !== 1 ? 's' : ''}` : null;
}

export function ConversationCard({ conversation, onPress }: Props) {
  const theme = useTheme();
  const isProcessing = conversation.status === 'processing';
  const isError = conversation.status === 'error';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
      <ThemedView type="backgroundElement" style={styles.card}>
        {/* Status badge */}
        {(isProcessing || isError) && (
          <View
            style={[
              styles.badge,
              { backgroundColor: isError ? theme.backgroundSelected : '#3c87f720' },
            ]}>
            <ThemedText
              type="small"
              style={{ color: isError ? '#e05454' : '#3c87f7', fontSize: 11 }}>
              {isError ? 'Error' : 'Processing…'}
            </ThemedText>
          </View>
        )}

        {/* Title */}
        <ThemedText type="default" style={styles.title} numberOfLines={2}>
          {conversation.title}
        </ThemedText>

        {/* Meta row */}
        <View style={styles.meta}>
          <ThemedText type="small" themeColor="textSecondary">
            {formatDate(conversation.createdAt)}
          </ThemedText>
          {speakerCount(conversation) && (
            <>
              <ThemedText type="small" themeColor="textSecondary">
                ·
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {speakerCount(conversation)}
              </ThemedText>
            </>
          )}
          <ThemedText type="small" themeColor="textSecondary">
            ·
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatDuration(conversation.duration)}
          </ThemedText>
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: Spacing.three,
  },
  pressed: {
    opacity: 0.75,
  },
  card: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Spacing.two,
  },
  title: {
    fontWeight: '600',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
});
