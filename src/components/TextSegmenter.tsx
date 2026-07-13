import React, { useState } from "react";
import { AudioSegment, TtsSettings } from "../types";
import { 
  FileText, 
  HelpCircle, 
  Play, 
  Download, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Scissors, 
  Lock, 
  RefreshCw, 
  Sparkles,
  Layers
} from "lucide-react";

interface TextSegmenterProps {
  text: string;
  onTextChange: (text: string) => void;
  settings: TtsSettings;
  onSettingsChange: (settings: TtsSettings) => void;
  segments: AudioSegment[];
  onSegmentChange: (index: number, newText: string) => void;
  onGenerateSegment: (index: number) => void;
  onPlaySegment: (segment: AudioSegment) => void;
  onDownloadSegment: (segment: AudioSegment) => void;
  isAutoSync: boolean;
  onToggleAutoSync: (sync: boolean) => void;
}

export const TextSegmenter: React.FC<TextSegmenterProps> = ({
  text,
  onTextChange,
  settings,
  onSettingsChange,
  segments,
  onSegmentChange,
  onGenerateSegment,
  onPlaySegment,
  onDownloadSegment,
  isAutoSync,
  onToggleAutoSync,
}) => {
  const [showHelp, setShowHelp] = useState(false);

  const characterCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-6">
      {/* Text Input Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-slate-100 font-sans tracking-tight">
              Tagalog Text Input
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1"
              title="How does segmentation work?"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono bg-slate-950 px-2.5 py-1 rounded border border-slate-850 text-slate-400">
              {characterCount.toLocaleString()} chars | {wordCount.toLocaleString()} words
            </span>
          </div>
        </div>

        {/* Informative Help Box */}
        {showHelp && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 space-y-2 leading-relaxed animate-fadeIn">
            <p className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5" /> No Word Limit Synthesis Guide:
            </p>
            <p>
              To process long documents without hitting Gemini API audio generation constraints, our system divides your text into segments.
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 ml-1">
              <li><strong className="text-slate-300">Dynamic Auto-Split:</strong> Automatically slices text at natural paragraph/sentence marks (approx. 1000 characters per block) for perfectly smooth narrations.</li>
              <li><strong className="text-slate-300">Force 2 or 4 Parts:</strong> Evenly splits the text into exactly 2 or 4 sections.</li>
              <li><strong className="text-slate-300">Manual Control:</strong> Unlock segments to edit, tweak, or regenerate specific paragraphs independently. Then, merge and download them in one click!</li>
            </ul>
          </div>
        )}

        {/* Main Editor Textarea */}
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="I-type o i-paste ang iyong Tagalog na babasahin dito... (Type or paste your Tagalog text here. It supports extremely long text!)"
            className="w-full h-64 bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all leading-relaxed"
          />
          {characterCount === 0 && (
            <div className="absolute top-24 left-0 right-0 text-center pointer-events-none text-slate-600 text-xs px-10 leading-normal">
              <p className="font-medium text-slate-500 mb-1">Subukan ang halimbawa (Try a quick example):</p>
              <button
                type="button"
                onClick={() => onTextChange(
                  "Magandang hapon po sa inyong lahat. Maligayang pagdating sa aming makabagong Text to Voice converter. " +
                  "Ang programang ito ay sadyang ginawa upang matulungan ang mga Pilipino na makabuo ng malilinaw, " +
                  "mabibilis, at makatotohanang boses gamit ang pinakabagong teknolohiya ng AI. " +
                  "Kahit gaano man kahaba ang inyong isusulat, maaari natin itong hatiin sa iba't ibang parte " +
                  "at pagsama-samahin muli para sa isang mabilis na pag-download. Subukan ito ngayon din!"
                )}
                className="pointer-events-auto text-emerald-500 hover:text-emerald-400 font-semibold underline transition-all"
              >
                Maglagay ng Sample na Tagalog Text
              </button>
            </div>
          )}
        </div>

        {/* Segmentation Strategy Controller */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
              Segmentation Mode
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: "auto", label: "Dynamic Auto-Split", icon: Layers },
                  { id: "2-parts", label: "2 Equal Parts", icon: Scissors },
                  { id: "4-parts", label: "4 Equal Parts", icon: Scissors },
                  { id: "none", label: "Single Block (No Split)", icon: Lock },
                ] as const
              ).map((mode) => {
                const isSelected = settings.segmentMode === mode.id;
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => onSettingsChange({ ...settings, segmentMode: mode.id })}
                    className={`flex items-center space-x-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-emerald-950/60 border border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.05)]"
                        : "bg-slate-950/40 border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-3 self-end md:self-center">
            <div className="flex flex-col items-end">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                Segment Sync: {isAutoSync ? "Auto-Locked" : "Customized"}
                <span className={`w-1.5 h-1.5 rounded-full ${isAutoSync ? "bg-emerald-400 animate-pulse" : "bg-orange-400"}`} />
              </span>
              <p className="text-[10px] text-slate-500 text-right leading-none mt-1">
                {isAutoSync ? "Auto-generates parts as you type" : "Allows editing individual parts directly"}
              </p>
            </div>
            {!isAutoSync && (
              <button
                type="button"
                onClick={() => onToggleAutoSync(true)}
                className="bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-500/50 text-emerald-300 text-xs px-2.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5"
                title="Resynchronize segments to match the main text"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-Sync</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Segments Visualizer list */}
      {segments.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Generated Parts ({segments.length})
            </h3>
            {segments.some((s) => s.status === "loading") && (
              <span className="text-[11px] text-emerald-400 animate-pulse flex items-center gap-1.5 font-medium">
                <Loader2 className="w-3 h-3 animate-spin" />
                Synthesizing parts in parallel...
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {segments.map((segment, idx) => {
              const charCount = segment.text.length;
              return (
                <div
                  key={segment.id}
                  className={`bg-slate-900/60 border rounded-xl p-4 transition-all relative ${
                    segment.status === "loading"
                      ? "border-emerald-500 bg-slate-900/80 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                      : segment.status === "success"
                      ? "border-emerald-950 bg-slate-900/40"
                      : segment.status === "error"
                      ? "border-rose-950 bg-rose-950/5"
                      : "border-slate-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-semibold bg-slate-950 text-emerald-400 border border-slate-850 w-6 h-6 rounded-full flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        Part {idx + 1} ({charCount.toLocaleString()} chars)
                      </span>
                    </div>

                    {/* Badge status */}
                    <div className="flex items-center space-x-2">
                      {segment.status === "loading" && (
                        <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          Generating...
                        </span>
                      )}
                      {segment.status === "success" && (
                        <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Ready
                        </span>
                      )}
                      {segment.status === "error" && (
                        <span className="text-[11px] font-medium text-rose-400 bg-rose-950/40 border border-rose-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <XCircle className="w-2.5 h-2.5" />
                          Failed
                        </span>
                      )}
                      {segment.status === "idle" && (
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-950 border border-slate-850 px-2 py-0.5 rounded-full">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Editable textarea for segment text */}
                  <textarea
                    value={segment.text}
                    onChange={(e) => {
                      onToggleAutoSync(false); // Disable auto sync when user types inside segment card
                      onSegmentChange(idx, e.target.value);
                    }}
                    rows={Math.max(2, Math.min(5, Math.ceil(segment.text.length / 100)))}
                    className="w-full bg-slate-950/60 hover:bg-slate-950/95 focus:bg-slate-950 border border-slate-850 focus:border-emerald-500/50 rounded-lg p-2.5 text-xs text-slate-300 placeholder-slate-700 focus:outline-none transition-all leading-relaxed"
                  />

                  {segment.errorMessage && (
                    <p className="text-[11px] text-rose-400 mt-2 font-medium flex items-center gap-1">
                      <XCircle className="w-3 h-3 flex-shrink-0" />
                      {segment.errorMessage}
                    </p>
                  )}

                  {/* Actions for segment */}
                  <div className="flex items-center justify-end space-x-2 mt-3 pt-2.5 border-t border-slate-950">
                    <button
                      type="button"
                      onClick={() => onGenerateSegment(idx)}
                      disabled={segment.status === "loading"}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 font-medium ${
                        segment.status === "success"
                          ? "bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-200"
                          : "bg-emerald-900/20 border border-emerald-500/30 hover:border-emerald-500/80 text-emerald-300"
                      } disabled:opacity-50`}
                    >
                      {segment.status === "loading" ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{segment.status === "success" ? "Regenerate Part" : "Generate Part"}</span>
                        </>
                      )}
                    </button>

                    {segment.status === "success" && (
                      <>
                        <button
                          type="button"
                          onClick={() => onPlaySegment(segment)}
                          className="bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg transition-all text-xs flex items-center space-x-1"
                        >
                          <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                          <span>Play</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDownloadSegment(segment)}
                          className="bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg transition-all text-xs flex items-center space-x-1"
                          title="Download individual part"
                        >
                          <Download className="w-3 h-3 text-emerald-400" />
                          <span>Download</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
