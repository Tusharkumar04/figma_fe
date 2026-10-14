import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { createDefaultDocument } from '@figma-app/document-model';
import { saveDocumentLocally, saveDocumentToApi } from '../../services/documentStorage';
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
  Check,
  FilePlus2,
  FolderOpen,
  Save,
  Link2,
  Maximize,
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
    selectedIds,
    saveStatus,
    setSaveStatus,
    setPrototypeMode,
    setActivePrototypeFrameId,
    loadDocument,
    zoomToFit,
    zoomToSelection,
  } = useEditorStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(document.title);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showZoomMenu, setShowZoomMenu] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const openFileInputRef = useRef<HTMLInputElement>(null);
  const menusRef = useRef<HTMLDivElement>(null);

  // Close any open header menu when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menusRef.current && !menusRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
        setShowFileMenu(false);
        setShowShareMenu(false);
        setShowZoomMenu(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const shareLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?doc=${document.id}`
      : `doc:${document.id}`;

  const handleCopyShareLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareLink).then(
        () => {
          setLinkCopied(true);
          setTimeout(() => setLinkCopied(false), 1800);
        },
        () => setLinkCopied(false)
      );
    }
  };

  const handleNewDocument = () => {
    if (!window.confirm('Create a new empty file? Unsaved changes in this file stay cached locally.')) {
      return;
    }
    const next = createDefaultDocument('Untitled Design');
    loadDocument(next);
    saveDocumentLocally(next);
    setShowFileMenu(false);
  };

  const handleOpenDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse((event.target?.result as string) || '');
        if (!parsed || typeof parsed !== 'object' || !parsed.pages || !parsed.nodes) {
          window.alert('This file is not a valid studio document.');
          return;
        }
        loadDocument(parsed);
      } catch {
        window.alert('Could not read the selected file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
    setShowFileMenu(false);
  };

  const handleSaveNow = async () => {
    setShowFileMenu(false);
    setSaveStatus('saving');
    await saveDocumentLocally(document);
    const apiSaved = await saveDocumentToApi(document);
    setSaveStatus(apiSaved ? 'saved' : 'offline');
  };

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
    <header
      ref={menusRef}
      className="h-12 border-b border-[#27272a] bg-[#18181b] flex items-center justify-between px-3 z-30 select-none text-xs text-zinc-300"
    >
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
          <div className="relative">
            <button
              onClick={() => {
                setShowFileMenu((prev) => !prev);
                setShowExportMenu(false);
                setShowShareMenu(false);
                setShowZoomMenu(false);
              }}
              className="hover:bg-[#27272a] px-2 py-1 rounded font-medium text-zinc-200 transition-colors flex items-center gap-1.5"
              title="File menu"
            >
              <span>{document.title}</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {showFileMenu && (
              <div className="absolute left-0 top-9 w-56 bg-[#1e1e24] border border-zinc-700 rounded-xl shadow-2xl p-1 z-50 flex flex-col gap-0.5">
                <button
                  onClick={() => {
                    setTitleInput(document.title);
                    setIsEditingTitle(true);
                    setShowFileMenu(false);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white text-zinc-200 text-xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Rename file</span>
                </button>
                <button
                  onClick={handleNewDocument}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white text-zinc-200 text-xs transition-colors"
                >
                  <FilePlus2 className="w-3.5 h-3.5" />
                  <span>New file</span>
                </button>
                <button
                  onClick={() => openFileInputRef.current?.click()}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white text-zinc-200 text-xs transition-colors"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Open file…</span>
                </button>
                <button
                  onClick={handleSaveNow}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white text-zinc-200 text-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save now</span>
                </button>
              </div>
            )}
          </div>
        )}

        <input
          type="file"
          ref={openFileInputRef}
          accept=".json,application/json"
          onChange={handleOpenDocument}
          className="hidden"
        />

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

        <div className="relative flex items-center gap-1 bg-[#202024] px-1.5 py-1 rounded-md border border-zinc-800">
          <button
            onClick={() => setZoom((z) => z - 0.1)}
            className="p-0.5 hover:text-white transition-colors"
            title="Zoom out (Ctrl+-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setShowZoomMenu((prev) => !prev);
              setShowFileMenu(false);
              setShowExportMenu(false);
              setShowShareMenu(false);
            }}
            className="w-11 text-center font-mono font-medium text-zinc-300 hover:text-white transition-colors"
            title="Zoom options"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => setZoom((z) => z + 0.1)}
            className="p-0.5 hover:text-white transition-colors"
            title="Zoom in (Ctrl++)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {showZoomMenu && (
            <div className="absolute right-0 top-9 w-52 bg-[#1e1e24] border border-zinc-700 rounded-xl shadow-2xl p-1 z-50 flex flex-col gap-0.5">
              <button
                onClick={() => {
                  zoomToFit();
                  setShowZoomMenu(false);
                }}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white text-zinc-200 text-xs transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Maximize className="w-3.5 h-3.5" />
                  Zoom to fit
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">Shift+1</span>
              </button>
              <button
                onClick={() => {
                  zoomToSelection();
                  setShowZoomMenu(false);
                }}
                disabled={selectedIds.length === 0}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white text-zinc-200 text-xs transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <span>Zoom to selection</span>
                <span className="text-[10px] text-zinc-400 font-mono">Shift+2</span>
              </button>
              <div className="h-px bg-zinc-800 my-0.5" />
              {[0.5, 1, 2].map((value) => (
                <button
                  key={value}
                  onClick={() => {
                    setZoom(value);
                    setShowZoomMenu(false);
                  }}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white text-zinc-200 text-xs transition-colors"
                >
                  <span>Zoom to {value * 100}%</span>
                  <span className="text-[10px] text-zinc-400 font-mono">{Math.round(zoom * 100)}%</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowShareMenu((prev) => !prev);
              setShowFileMenu(false);
              setShowExportMenu(false);
              setShowZoomMenu(false);
            }}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium px-3 py-1.5 rounded-md shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          {showShareMenu && (
            <div className="absolute right-0 top-9 w-72 bg-[#1e1e24] border border-zinc-700 rounded-xl shadow-2xl p-3 z-50 flex flex-col gap-2 text-xs">
              <span className="font-semibold text-zinc-200">Share this file</span>
              <div className="flex items-center gap-1.5 bg-[#121214] border border-zinc-800 rounded-lg px-2 py-1.5">
                <Link2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span className="truncate text-[11px] text-zinc-400">{shareLink}</span>
              </div>
              <button
                onClick={handleCopyShareLink}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium"
              >
                {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                <span>{linkCopied ? 'Link copied' : 'Copy link'}</span>
              </button>
              <span className="text-[10px] text-zinc-500">
                Anyone with this link can open the file in this browser session.
              </span>
            </div>
          )}
        </div>

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
