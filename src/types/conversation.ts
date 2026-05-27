export type ConversationStatus = 'recording' | 'processing' | 'complete' | 'error';

export interface Utterance {
  speaker: string; // 'A', 'B', 'C', etc.
  text: string;
  start: number; // milliseconds
  end: number; // milliseconds
}

export interface Conversation {
  id: string;
  title: string; // AI-generated headline summary
  createdAt: string; // ISO 8601 string
  duration: number; // seconds
  status: ConversationStatus;
  utterances: Utterance[];
  /** Local URI of the audio file (present until uploaded) */
  audioUri?: string;
  /** AssemblyAI transcript ID (set once upload + submission completes) */
  transcriptId?: string;
  /** Error message if status === 'error' */
  error?: string;
}
