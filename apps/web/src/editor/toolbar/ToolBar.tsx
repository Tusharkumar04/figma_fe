/*
Original ToolBar:
import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { ToolType } from '@figma-app/shared-types';
import { MousePointer2, Hand, Frame, Square, Circle, Type } from 'lucide-react';

export const ToolBar: React.FC = () => {
  const { activeTool, setActiveTool } = useEditorStore();

  const handleToolSelect = (tool: ToolType) => {
    setActiveTool(tool);
  };

  const tools: { id: ToolType; icon: React.FC<any>; label: string; shortcut: string }[] = [
    { id: 'select', icon: MousePointer2, label: 'Move', shortcut: 'V' },
    { id: 'hand', icon: Hand, label: 'Hand', shortcut: 'H' },
    { id: 'frame', icon: Frame, label: 'Frame', shortcut: 'F' },
    { id: 'rect', icon: Square, label: 'Rectangle', shortcut: 'R' },
    { id: 'ellipse', icon: Circle, label: 'Ellipse', shortcut: 'O' },
    { id: 'text', icon: Type, label: 'Text', shortcut: 'T' },
  ];

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-[#18181b]/90 backdrop-blur-md px-1.5 py-1.5 rounded-xl border border-zinc-700/60 shadow-2xl text-zinc-300">
      {tools.map((t) => {
        const Icon = t.icon;
        const isActive = activeTool === t.id;
        return (
          <button
            key={t.id}
            onClick={() => handleToolSelect(t.id)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isActive
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                : 'hover:bg-[#27272a] hover:text-zinc-100'
            }`}
            title={`${t.label} (${t.shortcut})`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
};
*/

import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { ToolType, NodeType } from '@figma-app/shared-types';
import { createId } from '@figma-app/document-model';
import {
  MousePointer2,
  Hand,
  Maximize2,
  Frame,
  Square,
  Circle,
  Type,
  Minus,
  MoveRight,
  Triangle,
  Star,
  Image as ImageIcon,
  PenTool,
  Pencil,
  MessageCircle,
  LayoutGrid,
  Code2,
  Workflow,
  Diamond,
  Check,
  ChevronDown,
} from 'lucide-react';

export const ToolBar: React.FC = () => {
  const {
    activeTool,
    setActiveTool,
    addNode,
    isCommentMode,
    setCommentMode,
    activeTab,
    setActiveTab,
    isPrototypeMode,
    setPrototypeMode,
    selectedIds,
    createComponentFromSelection,
    setLeftTab,
  } = useEditorStore();

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedMoveTool, setSelectedMoveTool] = useState<'select' | 'hand' | 'scale'>('select');
  const [selectedShapeTool, setSelectedShapeTool] = useState<string>('rect');
  const [selectedFrameTool, setSelectedFrameTool] = useState<string>('frame');
  const [selectedDrawTool, setSelectedDrawTool] = useState<string>('pen');

  const applyMoveTool = (toolId: string) => {
    if (toolId === 'hand') setActiveTool('hand');
    else if (toolId === 'scale') setActiveTool('scale');
    else setActiveTool('select');
  };

  const applyDrawTool = (toolId: string) => {
    setActiveTool(toolId === 'pencil' ? 'pencil' : 'pen');
  };

  const toolbarRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        addNode('rect' as NodeType, {
          name: file.name.replace(/\.[^/.]+$/, '') || 'Image',
          transform: { x: 250, y: 200, width: 320, height: 220, rotation: 0 },
          fills: [
            {
              id: createId('fill'),
              type: 'image',
              imageUrl: dataUrl,
              opacity: 1,
              visible: true,
            },
          ],
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

// Custom Figma-exact SVG icons
const MoveIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 2L13 7.5L8.5 9.5L6.5 14L3 2Z" />
  </svg>
);

const FrameIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <line x1="5.5" y1="2" x2="5.5" y2="14" />
    <line x1="10.5" y1="2" x2="10.5" y2="14" />
    <line x1="2" y1="5.5" x2="14" y2="5.5" />
    <line x1="2" y1="10.5" x2="14" y2="10.5" />
  </svg>
);

const SectionIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 5V13C3 13.55 3.45 14 4 14H12C12.55 14 13 13.55 13 13V4C13 3.45 12.55 3 12 3H7.5L6 5H3Z" />
  </svg>
);

const SliceIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.5 3.5L5.5 10.5L3.5 12.5L3 13L3.5 13.5L4 13L6 11L13 4L12.5 3.5Z" />
    <line x1="7" y1="9" x2="11" y2="5" />
  </svg>
);

const RectIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2.5" y="2.5" width="11" height="11" rx="0.5" />
  </svg>
);

const LineIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <line x1="3" y1="13" x2="13" y2="3" />
  </svg>
);

const ArrowIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3.5" y1="12.5" x2="12.5" y2="3.5" />
    <polyline points="7,3.5 12.5,3.5 12.5,9" />
  </svg>
);

const EllipseIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="5.5" />
  </svg>
);

const PolygonIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="8,2.5 13.5,13.5 2.5,13.5" />
  </svg>
);

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="8,2 9.8,5.8 14,6.4 11,9.3 11.7,13.5 8,11.5 4.3,13.5 5,9.3 2,6.4 6.2,5.8" />
  </svg>
);

const MediaIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" />
    <circle cx="5.5" cy="5.5" r="1" />
    <path d="M2.5 11L6 7.5L10 11.5" />
    <path d="M8.5 10L10.5 8L13.5 11" />
  </svg>
);

  // Move Tools definitions
  const moveTools = [
    { id: 'select', label: 'Move', icon: MoveIcon, shortcut: 'V' },
    { id: 'hand', label: 'Hand tool', icon: Hand, shortcut: 'H' },
    { id: 'scale', label: 'Scale', icon: Maximize2, shortcut: 'K' },
  ];

  // Frame Tools definitions
  const frameTools = [
    { id: 'frame', label: 'Frame', icon: FrameIcon, shortcut: 'F' },
    { id: 'section', label: 'Section', icon: SectionIcon, shortcut: 'Shift+S' },
    { id: 'slice', label: 'Slice', icon: SliceIcon, shortcut: 'S' },
  ];

  // Shape Tools definitions
  const shapeTools = [
    { id: 'rect', label: 'Rectangle', icon: RectIcon, shortcut: 'R' },
    { id: 'line', label: 'Line', icon: LineIcon, shortcut: 'L' },
    { id: 'arrow', label: 'Arrow', icon: ArrowIcon, shortcut: 'Shift+L' },
    { id: 'ellipse', label: 'Ellipse', icon: EllipseIcon, shortcut: 'O' },
    { id: 'polygon', label: 'Polygon', icon: PolygonIcon, shortcut: '' },
    { id: 'star', label: 'Star', icon: StarIcon, shortcut: '' },
    { id: 'image', label: 'Image/video...', icon: MediaIcon, shortcut: 'Ctrl+Shift+K' },
  ];

  // Draw Tools definitions
  const drawTools = [
    { id: 'pen', label: 'Pen', icon: PenTool, shortcut: 'P' },
    { id: 'pencil', label: 'Pencil', icon: Pencil, shortcut: 'Shift+P' },
  ];

  // Determine active icon for Move button
  const currentMoveTool = moveTools.find((t) => t.id === selectedMoveTool) || moveTools[0];
  const isMoveActive = activeTool === 'select' || activeTool === 'hand' || activeTool === 'scale';

  // Determine active icon for Frame button
  const currentFrameTool = frameTools.find((t) => t.id === selectedFrameTool) || frameTools[0];
  const isFrameActive = activeTool === 'frame';

  // Determine active icon for Shape button
  const currentShapeTool = shapeTools.find((t) => t.id === selectedShapeTool) || shapeTools[0];
  // const isShapeActive = activeTool === 'rect' || activeTool === 'ellipse' || activeTool === 'line';
  const isShapeActive = activeTool === 'rect' || activeTool === 'ellipse' || activeTool === 'line' || activeTool === 'star' || activeTool === 'polygon';

  // Determine active icon for Draw button
  const currentDrawTool = drawTools.find((t) => t.id === selectedDrawTool) || drawTools[0];
  const isDrawActive = activeTool === 'pen' || activeTool === 'pencil';

  const isTextActive = activeTool === 'text';

  const toggleDropdown = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdown(openDropdown === name ? null : name);
  };

  return (
    <div
      ref={toolbarRef}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center bg-white text-zinc-800 rounded-2xl p-1 shadow-[0_8px_32px_rgba(0,0,0,0.18),0_2px_6px_rgba(0,0,0,0.08)] border border-zinc-200/90 select-none transition-all max-w-[95vw] overflow-x-auto overflow-y-visible"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* 1. MOVE / SELECTION TOOL GROUP */}
      <div className="relative flex items-center">
        <button
          onClick={() => applyMoveTool(selectedMoveTool)}
          className={`h-9 px-2 flex items-center justify-center rounded-lg transition-colors ${
            isMoveActive
              ? 'bg-[#0d99ff] text-white'
              : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
          }`}
          title={`${currentMoveTool.label} (${currentMoveTool.shortcut})`}
        >
          <currentMoveTool.icon className="w-4 h-4 stroke-[2]" />
        </button>
        <button
          onClick={(e) => toggleDropdown('move', e)}
          className={`h-9 px-1 flex items-center justify-center rounded-r-lg transition-colors -ml-1 ${
            openDropdown === 'move'
              ? 'bg-[#e5e5ea] text-zinc-900 rounded-md'
              : isMoveActive
              ? 'text-[#0d99ff] hover:bg-blue-50'
              : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
          }`}
        >
          <ChevronDown className="w-3 h-3 stroke-[2.5]" />
        </button>

        {openDropdown === 'move' && (
          <div className="absolute bottom-full mb-2.5 left-0 bg-[#222222] text-white rounded-xl shadow-2xl py-1 px-1 min-w-[170px] border border-[#333333] z-50 text-xs">
            {moveTools.map((tool) => {
              const isChecked = selectedMoveTool === tool.id;
              const isBlueActive = isChecked && isMoveActive;
              const ToolIcon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => {
                    setSelectedMoveTool(tool.id as any);
                    applyMoveTool(tool.id);
                    setOpenDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                    isBlueActive
                      ? 'bg-[#0d99ff] text-white font-medium'
                      : 'text-white hover:bg-[#2c2c2c]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 flex items-center justify-center">
                      {isChecked && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                    </div>
                    <ToolIcon className="w-4 h-4 text-white" />
                    <span className="font-medium text-white">{tool.label}</span>
                  </div>
                  <span className={`font-mono text-[11px] ml-4 ${isBlueActive ? 'text-white' : 'text-zinc-400'}`}>
                    {tool.shortcut}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. FRAME TOOL GROUP */}
      <div className="relative flex items-center">
        <button
          onClick={() => {
            setSelectedFrameTool('frame');
            setActiveTool('frame');
          }}
          className={`h-9 px-2 flex items-center justify-center rounded-lg transition-colors ${
            isFrameActive
              ? 'bg-[#0d99ff] text-white'
              : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
          }`}
          title={`${currentFrameTool.label} (${currentFrameTool.shortcut})`}
        >
          <currentFrameTool.icon className="w-4 h-4 stroke-[2]" />
        </button>
        <button
          onClick={(e) => toggleDropdown('frame', e)}
          className={`h-9 px-1 flex items-center justify-center rounded-r-lg transition-colors -ml-1 ${
            openDropdown === 'frame'
              ? 'bg-[#e5e5ea] text-zinc-900 rounded-md'
              : isFrameActive
              ? 'text-[#0d99ff] hover:bg-blue-50'
              : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
          }`}
        >
          <ChevronDown className="w-3 h-3 stroke-[2.5]" />
        </button>

        {openDropdown === 'frame' && (
          <div className="absolute bottom-full mb-2.5 left-0 bg-[#222222] text-white rounded-xl shadow-2xl py-1 px-1 min-w-[170px] border border-[#333333] z-50 text-xs">
            {frameTools.map((tool) => {
              const isChecked = selectedFrameTool === tool.id;
              const isBlueActive = isChecked && isFrameActive;
              const ToolIcon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => {
                    setSelectedFrameTool(tool.id);
                    if (tool.id === 'frame') {
                      setActiveTool('frame');
                    } else if (tool.id === 'section') {
                      addNode('frame' as NodeType, {
                        name: 'Section 1',
                        cornerRadius: 12,
                        transform: { x: 200, y: 150, width: 440, height: 320, rotation: 0 },
                        fills: [{ id: createId('fill'), type: 'solid', color: '#1e293b', opacity: 0.8, visible: true }],
                      });
                      setActiveTool('select');
                    } else if (tool.id === 'slice') {
                      addNode('rect' as NodeType, {
                        name: 'Slice 1',
                        transform: { x: 200, y: 150, width: 240, height: 160, rotation: 0 },
                        fills: [],
                        strokes: [{ id: createId('stroke'), color: '#0d99ff', width: 1, dashPattern: [4, 4], visible: true }],
                      });
                      setActiveTool('select');
                    }
                    setOpenDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                    isBlueActive
                      ? 'bg-[#0d99ff] text-white font-medium'
                      : 'text-white hover:bg-[#2c2c2c]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 flex items-center justify-center">
                      {isChecked && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                    </div>
                    <ToolIcon className="w-4 h-4 text-white" />
                    <span className="font-medium text-white">{tool.label}</span>
                  </div>
                  <span className={`font-mono text-[11px] ml-4 ${isBlueActive ? 'text-white' : 'text-zinc-400'}`}>
                    {tool.shortcut}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. SHAPE TOOLS GROUP */}
      <div className="relative flex items-center">
        <button
          onClick={() => {
            if (selectedShapeTool === 'ellipse') {
              setActiveTool('ellipse');
            } else if (selectedShapeTool === 'line') {
              setActiveTool('line');
            } else if (selectedShapeTool === 'star') {
              setActiveTool('star');
            } else if (selectedShapeTool === 'polygon') {
              setActiveTool('polygon');
            } else {
              setActiveTool('rect');
            }
          }}
          className={`h-9 px-2 flex items-center justify-center rounded-lg transition-colors ${
            isShapeActive
              ? 'bg-[#0d99ff] text-white'
              : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
          }`}
          title={`${currentShapeTool.label} (${currentShapeTool.shortcut})`}
        >
          <currentShapeTool.icon className="w-4 h-4 stroke-[2]" />
        </button>
        <button
          onClick={(e) => toggleDropdown('shape', e)}
          className={`h-9 px-1 flex items-center justify-center rounded-r-lg transition-colors -ml-1 ${
            openDropdown === 'shape'
              ? 'bg-[#e5e5ea] text-zinc-900 rounded-md'
              : isShapeActive
              ? 'text-[#0d99ff] hover:bg-blue-50'
              : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
          }`}
        >
          <ChevronDown className="w-3 h-3 stroke-[2.5]" />
        </button>

        {openDropdown === 'shape' && (
          <div className="absolute bottom-full mb-2.5 left-0 bg-[#222222] text-white rounded-xl shadow-2xl py-1 px-1 min-w-[210px] border border-[#333333] z-50 text-xs">
            {shapeTools.map((tool) => {
              const isChecked = selectedShapeTool === tool.id;
              const isBlueActive = isChecked && isShapeActive;
              const ToolIcon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => {
                    setSelectedShapeTool(tool.id);
                    if (tool.id === 'rect') {
                      setActiveTool('rect');
                    } else if (tool.id === 'ellipse') {
                      setActiveTool('ellipse');
                    } else if (tool.id === 'line') {
                      setActiveTool('line');
                    } else if (tool.id === 'arrow') {
                      addNode('line' as NodeType, {
                        name: 'Arrow',
                        arrow: true,
                        transform: { x: 200, y: 200, width: 140, height: 0, rotation: 0 },
                        fills: [],
                        strokes: [
                          {
                            id: createId('stroke'),
                            color: '#e4e4e7',
                            width: 2,
                            align: 'center',
                            opacity: 1,
                            visible: true,
                          },
                        ],
                      });
                    } else if (tool.id === 'polygon') {
                      setActiveTool('polygon');
                    } else if (tool.id === 'star') {
                      setActiveTool('star');
                    } else if (tool.id === 'image') {
                      fileInputRef.current?.click();
                    }
                    setOpenDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                    isBlueActive
                      ? 'bg-[#0d99ff] text-white font-medium'
                      : 'text-white hover:bg-[#2c2c2c]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 flex items-center justify-center">
                      {isChecked && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                    </div>
                    <ToolIcon className="w-4 h-4 text-white" />
                    <span className="font-medium text-white">{tool.label}</span>
                  </div>
                  <span className={`font-mono text-[11px] ml-4 ${isBlueActive ? 'text-white' : 'text-zinc-400'}`}>
                    {tool.shortcut}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. PEN / DRAW TOOL GROUP */}
      <div className="relative flex items-center">
        <button
          onClick={() => applyDrawTool(selectedDrawTool)}
          className={`h-9 px-2 flex items-center justify-center rounded-lg transition-colors ${
            isDrawActive
              ? 'bg-[#0d99ff] text-white'
              : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
          }`}
          title={`${currentDrawTool.label} (${currentDrawTool.shortcut})`}
        >
          <currentDrawTool.icon className="w-4 h-4 stroke-[2]" />
        </button>
        <button
          onClick={(e) => toggleDropdown('draw', e)}
          className={`h-9 px-1 flex items-center justify-center rounded-r-lg transition-colors -ml-1 ${
            openDropdown === 'draw'
              ? 'bg-[#e5e5ea] text-zinc-900 rounded-md'
              : isDrawActive
              ? 'text-[#0d99ff] hover:bg-blue-50'
              : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
          }`}
        >
          <ChevronDown className="w-3 h-3 stroke-[2.5]" />
        </button>

        {openDropdown === 'draw' && (
          <div className="absolute bottom-full mb-2.5 left-0 bg-[#222222] text-white rounded-xl shadow-2xl py-1 px-1 min-w-[170px] border border-[#333333] z-50 text-xs">
            {drawTools.map((tool) => {
              const isSelected = selectedDrawTool === tool.id;
              const ToolIcon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => {
                    setSelectedDrawTool(tool.id);
                    applyDrawTool(tool.id);
                    setOpenDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#0d99ff] text-white font-medium'
                      : 'text-white hover:bg-[#2c2c2c]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 flex items-center justify-center">
                      {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                    </div>
                    <ToolIcon className="w-4 h-4 text-white" />
                    <span className="font-medium text-white">{tool.label}</span>
                  </div>
                  <span className={`font-mono text-[11px] ml-4 ${isSelected ? 'text-white' : 'text-zinc-400'}`}>
                    {tool.shortcut}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. TEXT TOOL */}
      <div className="relative flex items-center">
        <button
          onClick={() => setActiveTool('text')}
          className={`h-9 px-2 flex items-center justify-center rounded-lg transition-colors ${
            isTextActive
              ? 'bg-[#0d99ff] text-white'
              : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
          }`}
          title="Text (T)"
        >
          <Type className="w-4 h-4 stroke-[2]" />
        </button>
        <button
          onClick={() => setActiveTool('text')}
          className={`h-9 px-1 flex items-center justify-center rounded-r-lg transition-colors -ml-1 ${
            isTextActive
              ? 'text-[#0d99ff] hover:bg-blue-50'
              : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
          }`}
        >
          <ChevronDown className="w-3 h-3 stroke-[2.5]" />
        </button>
      </div>

      {/* 6. COMMENTS TOOL */}
      <button
        onClick={() => setCommentMode(!isCommentMode)}
        className={`h-9 w-9 flex items-center justify-center rounded-lg transition-colors ${
          isCommentMode
            ? 'bg-[#0d99ff] text-white'
            : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
        }`}
        title="Comments (C)"
      >
        <MessageCircle className="w-4 h-4 stroke-[2]" />
      </button>

      {/* 7. RESOURCES / COMPONENTS */}
      <button
        onClick={() => {
          setActiveTab('design');
          setLeftTab('assets');
        }}
        className="h-9 w-9 flex items-center justify-center rounded-lg text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
        title="Resources / Components (Shift+I)"
      >
        <LayoutGrid className="w-4 h-4 stroke-[2]" />
      </button>

      {/* DIVIDER */}
      <div className="w-px h-6 bg-zinc-200 mx-1.5" />

      {/* 8. RIGHT-SIDE ACTION BUTTONS */}
      {/* Freehand Draw */}
      <button
        onClick={() => {
          setSelectedDrawTool('pencil');
          setActiveTool('pencil');
        }}
        className={`h-9 w-9 flex items-center justify-center rounded-lg transition-colors ${
          activeTool === 'pencil'
            ? 'bg-[#0d99ff] text-white'
            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
        }`}
        title="Freehand Draw (Shift+P)"
      >
        <Pencil className="w-4 h-4 stroke-[2]" />
      </button>

      {/* Prototype Flow Mode */}
      <button
        onClick={() => {
          const next = activeTab !== 'prototype';
          setActiveTab(next ? 'prototype' : 'design');
          setPrototypeMode(next);
        }}
        className={`h-9 w-9 flex items-center justify-center rounded-lg transition-colors ${
          activeTab === 'prototype' || isPrototypeMode
            ? 'bg-blue-50 text-[#0d99ff] border border-blue-200'
            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
        }`}
        title="Prototype"
      >
        <Workflow className="w-4 h-4 stroke-[2]" />
      </button>

      {/* Component Symbol */}
      <button
        onClick={() => {
          if (selectedIds.length === 0) {
            setLeftTab('assets');
            return;
          }
          createComponentFromSelection();
          setLeftTab('assets');
        }}
        className="h-9 w-9 flex items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
        title="Create Component from selection (Ctrl+Alt+K)"
      >
        <Diamond className="w-4 h-4 stroke-[2]" />
      </button>

      {/* Dev Mode (Inspect) */}
      <button
        onClick={() => {
          setActiveTab(activeTab === 'inspect' ? 'design' : 'inspect');
        }}
        className={`h-9 w-9 flex items-center justify-center rounded-lg transition-colors ${
          activeTab === 'inspect'
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
        }`}
        title="Dev Mode / Inspect (</>)"
      >
        <Code2 className="w-4 h-4 stroke-[2]" />
      </button>
    </div>
  );
};

