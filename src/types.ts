export interface AudioSegment {
  id: string;
  text: string;
  index: number;
  status: "idle" | "loading" | "success" | "error";
  pcmData: Int16Array | null;
  audioUrl: string | null;
  errorMessage?: string;
}

export interface VoicePreset {
  id: string;
  name: string;
  gender: "Female" | "Male";
  description: string;
}

export interface TtsSettings {
  voiceName: string;
  speed: "slow" | "normal" | "fast";
  customInstruction: string;
  segmentMode: "auto" | "2-parts" | "4-parts" | "none";
}
