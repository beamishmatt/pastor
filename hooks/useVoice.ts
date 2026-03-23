import { useState, useRef, useCallback } from 'react';
import { AudioModule, AudioRecorder, RecordingPresets } from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../lib/supabase';

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

interface UseVoiceReturn {
  voiceState: VoiceState;
  transcript: string | null;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  cancelVoice: () => void;
}

export function useVoice(
  onTranscript: (text: string) => void
): UseVoiceReturn {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState<string | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);

  const startListening = useCallback(async () => {
    try {
      await AudioModule.requestRecordingPermissionsAsync();
      await AudioModule.setAudioModeAsync({
        playsInSilentMode: true,
      });

      const recorder = new AudioRecorder(RecordingPresets.HIGH_QUALITY);
      await recorder.prepareToRecordAsync();
      recorder.record();
      recorderRef.current = recorder;
      setVoiceState('listening');
    } catch (e) {
      console.error('startListening error:', e);
    }
  }, []);

  const stopListening = useCallback(async () => {
    if (!recorderRef.current) return;

    setVoiceState('processing');

    try {
      await recorderRef.current.stop();
      const uri = recorderRef.current.uri;
      recorderRef.current = null;

      if (!uri) throw new Error('No recording URI');

      // Read the audio file
      const audioBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Send to Supabase Edge Function for Whisper STT
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/voice-stt`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ audio: audioBase64, mimeType: 'audio/m4a' }),
        }
      );

      const { transcript: text } = await response.json();
      setTranscript(text);
      onTranscript(text);
    } catch (e) {
      console.error('stopListening error:', e);
      setVoiceState('idle');
    }
  }, [onTranscript]);

  const cancelVoice = useCallback(async () => {
    if (recorderRef.current) {
      await recorderRef.current.stop();
      recorderRef.current = null;
    }
    setVoiceState('idle');
    setTranscript(null);
  }, []);

  return { voiceState, transcript, startListening, stopListening, cancelVoice };
}
