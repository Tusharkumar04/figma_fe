import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import {
  Undo2,
  Redo2,
  Share2,
  Play,
  Download,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

// import {
//   exportDocumentToJson,
//   exportDocumentToSvg,
//   exportCanvasToRaster,
// } from '../../services/exportEngine';
import {
  exportDocumentToJson,
  exportDocumentToSvg,
  exportCanvasToRaster,
  exportDocumentToPdf,
} from '../../services/exportEngine';

export const TopNavigation: React.FC = () => {
  const {
    document,
    renameDocument,
    undo,
    redo,
    undoStack,
    redoStack,
    zoom,
    setZoom,
    collaborators,
    saveStatus,
    setPrototypeMode,
    setActivePrototypeFrameId,
  } = useEditorStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(document.title);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim()) {
      renameDocument(titleInput.trim());
    }
  };

  const handlePresent = () => {
    const allFrames = Object.values(document.nodes).filter((n) => n.type === 'frame');
    if (allFrames.length > 0) {
      setActivePrototypeFrameId(allFrames[0].id);
    }
    setPrototypeMode(true);
  };

  // const handleExport = (format: 'png' | 'jpg' | 'svg' | 'json') => {
  //   setShowExportMenu(false);
  //   if (format === 'json') {
  //     exportDocumentToJson(document);
  //   } else if (format === 'svg') {
  //     exportDocumentToSvg(document);
  //   } else {
  //     exportCanvasToRaster(format, document.title);
  //   }
  // };
  const handleExport = (format: 'png' | 'jpg' | 'svg' | 'json' | 'pdf') => {
    setShowExportMenu(false);
    if (format === 'json') {
      exportDocumentToJson(document);
    } else if (format === 'svg') {
      exportDocumentToSvg(document);
    } else if (format === 'pdf') {
      exportDocumentToPdf(document.title);
    } else {
      exportCanvasToRaster(format, document.title);
    }
  };

  return (
    <header className="h-12 border-b border-[#27272a] bg-[#18181b] flex items-center justify-between px-3 z-30 select-none text-xs text-zinc-300">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-md text-white font-bold tracking-tight shadow-sm shadow-blue-500/20">
          <Sparkles className="w-4 h-4" />
          <span className="font-semibold text-sm">Studio</span>
        </div>

        <div className="h-4 w-px bg-zinc-700/60 mx-1" />

        {isEditingTitle ? (
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
            autoFocus
            className="bg-[#27272a] text-zinc-100 px-2 py-1 rounded outline-none border border-blue-500 font-medium"
          />
        ) : (
          <button
            onClick={() => {
              setTitleInput(document.title);
              setIsEditingTitle(true);
            }}
            className="hover:bg-[#27272a] px-2 py-1 rounded font-medium text-zinc-200 transition-colors flex items-center gap-1.5"
          >
            <span>{document.title}</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        )}

        {saveStatus === 'saved' && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Saved to Cloud</span>
          </div>
        )}
        {saveStatus === 'saving' && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[11px] border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-spin" />
            <span>Saving...</span>
          </div>
        )}
        {saveStatus === 'offline' && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[11px] border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Saved Locally</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 bg-[#202024] p-1 rounded-lg border border-zinc-800">
        <button
          onClick={undo}
          disabled={undoStack.length === 0}
          className="p-1.5 rounded hover:bg-[#2a2a30] text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={redoStack.length === 0}
          className="p-1.5 rounded hover:bg-[#2a2a30] text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center -space-x-1.5">
          {Object.values(collaborators).map((c) => (
            <div
              key={c.id}
              style={{ backgroundColor: c.color }}
              title={c.name}
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-[#18181b] shadow-sm"
            >
              {c.name.charAt(0)}
            </div>
          ))}
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-[#18181b]">
            You
          </div>
        </div>

        <div className="flex items-center gap-1 bg-[#202024] px-1.5 py-1 rounded-md border border-zinc-800">
          <button
            onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}
            className="p-0.5 hover:text-white transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="w-11 text-center font-mono font-medium text-zinc-300">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
            className="p-0.5 hover:text-white transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium px-3 py-1.5 rounded-md shadow-sm">
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>

        <button
          onClick={handlePresent}
          className="p-1.5 bg-[#27272a] hover:bg-[#323238] rounded-md text-zinc-200 transition-colors"
          title="Present Prototype (Flow)"
        >
          <Play className="w-4 h-4 fill-current" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#27272a] hover:bg-[#323238] rounded-md text-zinc-200 transition-colors"
            title="Export Options"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium hidden sm:inline">Export</span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 top-9 w-44 bg-[#1e1e24] border border-zinc-700 rounded-xl shadow-2xl p-1 z-50 flex flex-col gap-0.5">
              <button
                onClick={() => handleExport('png')}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white text-zinc-200 text-xs transition-colors"
              >
                <span>PNG Image</span>
                <span className="text-[10px] text-zinc-400 font-mono">Raster</span>
              </button>
              <button
                onClick={() => handleExport('jpg')}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white text-zinc-200 text-xs transition-colors"
              >
                <span>JPEG Image</span>
                <span className="text-[10px] text-zinc-400 font-mono">Photo</span>
              </button>
              <button
                onClick={() => handleExport('svg')}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white text-zinc-200 text-xs transition-colors"
              >
                <span>SVG Vector</span>
                <span className="text-[10px] text-zinc-400 font-mono">Scalable</span>
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white text-zinc-200 text-xs transition-colors"
              >
                <span>PDF Document</span>
                <span className="text-[10px] text-zinc-400 font-mono">Print</span>
              </button>
              <div className="h-px bg-zinc-800 my-0.5" />
              <button
                onClick={() => handleExport('json')}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white text-zinc-200 text-xs transition-colors"
              >
                <span>Figma JSON</span>
                <span className="text-[10px] text-zinc-400 font-mono">Model</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
