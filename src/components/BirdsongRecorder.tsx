import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, RotateCcw, Play, Pause, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BirdsongRecorderProps {
  onRecordingComplete: (blob: Blob, durationSeconds: number) => void;
  maxDuration?: number;
  minDuration?: number;
}

const BirdsongRecorder = ({
  onRecordingComplete,
  maxDuration = 30,
  minDuration = 10,
}: BirdsongRecorderProps) => {
  const [state, setState] = useState<"idle" | "recording" | "recorded" | "playing">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const timerRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [audioUrl]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        blobRef.current = blob;
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setState("recorded");
        stream.getTracks().forEach((t) => t.stop());
        audioContext.close();
      };

      mediaRecorder.start(250);
      setState("recording");
      setElapsed(0);
      setWaveformData([]);

      // Timer
      const startTime = Date.now();
      timerRef.current = window.setInterval(() => {
        const secs = (Date.now() - startTime) / 1000;
        setElapsed(secs);
        if (secs >= maxDuration) {
          mediaRecorder.stop();
          if (timerRef.current) clearInterval(timerRef.current);
          if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        }
      }, 100);

      // Waveform
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const drawWave = () => {
        analyser.getByteTimeDomainData(dataArray);
        const avg = dataArray.reduce((sum, v) => sum + Math.abs(v - 128), 0) / dataArray.length;
        setWaveformData((prev) => [...prev.slice(-120), avg / 128]);
        animFrameRef.current = requestAnimationFrame(drawWave);
      };
      drawWave();
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  }, [maxDuration]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  }, []);

  const reRecord = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setWaveformData([]);
    setElapsed(0);
    blobRef.current = null;
    setState("idle");
  }, [audioUrl]);

  const togglePlayback = useCallback(() => {
    if (!audioRef.current || !audioUrl) return;
    if (state === "playing") {
      audioRef.current.pause();
      setState("recorded");
    } else {
      audioRef.current.play();
      setState("playing");
    }
  }, [state, audioUrl]);

  const confirmRecording = useCallback(() => {
    if (blobRef.current && elapsed >= minDuration) {
      onRecordingComplete(blobRef.current, elapsed);
    }
  }, [elapsed, minDuration, onRecordingComplete]);

  const tooShort = elapsed < minDuration && state === "recorded";

  return (
    <div className="space-y-4">
      {/* Waveform visualizer */}
      <div className="h-20 bg-secondary/30 rounded-lg border border-border/50 overflow-hidden flex items-center justify-center px-2">
        {waveformData.length > 0 ? (
          <div className="flex items-center gap-[2px] h-full w-full">
            {waveformData.map((v, i) => (
              <motion.div
                key={i}
                className="flex-1 bg-primary/60 rounded-full min-w-[2px]"
                style={{ height: `${Math.max(4, v * 60)}px` }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.1 }}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground/50 font-serif text-sm italic">
            {state === "idle" ? "Ready to listen…" : "Waveform preview"}
          </p>
        )}
      </div>

      {/* Timer */}
      <div className="text-center">
        <span className="font-mono text-2xl text-primary tabular-nums">
          {Math.floor(elapsed)}s
        </span>
        <span className="text-muted-foreground text-sm ml-2">/ {maxDuration}s</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {state === "idle" && (
          <Button
            onClick={startRecording}
            size="lg"
            className="rounded-full w-16 h-16 p-0 bg-destructive/80 hover:bg-destructive border-2 border-destructive/30"
          >
            <Mic className="h-7 w-7 text-white" />
          </Button>
        )}

        {state === "recording" && (
          <Button
            onClick={stopRecording}
            size="lg"
            className="rounded-full w-16 h-16 p-0 bg-destructive hover:bg-destructive/90 animate-pulse border-2 border-destructive/50"
          >
            <Square className="h-6 w-6 text-white fill-white" />
          </Button>
        )}

        {(state === "recorded" || state === "playing") && (
          <>
            <Button variant="outline" size="sm" onClick={reRecord} className="gap-1.5 font-serif h-10 px-4">
              <RotateCcw className="h-4 w-4" /> Re-record
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full w-14 h-14 p-0"
              onClick={togglePlayback}
            >
              {state === "playing" ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-0.5" />
              )}
            </Button>
            <Button
              size="sm"
              onClick={confirmRecording}
              disabled={tooShort}
              className="gap-1.5 font-serif h-10 px-4"
            >
              {tooShort ? `Need ${minDuration}s+` : "Use Recording"}
            </Button>
          </>
        )}
      </div>

      {tooShort && (
        <p className="text-center text-xs text-muted-foreground font-serif">
          Recording must be at least {minDuration} seconds
        </p>
      )}

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setState("recorded")}
          className="hidden"
        />
      )}
    </div>
  );
};

export default BirdsongRecorder;
