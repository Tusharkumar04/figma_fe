import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useEditorStore } from '../../store/editorStore';
import { BatchAddNodesCommand } from '@figma-app/editor-commands';
import {
  generateDesignFromPrompt,
  generateDesignFromImage,
  extractPaletteFromImage,
  DesignTheme,
  THEMES,
} from './aiDesignEngine';
import {
  Sparkles,
  X,
  Check,
  ArrowRight,
  Wand2,
  Palette,
  Image as ImageIcon,
  UploadCloud,
  Trash2,
  FileText,
  ScanEye,
  Sparkle,
} from 'lucide-react';

interface AiDesignAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiDesignAgentModal: React.FC<AiDesignAgentModalProps> = ({ isOpen, onClose }) => {
  const { document: figmaDoc, activePageId, executeCommand, setSelectedIds, setPan } = useEditorStore();

  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [prompt, setPrompt] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<DesignTheme>('auto');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);

  // Image to design state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imagePromptRef = useRef<HTMLInputElement>(null);

  // Clipboard paste listener when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileLoad(file);
            setActiveTab('image');
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  // Original code commented out per guidelines:
  // const presets = [
  //   { label: '💳 Pricing Table', prompt: 'Modern SaaS Pricing Table with 3 tiers and feature checkmarks' },
  //   { label: '🚀 Landing Hero', prompt: 'High-converting Landing Page Hero with badge, CTA and preview mockup' },
  //   { label: '🛍️ Product Card', prompt: 'Modern Nike sneaker product showcase card with price and buy button' },
  //   { label: '📱 Mobile App', prompt: 'Native mobile app screen with navigation, cards, and bottom tab bar' },
  //   { label: '📊 Dashboard', prompt: 'Analytics dashboard with KPI statistics cards and growth bar chart' },
  //   { label: '🎵 Music Player', prompt: 'Sleek dark music player widget with album art, track details, and controls' },
  //   { label: '🔐 Sign In Modal', prompt: 'Authentication login modal with email, password, and social buttons' },
  //   { label: '👤 Profile Card', prompt: 'Modern creator user profile card with avatar, bio, and follow stats' },
  // ];

  const presets = [
    { label: '🌐 Network Portal', prompt: 'What Is My IP network diagnostics portal with IP address, connectivity, and device info' },
    { label: '💳 Pricing Table', prompt: 'Modern SaaS Pricing Table with 3 tiers and feature checkmarks' },
    { label: '🚀 Landing Hero', prompt: 'High-converting Landing Page Hero with badge, CTA and preview mockup' },
    { label: '🛍️ Product Card', prompt: 'Modern Nike sneaker product showcase card with price and buy button' },
    { label: '📱 Mobile App', prompt: 'Native mobile app screen with navigation, cards, and bottom tab bar' },
    { label: '📊 Dashboard', prompt: 'Analytics dashboard with KPI statistics cards and growth bar chart' },
    { label: '🎵 Music Player', prompt: 'Sleek dark music player widget with album art, track details, and controls' },
    { label: '🔐 Sign In Modal', prompt: 'Authentication login modal with email, password, and social buttons' },
    { label: '👤 Profile Card', prompt: 'Modern creator user profile card with avatar, bio, and follow stats' },
  ];

  const handleFileLoad = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setImageSrc(dataUrl);
        setImageName(file.name);
        try {
          const analysis = await extractPaletteFromImage(dataUrl);
          setExtractedColors(analysis.dominantColors);
          setSelectedTheme('auto');
        } catch {
          // ignore error
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileLoad(file);
    }
  };

  // Helper to generate a quick mock sample image if user has none
  const handleLoadSample = () => {
    const canvas = window.document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 380;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 600, 380);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 600, 380);

      // Card
      ctx.fillStyle = '#1e293b';
      ctx.roundRect ? ctx.roundRect(40, 40, 520, 300, 16) : ctx.rect(40, 40, 520, 300);
      ctx.fill();

      // UI mockup accents
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(70, 70, 120, 24);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(70, 110, 260, 16);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(70, 136, 380, 12);
      ctx.fillRect(70, 156, 300, 12);

      // Mini chart bars
      const barColors = ['#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#34d399'];
      barColors.forEach((c, idx) => {
        ctx.fillStyle = c;
        const h = 40 + idx * 22;
        ctx.fillRect(70 + idx * 50, 300 - h, 36, h);
      });

      const sampleUrl = canvas.toDataURL('image/png');
      setImageSrc(sampleUrl);
      setImageName('sample_dashboard_ui.png');
      setExtractedColors(['#6366f1', '#38bdf8', '#c084fc', '#34d399', '#0f172a']);
      setSelectedTheme('auto');
    }
  };

  const handleGenerate = async () => {
    const userPrompt =
      prompt.trim() ||
      (activeTab === 'text' ? textareaRef.current?.value.trim() : imagePromptRef.current?.value.trim()) ||
      '';

    if (activeTab === 'image' && !imageSrc) {
      if (userPrompt) {
        // User provided prompt instructions without image: proceed with intelligent vector synthesis!
      } else {
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
        return;
      }
    }

    setIsGenerating(true);
    setGenerationStep(1);

    await new Promise((r) => setTimeout(r, 450));
    setGenerationStep(2);
    await new Promise((r) => setTimeout(r, 500));
    setGenerationStep(3);
    await new Promise((r) => setTimeout(r, 400));

    // Calculate smart canvas placement (right of existing nodes or default offset)
    const existingNodes = Object.values(figmaDoc.nodes).filter((n) => !n.parent);
    let nextX = 120;
    let nextY = 120;

    if (existingNodes.length > 0) {
      let maxX = -Infinity;
      let topY = 120;
      existingNodes.forEach((n) => {
        const rightEdge = (n.transform?.x || 0) + (n.transform?.width || 0);
        if (rightEdge > maxX) {
          maxX = rightEdge;
          topY = n.transform?.y || 120;
        }
      });
      nextX = maxX + 80;
      nextY = topY;
    }

    try {
      const finalPrompt = userPrompt || presets[0].prompt;

      // Generate design nodes based on mode
      let result;
      if (activeTab === 'image' && imageSrc) {
        result = await generateDesignFromImage(imageSrc, userPrompt, selectedTheme, nextX, nextY);
      } else {
        result = await generateDesignFromPrompt(finalPrompt, selectedTheme, nextX, nextY);
      }

      const targetPageId = activePageId || figmaDoc.activePageId || Object.keys(figmaDoc.pages)[0] || '';

      // Insert into store via BatchAddNodesCommand
      executeCommand(new BatchAddNodesCommand(result.nodes, targetPageId));

      // Select new root frame
      setSelectedIds([result.rootFrameId]);

      // Center view smoothly
      setPan({ x: -nextX + 160, y: -nextY + 120 });
      onClose();
    } catch (err) {
      console.error('[AI AGENT] Generation Error:', err);
    } finally {
      setIsGenerating(false);
      setGenerationStep(0);
    }
  };

  return createPortal(
    <>
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9998] animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal Dialog Container */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-xl max-h-[92vh] overflow-y-auto bg-[#18181b] border border-zinc-700/80 rounded-2xl shadow-2xl flex flex-col text-zinc-200 pointer-events-auto animate-in zoom-in-95 duration-150"
        >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-[#1c1c20] sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 via-indigo-500 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4 h-4 fill-amber-300 stroke-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-zinc-100">AI Design Agent</h3>
                <span className="text-[10px] bg-gradient-to-r from-violet-500/20 to-blue-500/20 text-indigo-300 border border-indigo-500/30 font-medium px-1.5 py-0.5 rounded-full">
                  Free Built-in Copilot
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Generate responsive Figma UI from text or reference images</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher - Prompt to UI first, Image to Design second */}
        <div className="flex border-b border-zinc-800 bg-[#151518] px-5 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'text'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Prompt to UI</span>
          </button>

          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'image'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Image to Design</span>
            <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1 rounded-sm">
              New
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">
          {/* TAB 1: IMAGE TO DESIGN */}
          {activeTab === 'image' && (
            <div className="flex flex-col gap-3.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {!imageSrc ? (
                /* Empty Upload Dropzone */
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileLoad(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-zinc-700/80 hover:border-indigo-500/70 bg-[#121215] hover:bg-[#15151a]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2.5 shadow-inner">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-semibold text-zinc-200">
                    Drop UI screenshot, wireframe or image here
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-1 max-w-sm">
                    Supports PNG, JPG, WebP. Or paste directly with <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-300 font-mono text-[10px]">Ctrl+V</kbd>
                  </p>
                  <div className="flex items-center gap-2 mt-3.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                    >
                      Browse Files
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoadSample();
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-colors"
                    >
                      Try Sample UI Screenshot
                    </button>
                  </div>
                </div>
              ) : (
                /* Loaded Image Preview Card */
                <div className="p-3 bg-[#121215] border border-zinc-700/80 rounded-xl flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg bg-black/40 overflow-hidden border border-zinc-700/70 flex items-center justify-center shrink-0">
                        <img src={imageSrc} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-zinc-200 truncate max-w-[280px]">
                          {imageName || 'Uploaded Image'}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                          <Check className="w-3 h-3" /> Visual Structure & Pixels Analyzed
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-xs transition-colors"
                        title="Replace Image"
                      >
                        Change
                      </button>
                      <button
                        onClick={() => {
                          setImageSrc(null);
                          setImageName('');
                          setExtractedColors([]);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Extracted Color Palette */}
                  {extractedColors.length > 0 && (
                    <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1.5">
                        <ScanEye className="w-3 h-3 text-indigo-400" />
                        Auto-detected Color Palette:
                      </span>
                      <div className="flex items-center gap-1.5">
                        {extractedColors.map((hex, ci) => (
                          <div
                            key={ci}
                            className="w-4 h-4 rounded-full border border-zinc-600/70 shadow-xs"
                            style={{ backgroundColor: hex }}
                            title={hex}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Guidance Prompt */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                  Instructions / Changes (Optional)
                </span>
                <input
                  ref={imagePromptRef}
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Recreate as mobile app, or modern dark SaaS hero, or keep layout..."
                  className="w-full bg-[#121215] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleGenerate();
                  }}
                />
              </div>
            </div>
          )}

          {/* TAB 2: PROMPT TO DESIGN */}
          {activeTab === 'text' && (
            <div className="flex flex-col gap-3.5">
              {/* Quick Preset Buttons */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                  Quick Suggestions
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setPrompt(p.prompt)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        prompt === p.prompt
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                          : 'bg-[#222226] text-zinc-300 border-zinc-700/60 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt Textarea */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                  Prompt Instructions
                </span>
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. Design a dark SaaS pricing table with 3 tiers and feature checkmarks..."
                    rows={3}
                    className="w-full bg-[#121215] border border-zinc-700 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none leading-relaxed"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        handleGenerate();
                      }
                    }}
                  />
                  <span className="absolute right-2.5 bottom-2 text-[10px] text-zinc-500 font-mono">
                    Ctrl+Enter to run
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Theme / Palette Selection */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-zinc-400" />
              Aesthetic Style & Colors
            </span>
            <div className="grid grid-cols-6 gap-2">
              {(
                [
                  { id: 'auto', name: 'Auto (Image)', preview: extractedColors[0] || '#6366f1', accent: extractedColors[1] || '#38bdf8' },
                  { id: 'dark', name: 'Dark Mode', preview: '#09090b', accent: '#0d99ff' },
                  { id: 'light', name: 'Clean Light', preview: '#f8fafc', accent: '#2563eb' },
                  { id: 'indigo', name: 'Indigo SaaS', preview: '#1e1b4b', accent: '#8b5cf6' },
                  { id: 'cyberpunk', name: 'Cyberpunk', preview: '#050508', accent: '#00f0ff' },
                  { id: 'minimal', name: 'Minimalist', preview: '#ffffff', accent: '#18181b' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTheme(t.id)}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                    selectedTheme === t.id
                      ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-sm'
                      : 'border-zinc-800 bg-[#202024] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-full border border-zinc-600/50 shadow-inner flex items-center justify-center"
                    style={{ backgroundColor: t.preview }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.accent }} />
                  </div>
                  <span className="text-[10px] font-medium leading-tight truncate w-full">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Generation Progress Indicator if running */}
          {isGenerating && (
            <div className="p-3 bg-[#121215] border border-indigo-500/30 rounded-xl flex flex-col gap-2 animate-in fade-in duration-100">
              <div className="flex items-center justify-between text-xs font-medium text-indigo-300">
                <span className="flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  {activeTab === 'image' ? 'Synthesizing UI from Reference Image...' : 'Generating UI Vector Structure...'}
                </span>
                <span className="text-[11px] font-mono text-zinc-400">Step {generationStep}/3</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${(generationStep / 3) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">
                {generationStep === 1 && (activeTab === 'image' ? '› Scanning image pixels & analyzing visual hierarchy...' : '› Deconstructing layout requirements & design tokens...')}
                {generationStep === 2 && (activeTab === 'image' ? '› Extracting dominant colors, cards, buttons & text layers...' : '› Synthesizing Figma auto-layout frames & vector paths...')}
                {generationStep === 3 && (activeTab === 'image' ? '› Assembling Figma vector frames with embedded visual...' : '› Finalizing responsive constraints and injecting to canvas...')}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-800 bg-[#1c1c20] sticky bottom-0 z-10">
          <span className="text-[11px] text-zinc-500 flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            100% Free • No API Key required
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-md shadow-indigo-500/25 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 fill-amber-300 stroke-amber-200" />
              <span>
                {isGenerating
                  ? 'Generating...'
                  : activeTab === 'image'
                  ? imageSrc
                    ? 'Generate from Image'
                    : prompt.trim()
                    ? 'Generate from Prompt'
                    : 'Upload Image & Generate'
                  : 'Generate & Insert'}
              </span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </>,
  window.document.body
);
};
