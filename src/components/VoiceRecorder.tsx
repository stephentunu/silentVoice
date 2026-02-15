import { useState, useRef, useCallback } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type SubmissionType = Database['public']['Enums']['submission_type'];

interface VoiceRecorderProps {
  meetingId: string;
  sessionToken: string;
  selectedType: Database['public']['Enums']['submission_type'];
  disabled?: boolean;
  onRecorded: () => void;
}

export function VoiceRecorder({ meetingId, sessionToken, selectedType, disabled, onRecorded }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const distortAudio = useCallback(async (blob: Blob): Promise<Blob> => {
    const arrayBuffer = await blob.arrayBuffer();
    const audioCtx = new OfflineAudioContext(1, 1, 44100);

    // Decode the recorded audio
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    // Create an offline context with the distorted length (pitch shift changes duration)
    const pitchShift = 0.65; // Lower pitch for anonymity
    const newLength = Math.ceil(audioBuffer.length / pitchShift);
    const offlineCtx = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      newLength,
      audioBuffer.sampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = pitchShift;

    // Add a subtle wobble effect
    const oscillator = offlineCtx.createOscillator();
    oscillator.frequency.value = 3;
    const gainNode = offlineCtx.createGain();
    gainNode.gain.value = 15;
    oscillator.connect(gainNode);
    gainNode.connect(source.playbackRate);
    oscillator.start();

    source.connect(offlineCtx.destination);
    source.start();

    const renderedBuffer = await offlineCtx.startRendering();

    // Encode to WAV
    return audioBufferToWav(renderedBuffer);
  }, []);

  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const dataLength = buffer.length * blockAlign;
    const headerLength = 44;
    const totalLength = headerLength + dataLength;

    const arrayBuffer = new ArrayBuffer(totalLength);
    const view = new DataView(arrayBuffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, totalLength - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const distortedBlob = await distortAudio(blob);

          // Upload to storage
          const fileName = `${meetingId}/${crypto.randomUUID()}.wav`;
          const { error: uploadError } = await supabase.storage
            .from('voice-recordings')
            .upload(fileName, distortedBlob);

          if (uploadError) {
            toast.error('Failed to upload voice recording');
            return;
          }

          const { data: urlData } = supabase.storage
            .from('voice-recordings')
            .getPublicUrl(fileName);

          // Create submission with audio
          const { error } = await supabase.from('submissions').insert([{
            meeting_id: meetingId,
            content: '🎤 Voice message',
            type: selectedType,
            session_token: sessionToken,
            audio_url: urlData.publicUrl,
          }]);

          if (error) {
            toast.error('Failed to submit voice message');
          } else {
            toast.success('Voice message sent!');
            onRecorded();
          }
        } catch (err) {
          console.error('Audio processing error:', err);
          toast.error('Failed to process audio');
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    setIsRecording(false);
  };

  return (
    <Button
      variant={isRecording ? 'destructive' : 'outline'}
      size="icon"
      className="h-auto aspect-square shrink-0"
      onClick={isRecording ? stopRecording : startRecording}
      disabled={disabled || isProcessing}
      title={isRecording ? 'Stop recording' : 'Record voice (distorted for anonymity)'}
    >
      {isProcessing ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : isRecording ? (
        <Square className="h-5 w-5" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </Button>
  );
}
