/**
 * Lightweight sensor capture utilities for Tree Health Snapshots.
 * Uses standard Web APIs — all captures are optional and non-blocking.
 */

import type { CanopyLightReading, AmbientSoundReading } from "./env-snapshot-types";

// ─── Canopy Light ───────────────────────────────────────────────

/**
 * Attempt to read ambient light level.
 * Tries AmbientLightSensor API first, falls back to camera-based estimate.
 */
export async function captureCanopyLight(): Promise<CanopyLightReading | null> {
  // Try AmbientLightSensor (Chrome Android)
  if ("AmbientLightSensor" in window) {
    try {
      const reading = await readAmbientLightSensor();
      if (reading) return reading;
    } catch {
      // Fall through to camera
    }
  }

  // Camera fallback — capture a frame and estimate brightness
  try {
    return await estimateLightFromCamera();
  } catch {
    return null;
  }
}

function readAmbientLightSensor(): Promise<CanopyLightReading | null> {
  return new Promise((resolve) => {
    try {
      // @ts-ignore - AmbientLightSensor is not in all TS defs
      const sensor = new AmbientLightSensor();
      const timeout = setTimeout(() => {
        sensor.stop();
        resolve(null);
      }, 3000);

      sensor.addEventListener("reading", () => {
        clearTimeout(timeout);
        const lux = sensor.illuminance ?? 0;
        sensor.stop();
        resolve({
          lux: Math.round(lux),
          canopyCoveragePct: luxToCanopyCoverage(lux),
          source: "sensor",
          capturedAt: new Date().toISOString(),
        });
      });

      sensor.addEventListener("error", () => {
        clearTimeout(timeout);
        resolve(null);
      });

      sensor.start();
    } catch {
      resolve(null);
    }
  });
}

async function estimateLightFromCamera(): Promise<CanopyLightReading | null> {
  let stream: MediaStream | null = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment", width: 64, height: 64 },
    });

    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    await video.play();

    // Wait a moment for auto-exposure to settle
    await new Promise((r) => setTimeout(r, 500));

    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0, 64, 64);

    const imageData = ctx.getImageData(0, 0, 64, 64);
    const pixels = imageData.data;
    let totalBrightness = 0;
    const pixelCount = pixels.length / 4;

    for (let i = 0; i < pixels.length; i += 4) {
      // Perceived brightness (ITU-R BT.601)
      totalBrightness += 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    }

    const avgBrightness = totalBrightness / pixelCount; // 0-255
    // Map brightness to rough lux estimate (very approximate)
    const estimatedLux = Math.round((avgBrightness / 255) * 80000);

    return {
      lux: estimatedLux,
      canopyCoveragePct: luxToCanopyCoverage(estimatedLux),
      source: "camera_estimate",
      capturedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  } finally {
    stream?.getTracks().forEach((t) => t.stop());
  }
}

/** Map lux to rough canopy coverage percentage */
function luxToCanopyCoverage(lux: number): number {
  // Full sun ~100k lux, dense canopy ~500-2000 lux
  if (lux >= 80000) return 5;
  if (lux >= 40000) return 25;
  if (lux >= 10000) return 50;
  if (lux >= 2000) return 75;
  if (lux >= 500) return 90;
  return 95;
}

// ─── Ambient Sound ──────────────────────────────────────────────

/**
 * Record ambient sound for a short duration and extract simple metadata.
 * Does NOT store raw audio — only acoustic metrics.
 */
export async function captureAmbientSound(
  durationMs: number = 5000
): Promise<AmbientSoundReading | null> {
  let stream: MediaStream | null = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let maxDb = -Infinity;
    let totalDb = 0;
    let samples = 0;
    let lowEnergy = 0;
    let midEnergy = 0;
    let highEnergy = 0;
    // Birdsong typically 1-8kHz
    let birdsongEnergy = 0;
    let totalEnergy = 0;

    const sampleRate = audioCtx.sampleRate;
    const binHz = sampleRate / analyser.fftSize;

    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);

        // RMS amplitude → dB
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i] * dataArray[i];
          const freq = i * binHz;
          if (freq < 500) lowEnergy += dataArray[i];
          else if (freq < 4000) midEnergy += dataArray[i];
          else highEnergy += dataArray[i];

          if (freq >= 1000 && freq <= 8000) birdsongEnergy += dataArray[i];
          totalEnergy += dataArray[i];
        }
        const rms = Math.sqrt(sum / bufferLength);
        const db = 20 * Math.log10(Math.max(rms, 1) / 255);
        totalDb += db;
        if (db > maxDb) maxDb = db;
        samples++;
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        resolve();
      }, durationMs);
    });

    await audioCtx.close();

    const avgDb = samples > 0 ? totalDb / samples : -60;
    const dominantBand: "low" | "mid" | "high" =
      lowEnergy >= midEnergy && lowEnergy >= highEnergy
        ? "low"
        : midEnergy >= highEnergy
          ? "mid"
          : "high";

    const birdsongRatio = totalEnergy > 0 ? birdsongEnergy / totalEnergy : 0;

    return {
      durationSec: Math.round(durationMs / 1000),
      avgDbLevel: Math.round(avgDb),
      peakDbLevel: Math.round(maxDb),
      dominantBand,
      birdsongDetected: birdsongRatio > 0.3,
      naturalSoundsPresent: dominantBand === "mid" || dominantBand === "high",
      capturedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  } finally {
    stream?.getTracks().forEach((t) => t.stop());
  }
}

// ─── Dual GPS ───────────────────────────────────────────────────

import type { DualGPSReading } from "./env-snapshot-types";

export function computeDualGPS(
  lat1: number, lng1: number, acc1: number,
  lat2: number, lng2: number, acc2: number
): DualGPSReading {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const separation = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const combinedAcc = (acc1 + acc2) / 2;

  let confidence: "high" | "medium" | "low" = "low";
  if (combinedAcc <= 10 && separation <= 30) confidence = "high";
  else if (combinedAcc <= 25 && separation <= 50) confidence = "medium";

  return {
    avgLat: (lat1 + lat2) / 2,
    avgLng: (lng1 + lng2) / 2,
    deviceSeparationM: Math.round(separation),
    combinedAccuracyM: Math.round(combinedAcc),
    confidence,
  };
}
