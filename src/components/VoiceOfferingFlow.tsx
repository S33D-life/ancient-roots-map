import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Play, Pause, RotateCcw, Loader2, Sparkles,
  AlertTriangle, Square, Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

/* ---------- Types ---------- */

export interface VoiceOfferingData {
  audioUrl: string;
  duration: number;
  message: string;
}

interface VoiceOfferingFlowProps {
  treeId: string;
  meetingExpired?: boolean;
  onComplete: (data: VoiceOfferingData) => void;
  onCancel: () => void;
}

type FlowStep = "idle" | "recording" | "review" | "uploading";

/* ---------- Waveform Canvas ---------- */

const WaveformVisualizer = ({
  analyser,
  isActive,
}: {
  analyser: AnalyserNode | null;
  isActive: boolean;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!analyser || !isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Soft glow gradient line
      const gradient = ctx.createLinearGradient(0, 0, w, 0);
      gradient.addColorStop(0, "hsla(42, 95%, 55%, 0.1)");
      gradient.addColorStop(0.3, "hsla(42, 95%, 55%, 0.6)");
      gradient.addColorStop(0.5, "hsla(45, 100%, 70%, 0.8)");
      gradient.addColorStop(0.7, "hsla(42, 95%, 55%, 0.6)");
      gradient.addColorStop(1, "hsla(42, 95%, 55%, 0.1)");

      ctx.lineWidth = 2;
      ctx.strokeStyle = gradient;
      ctx.beginPath();

      const sliceWidth = w / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * h) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(w, h / 2);
      ctx.stroke();
    };

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [analyser, isActive]);

  // Static waveform for review (decorative)
  if (!isActive) {
    return (
      <div className="h-16 flex items-center justify-center gap-[2px] px-4">
        {Array.from({ length: 40 }).map((_, i) => {
          const h = 8 + Math.sin(i * 0.4) * 16 + Math.random() * 12;
          return (
            <div
              key={i}
              className="w-1 rounded-full bg-primary/30"
              style={{ height: `${h}px` }}
            />
          );
        })}
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={64}
      className="w-full h-16"
    />
  );
};

/* ---------- Timer Display ---------- */

const TimerDisplay = ({ seconds }: { seconds: number }) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return (
    <span className="font-mono text-2xl tabular-nums text-foreground/90 tracking-wider">
      {m}:{s.toString().padStart(2, "0")}
    </span>
  );
};

/* ---------- Main Component ---------- */

const MAX_DURATION = 300; // 5 minutes

const VoiceOfferingFlow = ({ treeId, meetingExpired, onComplete, onCancel }: VoiceOfferingFlowProps) => {
  const [step, setStep] = useState<FlowStep>("idle");
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [playing, setPlaying] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
  };

  const startRecording = async () => {
    setError(null);
    setPermissionDenied(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      // Set up analyser for waveform
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stopStream();
        setStep("review");
      };

      recorder.start(250); // collect in 250ms chunks
      setStep("recording");
      setDuration(0);

      // Timer
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev + 1 >= MAX_DURATION) {
            stopRecording();
            return MAX_DURATION;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setPermissionDenied(true);
      } else {
        setError(err.message || "Could not access microphone");
      }
    }
  };

  const stopRecording = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const reRecord = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setPlaying(false);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setStep("idle");
  };

  const togglePlayback = () => {
    if (!audioUrl) return;
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
    } else {
      const audio = new Audio(audioUrl);
      audio.onended = () => setPlaying(false);
      audio.play();
      audioRef.current = audio;
      setPlaying(true);
    }
  };

  const handleSubmit = async () => {
    if (!audioBlob) return;
    if (meetingExpired) {
      setError("Your offering window has closed. Meet this Ancient Friend again to leave a voice offering.");
      return;
    }

    setStep("uploading");
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in to leave a voice offering");

      // Upload to offerings bucket
      const fileName = `${user.id}/${treeId}/${Date.now()}-voice.webm`;
      const { error: uploadErr } = await supabase.storage
        .from("offerings")
        .upload(fileName, audioBlob, {
          cacheControl: "3600",
          contentType: audioBlob.type,
          upsert: false,
        });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("offerings").getPublicUrl(fileName);

      setUploadProgress(100);
      onComplete({
        audioUrl: urlData.publicUrl,
        duration,
        message: message.trim(),
      });
    } catch (err: any) {
      setError(err.message || "Upload failed");
      setStep("review"); // allow retry
    }
  };

  return (
    <div className="space-y-5">
      <AnimatePresence mode="wait">
        {/* ===== IDLE ===== */}
        {step === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-5 py-4"
          >
            {permissionDenied ? (
              <div className="space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                  <MicOff className="h-6 w-6 text-destructive/70" />
                </div>
                <div>
                  <p className="text-sm font-serif text-foreground/80">Microphone access needed</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-1 max-w-xs mx-auto">
                    Please allow microphone access in your browser settings, then try again.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setPermissionDenied(false); startRecording(); }}
                  className="font-serif text-xs tracking-wider"
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Mic className="h-6 w-6 text-primary/60" />
                </div>
                <div>
                  <p className="text-sm font-serif text-foreground/80">Speak your offering</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-1">
                    Record a voice offering for this Ancient Friend (up to 5 minutes)
                  </p>
                </div>

                {/* Record button */}
                <motion.button
                  type="button"
                  onClick={startRecording}
                  className="w-20 h-20 mx-auto rounded-full bg-destructive/80 hover:bg-destructive flex items-center justify-center shadow-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Start recording"
                >
                  <Mic className="h-8 w-8 text-destructive-foreground" />
                </motion.button>
                <p className="text-[10px] text-muted-foreground/40 font-serif">Tap to begin</p>
              </>
            )}

            {error && (
              <p className="text-xs text-destructive/80 font-serif">{error}</p>
            )}
          </motion.div>
        )}

        {/* ===== RECORDING ===== */}
        {step === "recording" && (
          <motion.div
            key="recording"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-5 py-4"
          >
            {/* Pulsing indicator */}
            <div className="flex items-center justify-center gap-2">
              <motion.div
                className="w-3 h-3 rounded-full bg-destructive"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <p className="text-xs font-serif tracking-widest uppercase text-destructive/80">Recording</p>
            </div>

            {/* Timer */}
            <TimerDisplay seconds={duration} />

            {/* Waveform */}
            <div className="rounded-xl border border-border/30 bg-secondary/20 p-3 overflow-hidden">
              <WaveformVisualizer analyser={analyserRef.current} isActive={true} />
            </div>

            {/* Stop button */}
            <motion.button
              type="button"
              onClick={stopRecording}
              className="w-20 h-20 mx-auto rounded-full bg-destructive/80 hover:bg-destructive flex items-center justify-center shadow-lg transition-colors"
              whileTap={{ scale: 0.9 }}
              aria-label="Stop recording"
            >
              <Square className="h-7 w-7 text-destructive-foreground fill-destructive-foreground" />
            </motion.button>
            <p className="text-[10px] text-muted-foreground/40 font-serif">Tap to stop</p>
          </motion.div>
        )}

        {/* ===== REVIEW ===== */}
        {step === "review" && (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            {/* Playback card */}
            <div className="rounded-xl border border-primary/30 overflow-hidden">
              <div
                className="h-0.5"
                style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), hsl(var(--accent) / 0.3), transparent)" }}
              />
              <div className="p-4 bg-primary/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-primary/60" />
                    <p className="text-sm font-serif text-foreground/80">Voice Offering</p>
                  </div>
                  <TimerDisplay seconds={duration} />
                </div>

                {/* Static waveform */}
                <div className="rounded-lg bg-secondary/30 overflow-hidden">
                  <WaveformVisualizer analyser={null} isActive={false} />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={reRecord}
                    className="font-serif text-xs tracking-wider gap-1.5"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Re-record
                  </Button>
                  <Button
                    type="button"
                    variant={playing ? "secondary" : "default"}
                    size="sm"
                    onClick={togglePlayback}
                    className="font-serif text-xs tracking-wider gap-1.5 min-w-[100px]"
                  >
                    {playing ? (
                      <><Pause className="h-3 w-3" /> Pause</>
                    ) : (
                      <><Play className="h-3 w-3" /> Play</>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <label className="font-serif text-[10px] tracking-widest uppercase text-muted-foreground/60">
                What inspired this offering?
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
                placeholder="Share what moved you to speak..."
                rows={3}
                className="font-serif text-sm leading-relaxed bg-secondary/10 border-border/30 resize-none"
              />
              <p className="text-[10px] text-right text-muted-foreground/30">{message.length} / 2000</p>
            </div>

            {/* Meeting expired warning */}
            {meetingExpired && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="h-4 w-4 text-destructive/70 shrink-0 mt-0.5" />
                <p className="text-xs text-destructive/80 font-serif">
                  Your offering window has closed. Meet this Ancient Friend again to submit.
                </p>
              </div>
            )}

            {error && (
              <p className="text-xs text-destructive/80 font-serif">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="font-serif text-xs tracking-wider"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!audioBlob || meetingExpired}
                onClick={handleSubmit}
                className="flex-1 font-serif text-xs tracking-wider gap-1.5"
              >
                <Sparkles className="h-3 w-3" />
                Seal this Voice Offering
              </Button>
            </div>
          </motion.div>
        )}

        {/* ===== UPLOADING ===== */}
        {step === "uploading" && (
          <motion.div
            key="uploading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12 space-y-4"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm font-serif text-foreground/70">Sealing your voice offering...</p>
            <div className="w-48 mx-auto h-1 rounded-full bg-secondary/40 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary/60"
                initial={{ width: "0%" }}
                animate={{ width: "90%" }}
                transition={{ duration: 3, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceOfferingFlow;
