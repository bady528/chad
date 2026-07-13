import React from "react";
import { TtsSettings, VoicePreset } from "../types";
import { MessageSquare, Settings2, Sparkles, Volume2 } from "lucide-react";

interface VoiceSettingsProps {
  settings: TtsSettings;
  onChange: (settings: TtsSettings) => void;
}

export const VOICE_PRESETS: VoicePreset[] = [
  { id: "Kore", name: "Kore", gender: "Female", description: "Crisp, professional, and highly articulate. Excellent for tutorials and technical reading." },
  { id: "Zephyr", name: "Zephyr", gender: "Female", description: "Warm, soft, and soothing. Ideal for narration, literature, and calming guides." },
  { id: "Puck", name: "Puck", gender: "Male", description: "Lively, conversational, and energetic. Perfect for dialogues and casual content." },
  { id: "Charon", name: "Charon", gender: "Male", description: "Deep, warm, and mature. Excellent for dramatic readings and authoritative narration." },
  { id: "Fenrir", name: "Fenrir", gender: "Male", description: "Bold, strong, and highly expressive. Good for stories and audiobooks." },
];

const PROMPT_PRESETS = [
  { label: "Standard Tagalog Accent", text: "Read in a natural, neutral, standard Filipino/Tagalog accent with correct pronunciation and a friendly, engaging tone." },
  { label: "Formal News Broadcaster", text: "Read like a professional Tagalog news anchor or radio broadcaster. Maintain an authoritative, perfectly enunciated, and elegant rhythm." },
  { label: "Conversational Taglish", text: "Adopt a relaxed, modern conversational Manila Tagalog tone. Keep pronunciation natural, flowy, and friendly." },
  { label: "Expressive Storyteller", text: "Read with deep emotional expression, variation in pitch, and dramatic pauses. Perfect for folktales or fiction narration." },
  { label: "Slow Educational Guide", text: "Speak very clearly, pausing deliberately between phrases. Perfect for students, vocabulary dictation, and language learners." },
];

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({ settings, onChange }) => {
  const updateSetting = <K extends keyof TtsSettings>(key: K, value: TtsSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
        <Settings2 className="w-5 h-5 text-emerald-400" />
        <h2 className="text-lg font-semibold text-slate-100 font-sans tracking-tight">Voice & Style Settings</h2>
      </div>

      {/* Voice Preset Selection */}
      <div className="space-y-3">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
          Select Narrator Voice
        </label>
        <div className="grid grid-cols-1 gap-2.5">
          {VOICE_PRESETS.map((voice) => {
            const isSelected = settings.voiceName === voice.id;
            return (
              <button
                key={voice.id}
                type="button"
                onClick={() => updateSetting("voiceName", voice.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col justify-start relative group ${
                  isSelected
                    ? "bg-emerald-950/40 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                    : "bg-slate-950/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium text-slate-200 flex items-center gap-2">
                    {voice.name}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      voice.gender === "Female" ? "bg-pink-950/60 text-pink-400" : "bg-blue-950/60 text-blue-400"
                    }`}>
                      {voice.gender}
                    </span>
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed font-sans">
                  {voice.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Speed Rate Slider/Buttons */}
      <div className="space-y-3">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-emerald-400" />
          Reading Pace
        </label>
        <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          {(["slow", "normal", "fast"] as const).map((spd) => {
            const isSelected = settings.speed === spd;
            return (
              <button
                key={spd}
                type="button"
                onClick={() => updateSetting("speed", spd)}
                className={`py-2 px-3 rounded-lg text-xs font-medium capitalize transition-all ${
                  isSelected
                    ? "bg-emerald-500 text-slate-950 shadow-md font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {spd}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tagalog Accent Style Presets */}
      <div className="space-y-3">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          Tagalog Accent & Pronunciation Presets
        </label>
        <div className="flex flex-wrap gap-1.5">
          {PROMPT_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => updateSetting("customInstruction", preset.text)}
              className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition-all ${
                settings.customInstruction === preset.text
                  ? "bg-emerald-950/60 border-emerald-500/80 text-emerald-300 font-medium"
                  : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom prompt override block */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          Custom Speech / Emotion Instructions
        </label>
        <textarea
          value={settings.customInstruction}
          onChange={(e) => updateSetting("customInstruction", e.target.value)}
          placeholder="E.g., Read in an energetic, joyful tone, or speak with an extra thick Manila Tagalog slang accent."
          className="w-full h-20 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none leading-relaxed"
        />
        <p className="text-[10px] text-slate-500 leading-normal">
          This prompt instructs Gemini how to enunciate the Tagalog accent, syllables, and narrative style.
        </p>
      </div>
    </div>
  );
};
