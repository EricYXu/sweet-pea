# Claude Notes — sweet-pea

---

## What this app does

Records ambient conversations throughout the day. Tap the mic button to start a session, tap again to stop. The audio is uploaded to AssemblyAI, which transcribes it, labels each speaker, and generates a one-line summary. The result appears as a card on the dashboard.

---

## Files added

### Logic
- **`src/types/conversation.ts`** — TypeScript types for `Conversation` and `Utterance`
- **`src/services/assemblyai.ts`** — Uploads audio to AssemblyAI, submits transcription job (with speaker labels + headline summary), polls until complete
- **`src/services/storage.ts`** — Reads and writes conversations to device storage (AsyncStorage)
- **`src/context/recording-context.tsx`** — Global recording state shared across the app. Manages the mic, the timer, and the transcription pipeline

### UI
- **`src/components/record-fab.tsx`** — The floating mic button. Blue at rest → red + pulsing while recording → grey while processing
- **`src/components/conversation-card.tsx`** — A single card on the dashboard showing the title, date, speaker count, and duration

### Screens
- **`src/app/index.tsx`** — Dashboard: scrollable list of conversation cards
- **`src/app/conversation/[id].tsx`** — Transcript view: play-format dialogue with color-coded speakers and timestamps

### Config
- **`.env`** — Holds the AssemblyAI API key (never committed to git)
- **`.env.example`** — Documents that `EXPO_PUBLIC_ASSEMBLYAI_API_KEY` is required

### Files modified
- **`src/app/_layout.tsx`** — Added `RecordingProvider` and `RecordFab` overlay
- **`src/components/app-tabs.tsx`** — Stripped back to a single Home tab (removed Explore)

---

## Key decisions

**AssemblyAI over OpenAI Whisper** — AssemblyAI does speaker diarization and summarization in one API call, which is exactly what's needed for the transcript view and card titles.

**Floating FAB over custom tab bar** — expo-router v56 no longer has `@react-navigation/bottom-tabs` as a dependency, so the standard approach of passing a `tabBar` prop breaks with a missing module error. Instead, `NativeTabs` handles navigation and `RecordFab` sits on top of it as an absolutely-positioned overlay.

**Listener pattern for dashboard updates** — The dashboard registers a callback via `registerConversationListener()`. When transcription finishes (which happens in the background), the context calls that callback to update the card — no polling or re-fetch needed.

---

## Gotchas

- **`expo-audio` v56 has no `Audio` namespace.** Permissions are a named export: `import { requestRecordingPermissionsAsync } from 'expo-audio'` — not `Audio.requestRecordingPermissionsAsync()`.
- **Typed routes require the object form.** With `typedRoutes: true` in `app.json`, use `router.push({ pathname: '/conversation/[id]', params: { id } })` — not `router.push('/conversation/123')`.
- **`.expo/types/router.d.ts` is auto-generated.** It updates when the dev server starts. If you add a new screen and see type errors, either start the dev server or manually add the route to that file.
- **AssemblyAI requires `speech_models`.** The `/v2/transcript` endpoint requires `speech_models: ["universal-2"]` (or `"universal-3-pro"`). Omitting it returns a 400 error.

---

## Limitations to address later

- **Long recordings** — At 128kbps, a 6-hour session is ~350MB. AssemblyAI's limit is 500MB, so headroom is tight. Chunking (record in segments, transcribe in parallel) would fix this.
- **Background recording** — The app stops recording if sent to the background. `enableBackgroundRecording` in `app.json` is `false`. Enabling it requires an iOS background audio entitlement.
- **Filtering** — No silence detection or relevance filtering yet. All audio is sent to AssemblyAI.
- **Delete UI** — `deleteConversation()` in `storage.ts` is implemented but not wired up anywhere.
