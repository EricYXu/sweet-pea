import type { Utterance } from '@/types/conversation';

const API_KEY = process.env.EXPO_PUBLIC_ASSEMBLYAI_API_KEY ?? '';
const BASE_URL = 'https://api.assemblyai.com/v2';

// ─── Upload ──────────────────────────────────────────────────────────────────

/**
 * Uploads a local audio file to AssemblyAI and returns the hosted URL.
 * The file URI should be a `file://` path returned by expo-audio after recording.
 */
export async function uploadAudio(fileUri: string): Promise<string> {
  const response = await fetch(fileUri);
  const blob = await response.blob();

  const uploadResponse = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      authorization: API_KEY,
      'content-type': 'application/octet-stream',
    },
    body: blob,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Upload failed: ${uploadResponse.status} ${await uploadResponse.text()}`);
  }

  const { upload_url } = (await uploadResponse.json()) as { upload_url: string };
  return upload_url;
}

// ─── Transcription ────────────────────────────────────────────────────────────

interface TranscriptRequest {
  audio_url: string;
  speech_models: string[];
  speaker_labels: boolean;
  summarization: boolean;
  summary_model: string;
  summary_type: string;
}

interface AssemblyUtterance {
  speaker: string;
  text: string;
  start: number;
  end: number;
}

interface TranscriptResponse {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  utterances?: AssemblyUtterance[];
  summary?: string;
  error?: string;
}

/**
 * Submits an audio URL for transcription with speaker diarization and headline
 * summarization. Returns the transcript ID to poll.
 */
export async function submitTranscription(audioUrl: string): Promise<string> {
  const body: TranscriptRequest = {
    audio_url: audioUrl,
    speech_models: ['universal-2'],
    speaker_labels: true,
    summarization: true,
    summary_model: 'informative',
    summary_type: 'headline',
  };

  const response = await fetch(`${BASE_URL}/transcript`, {
    method: 'POST',
    headers: {
      authorization: API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Transcription submit failed: ${response.status} ${await response.text()}`);
  }

  const { id } = (await response.json()) as { id: string };
  return id;
}

/**
 * Polls the transcript endpoint until status is `completed` or `error`.
 * Waits `intervalMs` between polls (default 5 s).
 */
export async function pollTranscription(
  transcriptId: string,
  intervalMs = 5000
): Promise<{ utterances: Utterance[]; title: string }> {
  while (true) {
    const response = await fetch(`${BASE_URL}/transcript/${transcriptId}`, {
      headers: { authorization: API_KEY },
    });

    if (!response.ok) {
      throw new Error(`Poll failed: ${response.status}`);
    }

    const data = (await response.json()) as TranscriptResponse;

    if (data.status === 'error') {
      throw new Error(`AssemblyAI error: ${data.error ?? 'unknown'}`);
    }

    if (data.status === 'completed') {
      const utterances: Utterance[] = (data.utterances ?? []).map((u) => ({
        speaker: u.speaker,
        text: u.text,
        start: u.start,
        end: u.end,
      }));

      const title = data.summary?.trim() || 'Untitled Conversation';
      return { utterances, title };
    }

    // Still queued or processing — wait before next poll
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
