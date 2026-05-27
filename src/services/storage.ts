import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Conversation } from '@/types/conversation';

const CONVERSATIONS_KEY = 'conversations';

export async function getConversations(): Promise<Conversation[]> {
  try {
    const raw = await AsyncStorage.getItem(CONVERSATIONS_KEY);
    return raw ? (JSON.parse(raw) as Conversation[]) : [];
  } catch {
    return [];
  }
}

export async function saveConversation(conversation: Conversation): Promise<void> {
  const all = await getConversations();
  const index = all.findIndex((c) => c.id === conversation.id);
  if (index >= 0) {
    all[index] = conversation;
  } else {
    // newest first
    all.unshift(conversation);
  }
  await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(all));
}

export async function deleteConversation(id: string): Promise<void> {
  const all = await getConversations();
  const filtered = all.filter((c) => c.id !== id);
  await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(filtered));
}

export async function getConversation(id: string): Promise<Conversation | undefined> {
  const all = await getConversations();
  return all.find((c) => c.id === id);
}
