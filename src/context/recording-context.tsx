import { requestRecordingPermissionsAsync, useAudioRecorder, RecordingPresets } from 'expo-audio';
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

import { pollTranscription, submitTranscription, uploadAudio } from '@/services/assemblyai';
import { saveConversation } from '@/services/storage';
import type { Conversation } from '@/types/conversation';

// ─── Types ────────────────────────────────────────────────────────────────────

type RecordingState = 'idle' | 'recording' | 'processing';

interface RecordingContextValue {
  recordingState: RecordingState;
  /** Seconds elapsed since recording started */
  elapsedSeconds: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  /** Called by the dashboard to refresh its list when a new conversation is saved */
  onConversationSaved?: (conversation: Conversation) => void;
  registerConversationListener: (fn: (c: Conversation) => void) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const RecordingContext = createContext<RecordingContextValue | null>(null);

export function useRecording() {
  const ctx = useContext(RecordingContext);
  if (!ctx) throw new Error('useRecording must be used inside <RecordingProvider>');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function RecordingProvider({ children }: { children: React.ReactNode }) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const listenerRef = useRef<((c: Conversation) => void) | null>(null);
  const startTimeRef = useRef<number>(0);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const startRecording = useCallback(async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Microphone permission denied');
      }

      await recorder.prepareToRecordAsync();
      recorder.record();

      startTimeRef.current = Date.now();
      setElapsedSeconds(0);
      setRecordingState('recording');

      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setRecordingState('idle');
    }
  }, [recorder]);

  const stopRecording = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

    try {
      await recorder.stop();
      const uri = recorder.uri;
      console.log('[recording] stopped, uri:', uri);

      if (!uri) throw new Error('No recording URI after stop');

      // Create a placeholder conversation immediately so the dashboard shows it
      const id = Date.now().toString();
      const placeholder: Conversation = {
        id,
        title: 'Processing…',
        createdAt: new Date().toISOString(),
        duration,
        status: 'processing',
        utterances: [],
        audioUri: uri,
      };

      setRecordingState('processing');
      await saveConversation(placeholder);
      listenerRef.current?.(placeholder);

      // Kick off transcription in the background
      processTranscription(uri, duration, placeholder);
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setRecordingState('idle');
    }
  }, [recorder]);

  async function processTranscription(
    uri: string,
    duration: number,
    placeholder: Conversation
  ) {
    try {
      const uploadUrl = await uploadAudio(uri);
      const transcriptId = await submitTranscription(uploadUrl);

      // Update placeholder with transcript ID
      await saveConversation({ ...placeholder, transcriptId });

      const { utterances, title } = await pollTranscription(transcriptId);

      const completed: Conversation = {
        ...placeholder,
        transcriptId,
        title,
        duration,
        status: 'complete',
        utterances,
      };

      await saveConversation(completed);
      listenerRef.current?.(completed);
    } catch (err) {
      console.error('[transcription] failed:', err);
      const failed: Conversation = {
        ...placeholder,
        status: 'error',
        title: 'Transcription failed',
        error: String(err),
      };
      await saveConversation(failed);
      listenerRef.current?.(failed);
    } finally {
      setRecordingState('idle');
      setElapsedSeconds(0);
    }
  }

  const registerConversationListener = useCallback((fn: (c: Conversation) => void) => {
    listenerRef.current = fn;
  }, []);

  return (
    <RecordingContext.Provider
      value={{
        recordingState,
        elapsedSeconds,
        startRecording,
        stopRecording,
        registerConversationListener,
      }}>
      {children}
    </RecordingContext.Provider>
  );
}
