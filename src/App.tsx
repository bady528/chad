import { useState, useEffect, useRef } from "react";
import { AudioSegment, TtsSettings } from "./types";
import { VoiceSettings } from "./components/VoiceSettings";
import { TextSegmenter } from "./components/TextSegmenter";
import { AudioPlayer } from "./components/AudioPlayer";
import { base64ToInt16Array, concatenateInt16Arrays, encodeWAV, downloadBlob } from "./utils/audio";
import { 
  Sparkles, 
  Volume2, 
  HelpCircle, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  Github,
  Moon,
  Info
} from "lucide-react";

// Robust paragraph-and-sentence-aware text segmenter
function splitTextIntoSegments(text: string, mode: "auto" | "2-parts" | "4-parts" | "none"): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  if (mode === "none") {
    return [trimmed];
  }

  if (mode === "2-parts" || mode === "4-parts") {
    const numParts = mode === "2-parts" ? 2 : 4;
    const words = trimmed.split(/\s+/);
    if (words.length <= numParts) {
      return words.filter(Boolean);
    }
    
    const wordsPerPart = Math.ceil(words.length / numParts);
    const segments: string[] = [];
    for (let i = 0; i < numParts; i++) {
      const start = i * wordsPerPart;
      const end = Math.min(start + wordsPerPart, words.length);
      const segmentText = words.slice(start, end).join(" ");
      if (segmentText) {
        segments.push(segmentText);
      }
    }
    return segments;
  }

  // "auto" mode: Split by paragraphs, then sentence-aware, target 800-1000 characters
  const maxChunkSize = 1000;
  const paragraphs = trimmed.split(/\n+/);
  const segments: string[] = [];
  let currentSegment = "";

  for (const para of paragraphs) {
    if (!para.trim()) continue;
    
    if ((currentSegment + "\n" + para).length <= maxChunkSize) {
      currentSegment = currentSegment ? currentSegment + "\n" + para : para;
    } else {
      if (currentSegment) {
        segments.push(currentSegment);
        currentSegment = "";
      }
      
      if (para.length > maxChunkSize) {
        // Regex to split by sentence punctuation while preserving them
        const sentences = para.match(/[^.!?]+[.!?]+(\s|$)/g) || [para];
        for (const sentence of sentences) {
          const s = sentence.trim();
          if (!s) continue;
          
          if ((currentSegment + " " + s).length <= maxChunkSize) {
            currentSegment = currentSegment ? currentSegment + " " + s : s;
          } else {
            if (currentSegment) {
              segments.push(currentSegment);
            }
            currentSegment = s;
          }
        }
      } else {
        currentSegment = para;
      }
    }
  }
  
  if (currentSegment) {
    segments.push(currentSegment);
  }
  
  return segments;
}

export default function App() {
  // Main Text State
  const [text, setText] = useState<string>("");
  
  // Settings State (optimized for crisp Tagalog)
  const [settings, setSettings] = useState<TtsSettings>({
    voiceName: "Kore",
    speed: "normal",
    customInstruction: "Read in a natural, neutral, standard Filipino/Tagalog accent with correct pronunciation and a friendly, engaging tone.",
    segmentMode: "auto",
  });

  // Segments and Synchronization State
  const [segments, setSegments] = useState<AudioSegment[]>([]);
  const [isAutoSync, setIsAutoSync] = useState<boolean>(true);

  // Unified Merged Output State
  const [combinedBlob, setCombinedBlob] = useState<Blob | null>(null);
  const [combinedUrl, setCombinedUrl] = useState<string | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Tracking state for individual segments playing
  const [playingSegmentId, setPlayingSegmentId] = useState<string | null>(null);
  const segmentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Synchronize main text changes with segmented cards list (with smart caching)
  useEffect(() => {
    if (!isAutoSync) return;

    const splitTexts = splitTextIntoSegments(text, settings.segmentMode);
    
    // Compare new text chunks with existing ones to preserve pre-compiled audio data
    const newSegments = splitTexts.map((txt, idx) => {
      // 1. Try to find if we already had this exact text block in our segments list
      const existing = segments.find((s) => s.text === txt);
      if (existing) {
        return {
          ...existing,
          index: idx, // Preserve compiled PCM, just update the sequence index
        };
      }

      // 2. Otherwise, check if the one exactly at this index matched
      const atIdx = segments[idx];
      if (atIdx && atIdx.text === txt) {
        return atIdx;
      }

      // 3. If it's a new or modified chunk, create a fresh idle block
      return {
        id: `segment-${idx}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        text: txt,
        index: idx,
        status: "idle" as const,
        pcmData: null,
        audioUrl: null,
      };
    });

    setSegments(newSegments);
    
    // Invalidate combined audio because text segments changed
    setCombinedBlob(null);
    if (combinedUrl) {
      URL.revokeObjectURL(combinedUrl);
      setCombinedUrl(null);
    }
  }, [text, settings.segmentMode, isAutoSync]);

  // Cleanup blob URLs on unmount to avoid browser memory leaks
  useEffect(() => {
    return () => {
      if (combinedUrl) URL.revokeObjectURL(combinedUrl);
      segments.forEach((s) => {
        if (s.audioUrl) URL.revokeObjectURL(s.audioUrl);
      });
      if (segmentAudioRef.current) {
        segmentAudioRef.current.pause();
      }
    };
  }, []);

  // Update text from main panel
  const handleTextChange = (newText: string) => {
    setText(newText);
    setGlobalError(null);
  };

  // Update settings and clear global errors
  const handleSettingsChange = (newSettings: TtsSettings) => {
    setSettings(newSettings);
    setGlobalError(null);
  };

  // Toggle AutoSync lock
  const handleToggleAutoSync = (sync: boolean) => {
    setIsAutoSync(sync);
    if (sync) {
      // Re-trigger sync immediately
      const splitTexts = splitTextIntoSegments(text, settings.segmentMode);
      const resynced = splitTexts.map((txt, idx) => ({
        id: `segment-${idx}-${Date.now()}`,
        text: txt,
        index: idx,
        status: "idle" as const,
        pcmData: null,
        audioUrl: null,
      }));
      setSegments(resynced);
      setCombinedBlob(null);
      if (combinedUrl) {
        URL.revokeObjectURL(combinedUrl);
        setCombinedUrl(null);
      }
    }
  };

  // Modify individual segment text block directly
  const handleSegmentChange = (idx: number, newText: string) => {
    const updated = [...segments];
    if (updated[idx]) {
      updated[idx] = {
        ...updated[idx],
        text: newText,
        status: "idle",
        pcmData: null,
        audioUrl: null,
      };
      setSegments(updated);
      
      // Invalidate merged combined audio
      setCombinedBlob(null);
      if (combinedUrl) {
        URL.revokeObjectURL(combinedUrl);
        setCombinedUrl(null);
      }
    }
  };

  // core function to generate audio for an individual segment index
  const executeGenerateSegment = async (idx: number, currentSegments: AudioSegment[]): Promise<AudioSegment> => {
    const seg = currentSegments[idx];
    if (!seg) throw new Error("Segment block index out of bounds");

    // Skip call if segment is empty
    if (!seg.text.trim()) {
      return {
        ...seg,
        status: "success",
        pcmData: new Int16Array(0),
        audioUrl: null,
        errorMessage: undefined,
      };
    }

    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: seg.text,
        voiceName: settings.voiceName,
        speed: settings.speed,
        customInstruction: settings.customInstruction,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server returned error status ${response.status}`);
    }

    const data = await response.json();
    const pcm = base64ToInt16Array(data.audio);
    const wavBlob = encodeWAV(pcm, data.sampleRate || 24000);
    const audioUrl = URL.createObjectURL(wavBlob);

    return {
      ...seg,
      status: "success",
      pcmData: pcm,
      audioUrl,
      errorMessage: undefined,
    };
  };

  // Trigger individual segment audio synthesis
  const handleGenerateSegment = async (idx: number) => {
    setGlobalError(null);
    const updated = [...segments];
    const target = updated[idx];
    if (!target) return;

    // Set to loading
    updated[idx] = { ...target, status: "loading", errorMessage: undefined };
    setSegments(updated);

    try {
      const completed = await executeGenerateSegment(idx, updated);
      const finalSegments = [...segments];
      finalSegments[idx] = completed;
      setSegments(finalSegments);
    } catch (err: any) {
      const finalSegments = [...segments];
      finalSegments[idx] = {
        ...target,
        status: "error",
        pcmData: null,
        audioUrl: null,
        errorMessage: err.message || "Failed to generate voice for this segment.",
      };
      setSegments(finalSegments);
      setGlobalError(`Error generating Part ${idx + 1}: ${err.message}`);
    }
  };

  // Play an individual segment
  const handlePlaySegment = (segment: AudioSegment) => {
    if (!segment.audioUrl) return;

    if (playingSegmentId === segment.id && segmentAudioRef.current) {
      if (!segmentAudioRef.current.paused) {
        segmentAudioRef.current.pause();
        setPlayingSegmentId(null);
        return;
      }
    }

    if (segmentAudioRef.current) {
      segmentAudioRef.current.pause();
    }

    const audio = new Audio(segment.audioUrl);
    segmentAudioRef.current = audio;
    setPlayingSegmentId(segment.id);
    
    audio.play().catch(console.error);
    audio.onended = () => {
      setPlayingSegmentId(null);
    };
  };

  // Download individual segment as WAV
  const handleDownloadSegment = (segment: AudioSegment) => {
    if (!segment.audioUrl) return;
    
    // To download an already prepared audio, we can fetch its blob URL
    fetch(segment.audioUrl)
      .then((res) => res.blob())
      .then((blob) => {
        downloadBlob(blob, `Tagalog-TTS-Part-${segment.index + 1}.wav`);
      })
      .catch(console.error);
  };

  // Sequential continuous generation for ALL pending segments and automated merge
  const handleGenerateAll = async () => {
    if (segments.length === 0) return;
    setGlobalError(null);
    setIsGeneratingAll(true);

    // Initialize temporary segment array copy
    let activeSegments = [...segments];

    try {
      // Loop through all segments and generate pending ones sequentially or in batches
      for (let i = 0; i < activeSegments.length; i++) {
        const seg = activeSegments[i];
        if (seg.status === "success" && seg.pcmData) {
          continue; // Already prepared, skip to next
        }

        // Set to loading state in the active list
        activeSegments[i] = { ...seg, status: "loading", errorMessage: undefined };
        setSegments([...activeSegments]);

        try {
          const completedSeg = await executeGenerateSegment(i, activeSegments);
          activeSegments[i] = completedSeg;
          setSegments([...activeSegments]);
        } catch (err: any) {
          activeSegments[i] = {
            ...seg,
            status: "error",
            pcmData: null,
            audioUrl: null,
            errorMessage: err.message || "Failed to generate.",
          };
          setSegments([...activeSegments]);
          throw new Error(`Failed during synthesis of Part ${i + 1}: ${err.message}`);
        }
      }

      // Check that ALL segments successfully have PCM data
      const allSuccess = activeSegments.every((s) => s.status === "success" && s.pcmData);
      if (!allSuccess) {
        throw new Error("One or more text segments failed to compile successfully.");
      }

      // Concatenate the PCM streams of all parts
      const pcmArrays = activeSegments.map((s) => s.pcmData!);
      const combinedPcm = concatenateInt16Arrays(pcmArrays);

      // Encode merged PCM into unified WAV Blob
      const mergedWavBlob = encodeWAV(combinedPcm, 24000);
      const mergedUrl = URL.createObjectURL(mergedWavBlob);

      setCombinedBlob(mergedWavBlob);
      setCombinedUrl(mergedUrl);
    } catch (err: any) {
      console.error("Continuous generation failed:", err);
      setGlobalError(err.message || "An error occurred during continuous speech generation.");
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const readySegmentsCount = segments.filter((s) => s.status === "success").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-300 pb-16">
      
      {/* Decorative background aura */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-500/10 to-transparent blur-3xl rounded-full pointer-events-none" />

      {/* Main Container Wrapper */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8 relative z-10">
        
        {/* Header Branding */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Volume2 className="w-5 h-5 animate-pulse" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Tagalog Text to Voice <span className="text-emerald-400">Converter</span>
              </h1>
            </div>
            <p className="text-sm text-slate-400 max-w-2xl leading-normal">
              Generate crisp, natural, and accurate Tagalog voiceovers. Paste extremely long text—our system automatically segments, compiles, and merges everything into a 1-click download.
            </p>
          </div>

          {/* Badges bar */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-full font-medium">
              ⚡ Unlimited Length
            </span>
            <span className="text-xs bg-emerald-950/40 border border-emerald-900/40 text-emerald-400 px-3 py-1.5 rounded-full font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Gemini 3.1 TTS Engine
            </span>
          </div>
        </header>

        {/* Global Error Display */}
        {globalError && (
          <div className="bg-rose-950/30 border border-rose-900/50 rounded-2xl p-4 flex items-start space-x-3 text-rose-300 text-sm leading-relaxed shadow-lg">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Generation Issue Detected</p>
              <p className="text-xs text-rose-400">{globalError}</p>
            </div>
          </div>
        )}

        {/* Dashboard layout (Left: Input & Settings, Right: Player & Segments) */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (lg:col-span-7) */}
          <section className="lg:col-span-7 space-y-8">
            {/* Text Segmenter Entry Panel */}
            <TextSegmenter
              text={text}
              onTextChange={handleTextChange}
              settings={settings}
              onSettingsChange={handleSettingsChange}
              segments={segments}
              onSegmentChange={handleSegmentChange}
              onGenerateSegment={handleGenerateSegment}
              onPlaySegment={handlePlaySegment}
              onDownloadSegment={handleDownloadSegment}
              isAutoSync={isAutoSync}
              onToggleAutoSync={handleToggleAutoSync}
            />
            
            {/* Voice settings controller */}
            <VoiceSettings
              settings={settings}
              onChange={handleSettingsChange}
            />
          </section>

          {/* Right Column (lg:col-span-5) */}
          <section className="lg:col-span-5 space-y-8 lg:sticky lg:top-8">
            
            {/* Audio playback console */}
            <AudioPlayer
              combinedBlob={combinedBlob}
              combinedUrl={combinedUrl}
              isGeneratingAll={isGeneratingAll}
              onGenerateAll={handleGenerateAll}
              segmentsCount={segments.length}
              readySegmentsCount={readySegmentsCount}
              totalLength={text.length}
            />

            {/* Quick guide panel */}
            <div className="bg-slate-900/40 border border-slate-900/60 rounded-2xl p-6 space-y-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-400" />
                Quick Usage Instructions
              </h3>
              <div className="space-y-3.5 text-xs text-slate-300">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 rounded-full bg-slate-950 flex items-center justify-center font-mono text-[10px] text-emerald-400 font-bold border border-slate-850 mt-0.5">1</div>
                  <p className="leading-relaxed">
                    Paste your Tagalog article, report, or script. The system dynamically slices it into balanced segments.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 rounded-full bg-slate-950 flex items-center justify-center font-mono text-[10px] text-emerald-400 font-bold border border-slate-850 mt-0.5">2</div>
                  <p className="leading-relaxed">
                    Choose a prebuilt Gemini Voice (e.g. Kore or Puck) and click the Tagalog accent presets to tailor pronunciation.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 rounded-full bg-slate-950 flex items-center justify-center font-mono text-[10px] text-emerald-400 font-bold border border-slate-850 mt-0.5">3</div>
                  <p className="leading-relaxed">
                    Click <strong className="text-emerald-300">Generate Combined Voice</strong>. It compiles the blocks in parallel, merges them, and builds a standard WAV file.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 rounded-full bg-slate-950 flex items-center justify-center font-mono text-[10px] text-emerald-400 font-bold border border-slate-850 mt-0.5">4</div>
                  <p className="leading-relaxed">
                    Listen to the continuous play, adjust speeds up to 2.0x, and download the entire file with a single click.
                  </p>
                </div>
              </div>
            </div>

          </section>
        </main>
      </div>
    </div>
  );
}
