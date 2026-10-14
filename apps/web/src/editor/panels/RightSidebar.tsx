import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import {
  Sliders,
  Plus,
  Trash2,
  Copy,
  Folder,
  Scissors,
  ClipboardPaste,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignHorizontalSpaceBetween,
  AlignVerticalSpaceBetween,
  Layers,
  Code2,
  Play,
  Check,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from 'lucide-react';
import { AlignmentType, DistributionType } from '@figma-app/editor-commands';
import { measureTextBounds } from '@figma-app/document-model';
import { generateNodeCss } from '../../services/cssGenerator';

export const RightSidebar: React.FC = () => {
  const {
    document,
    selectedIds,
    updateNode,
    deleteSelected,
    duplicateSelected,
    copySelected,
    cutSelected,
    groupSelected,
    alignSelected,
    distributeSelected,
    activeTab,
    setActiveTab,
    setPrototypeMode,
    setActivePrototypeFrameId,
  } = useEditorStore();

  const [copiedCss, setCopiedCss] = useState(false);

  const isMultiSelection = selectedIds.length > 1;
  const isSingleSelection = selectedIds.length === 1;
  const selectedNode = isSingleSelection ? document.nodes[selectedIds[0]] : null;

  const handleAlign = (alignment: AlignmentType) => {
    alignSelected(alignment);
  };

  const handleDistribute = (distribution: DistributionType) => {
    distributeSelected(distribution);
  };

  const handleCopyCss = (cssText: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(cssText);
      setCopiedCss(true);
      setTimeout(() => setCopiedCss(false), 1500);
    }
  };

  // Render Top Tab Switcher: Design | Prototype | Inspect
  const renderTabSwitcher = () => (
    <div className="flex items-center border-b border-[#27272a] bg-[#141416] text-[11px] font-medium px-2">
      <button
        onClick={() => setActiveTab('design')}
        className={`flex-1 py-2 text-center border-b-2 transition-colors ${
          activeTab === 'design'
            ? 'border-blue-500 text-white font-semibold'
            : 'border-transparent text-zinc-400 hover:text-zinc-200'
        }`}
      >
        Design
      </button>
      <button
        onClick={() => setActiveTab('prototype')}
        className={`flex-1 py-2 text-center border-b-2 transition-colors ${
          activeTab === 'prototype'
            ? 'border-blue-500 text-white font-semibold'
            : 'border-transparent text-zinc-400 hover:text-zinc-200'
        }`}
      >
        Prototype
      </button>
      <button
        onClick={() => setActiveTab('inspect')}
        className={`flex-1 py-2 text-center border-b-2 transition-colors ${
          activeTab === 'inspect'
            ? 'border-blue-500 text-white font-semibold'
            : 'border-transparent text-zinc-400 hover:text-zinc-200'
        }`}
      >
        Inspect
      </button>
    </div>
  );

  // Alignment Toolbar Component
  const renderAlignmentToolbar = () => (
    <div className="p-2 border-b border-[#27272a] bg-[#1a1a1e] flex items-center justify-between gap-1">
      <div className="flex items-center gap-0.5">
        {/* <button
          onClick={() => handleAlign('left')}
          disabled={selectedIds.length < 2}
          title="Align Left"
          className="p-1.5 rounded hover:bg-[#27272a] text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <AlignStartHorizontal className="w-3.5 h-3.5" />
        </button> */}
        <button
          onClick={() => handleAlign('left')}
          disabled={selectedIds.length < 1}
          title="Align Left"
          className="p-1.5 rounded hover:bg-[#27272a] text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <AlignStartHorizontal className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleAlign('center')}
          disabled={selectedIds.length < 1}
          title="Align Horizontal Center"
          className="p-1.5 rounded hover:bg-[#27272a] text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <AlignCenterHorizontal className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleAlign('right')}
          disabled={selectedIds.length < 1}
          title="Align Right"
          className="p-1.5 rounded hover:bg-[#27272a] text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <AlignEndHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-3 w-px bg-zinc-800" />

      <div className="flex items-center gap-0.5">
        <button
          onClick={() => handleAlign('top')}
          disabled={selectedIds.length < 1}
          title="Align Top"
          className="p-1.5 rounded hover:bg-[#27272a] text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <AlignStartVertical className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleAlign('middle')}
          disabled={selectedIds.length < 1}
          title="Align Vertical Middle"
          className="p-1.5 rounded hover:bg-[#27272a] text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <AlignCenterVertical className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleAlign('bottom')}
          disabled={selectedIds.length < 1}
          title="Align Bottom"
          className="p-1.5 rounded hover:bg-[#27272a] text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <AlignEndVertical className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-3 w-px bg-zinc-800" />

      <div className="flex items-center gap-0.5">
        <button
          onClick={() => handleDistribute('horizontal')}
          disabled={selectedIds.length < 3}
          title="Distribute Horizontal Spacing"
          className="p-1.5 rounded hover:bg-[#27272a] text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <AlignHorizontalSpaceBetween className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleDistribute('vertical')}
          disabled={selectedIds.length < 3}
          title="Distribute Vertical Spacing"
          className="p-1.5 rounded hover:bg-[#27272a] text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <AlignVerticalSpaceBetween className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  // Prototype Tab Content
  const renderPrototypeTab = () => {
    const allFrames = Object.values(document.nodes).filter((n) => n.type === 'frame');

    return (
      <div className="p-3 flex flex-col gap-4 text-xs text-zinc-300">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-zinc-200">Prototype Flows</span>
          <button
            onClick={() => {
              if (selectedNode && selectedNode.type === 'frame') {
                setActivePrototypeFrameId(selectedNode.id);
                setPrototypeMode(true);
              } else if (allFrames.length > 0) {
                setActivePrototypeFrameId(allFrames[0].id);
                setPrototypeMode(true);
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium shadow-sm"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Present</span>
          </button>
        </div>

        <div className="p-2.5 rounded-lg bg-[#202024] border border-zinc-800 flex flex-col gap-2">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Flow Starting Point
          </span>
          <select
            value={selectedNode?.type === 'frame' ? selectedNode.id : allFrames[0]?.id || ''}
            onChange={(e) => setActivePrototypeFrameId(e.target.value)}
            className="bg-[#18181b] border border-zinc-700 rounded p-1.5 text-zinc-200 outline-none text-xs"
          >
            {allFrames.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-zinc-500">
            Select the screen where users begin testing interactive flows.
          </p>
        </div>

        {selectedNode && (
          <div className="p-2.5 rounded-lg bg-[#202024] border border-zinc-800 flex flex-col gap-2">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Trigger & Transition
            </span>
            <div className="flex items-center justify-between text-zinc-300 text-[11px]">
              <span>Event</span>
              <span className="font-mono bg-zinc-800 px-1.5 py-0.5 rounded">On Click</span>
            </div>
            <div className="flex items-center justify-between text-zinc-300 text-[11px]">
              <span>Action</span>
              <span className="font-mono bg-zinc-800 px-1.5 py-0.5 rounded">Navigate To</span>
            </div>
            <div className="flex items-center justify-between text-zinc-300 text-[11px]">
              <span>Animation</span>
              <span className="font-mono bg-zinc-800 px-1.5 py-0.5 rounded">Instant (0ms)</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Inspect Tab Content (Developer Handoff)
  const renderInspectTab = () => {
    if (!selectedNode) {
      return (
        <div className="p-4 text-center text-zinc-500 text-xs mt-8">
          Select an element to inspect CSS styles and design measurements.
        </div>
      );
    }

    const { styles, cssString } = generateNodeCss(selectedNode);

    return (
      <div className="p-3 flex flex-col gap-3 text-xs text-zinc-300">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
            <Code2 className="w-4 h-4 text-blue-400" />
            <span>CSS Code</span>
          </span>
          <button
            onClick={() => handleCopyCss(cssString)}
            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-[#27272a] hover:bg-[#323238] text-zinc-200"
          >
            {copiedCss ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <pre className="bg-[#121214] p-2.5 rounded border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto select-text leading-relaxed">
          {cssString}
        </pre>

        <div className="mt-2 flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Computed Values
          </span>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            {Object.entries(styles).map(([prop, val]) => (
              <div key={prop} className="bg-[#202024] p-1.5 rounded border border-zinc-800/80">
                <span className="text-zinc-500 font-mono block">{prop}</span>
                <span className="text-zinc-200 font-medium truncate block">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (selectedIds.length === 0) {
    return (
      <aside className="w-72 border-l border-[#27272a] bg-[#18181b] flex flex-col h-full text-xs text-zinc-400 select-none z-10">
        {renderTabSwitcher()}
        {activeTab === 'prototype' ? (
          renderPrototypeTab()
        ) : activeTab === 'inspect' ? (
          renderInspectTab()
        ) : (
          <div className="text-center mt-12 flex flex-col items-center gap-2 p-4">
            <Sliders className="w-8 h-8 text-zinc-600" />
            <p className="font-medium text-zinc-300">No element selected</p>
            <p className="text-[11px] text-zinc-500 max-w-[180px]">
              Select a frame, shape, or text layer to inspect and edit its design properties.
            </p>
          </div>
        )}
      </aside>
    );
  }

  if (isMultiSelection) {
    return (
      <aside className="w-72 border-l border-[#27272a] bg-[#18181b] flex flex-col h-full overflow-y-auto text-xs text-zinc-300 select-none z-10">
        {renderTabSwitcher()}
        {activeTab === 'prototype' ? (
          renderPrototypeTab()
        ) : activeTab === 'inspect' ? (
          renderInspectTab()
        ) : (
          <>
            {renderAlignmentToolbar()}
            <div className="p-3 border-b border-[#27272a] flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-zinc-100 text-xs">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>{selectedIds.length} Layers Selected</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={groupSelected}
                  className="p-1 hover:bg-[#27272a] rounded text-zinc-400 hover:text-white"
                  title="Group Selection (Ctrl+G)"
                >
                  <Folder className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={copySelected}
                  className="p-1 hover:bg-[#27272a] rounded text-zinc-400 hover:text-white"
                  title="Copy (Ctrl+C)"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={cutSelected}
                  className="p-1 hover:bg-[#27272a] rounded text-zinc-400 hover:text-white"
                  title="Cut (Ctrl+X)"
                >
                  <Scissors className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={duplicateSelected}
                  className="p-1 hover:bg-[#27272a] rounded text-zinc-400 hover:text-white"
                  title="Duplicate Selection (Ctrl+D)"
                >
                  <Copy className="w-3.5 h-3.5 text-blue-400" />
                </button>
                <button
                  onClick={deleteSelected}
                  className="p-1 hover:bg-[#27272a] rounded text-zinc-400 hover:text-rose-400"
                  title="Delete Selection (Del)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-3 border-b border-[#27272a]/60 flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Alignment & Distribution
              </span>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Use the alignment controls at the top to align edges or distribute spacing evenly across selected layers.
              </p>
            </div>

            <div className="p-3 flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Selected Items
              </span>
              <div className="flex flex-col gap-1 max-h-60 overflow-y-auto pr-1">
                {selectedIds.map((id) => {
                  const node = document.nodes[id];
                  if (!node) return null;
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between px-2 py-1.5 rounded bg-[#202024] border border-zinc-800 text-[11px]"
                    >
                      <span className="truncate text-zinc-200">{node.name}</span>
                      <span className="text-zinc-500 uppercase text-[10px] ml-2 font-mono">
                        {node.type}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </aside>
    );
  }

  if (!selectedNode) return null;

  const { transform, fills, strokes, type, cornerRadius } = selectedNode;

  return (
    <aside className="w-72 border-l border-[#27272a] bg-[#18181b] flex flex-col h-full overflow-y-auto text-xs text-zinc-300 select-none z-10">
      {renderTabSwitcher()}

      {activeTab === 'prototype' ? (
        renderPrototypeTab()
      ) : activeTab === 'inspect' ? (
        renderInspectTab()
      ) : (
        <>
          {renderAlignmentToolbar()}
          <div className="p-3 border-b border-[#27272a] flex items-center justify-between gap-2">
            <span className="font-semibold text-zinc-100 uppercase text-[11px] tracking-wider">
              {type}
            </span>
            <div className="flex items-center gap-1 min-w-0">
              <input
                type="text"
                value={selectedNode.name}
                onChange={(e) => updateNode(selectedNode.id, { name: e.target.value })}
                className="bg-transparent hover:bg-[#27272a] focus:bg-[#27272a] px-1.5 py-0.5 rounded text-right outline-none text-zinc-300 focus:text-white min-w-0"
              />
              <button
                onClick={() => updateNode(selectedNode.id, { visible: !selectedNode.visible })}
                className={`p-1 rounded hover:bg-[#27272a] ${
                  selectedNode.visible ? 'text-zinc-400 hover:text-white' : 'text-amber-400'
                }`}
                title={selectedNode.visible ? 'Hide layer' : 'Show layer'}
              >
                {selectedNode.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => updateNode(selectedNode.id, { locked: !selectedNode.locked })}
                className={`p-1 rounded hover:bg-[#27272a] ${
                  selectedNode.locked ? 'text-amber-400' : 'text-zinc-400 hover:text-white'
                }`}
                title={selectedNode.locked ? 'Unlock layer' : 'Lock layer'}
              >
                {selectedNode.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-3 border-b border-[#27272a]/60 flex flex-col gap-2">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Layout & Transform
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center bg-[#202024] rounded border border-zinc-800 px-2 py-1">
                <span className="text-zinc-500 mr-2 font-mono text-[11px]">X</span>
                <input
                  type="number"
                  value={Math.round(transform.x)}
                  onChange={(e) =>
                    updateNode(selectedNode.id, {
                      transform: { ...transform, x: parseFloat(e.target.value) || 0 },
                    })
                  }
                  className="bg-transparent w-full outline-none font-mono text-zinc-200"
                />
              </div>
              <div className="flex items-center bg-[#202024] rounded border border-zinc-800 px-2 py-1">
                <span className="text-zinc-500 mr-2 font-mono text-[11px]">Y</span>
                <input
                  type="number"
                  value={Math.round(transform.y)}
                  onChange={(e) =>
                    updateNode(selectedNode.id, {
                      transform: { ...transform, y: parseFloat(e.target.value) || 0 },
                    })
                  }
                  className="bg-transparent w-full outline-none font-mono text-zinc-200"
                />
              </div>
              <div className="flex items-center bg-[#202024] rounded border border-zinc-800 px-2 py-1">
                <span className="text-zinc-500 mr-2 font-mono text-[11px]">W</span>
                <input
                  type="number"
                  value={Math.round(transform.width)}
                  onChange={(e) =>
                    updateNode(selectedNode.id, {
                      transform: { ...transform, width: Math.max(1, parseFloat(e.target.value) || 1) },
                    })
                  }
                  className="bg-transparent w-full outline-none font-mono text-zinc-200"
                />
              </div>
              <div className="flex items-center bg-[#202024] rounded border border-zinc-800 px-2 py-1">
                <span className="text-zinc-500 mr-2 font-mono text-[11px]">H</span>
                <input
                  type="number"
                  value={Math.round(transform.height)}
                  onChange={(e) =>
                    updateNode(selectedNode.id, {
                      transform: { ...transform, height: Math.max(1, parseFloat(e.target.value) || 1) },
                    })
                  }
                  className="bg-transparent w-full outline-none font-mono text-zinc-200"
                />
              </div>
            </div>

            {(type === 'rect' || type === 'frame' || type === 'component' || type === 'instance') && (
              <div className="flex items-center bg-[#202024] rounded border border-zinc-800 px-2 py-1 mt-1">
                <span className="text-zinc-500 mr-2 text-[11px]">Radius</span>
                <input
                  type="number"
                  value={typeof cornerRadius === 'number' ? cornerRadius : 0}
                  onChange={(e) =>
                    updateNode(selectedNode.id, {
                      cornerRadius: Math.max(0, parseFloat(e.target.value) || 0),
                    })
                  }
                  className="bg-transparent w-full outline-none font-mono text-zinc-200"
                />
              </div>
            )}
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center bg-[#202024] rounded border border-zinc-800 px-2 py-1 flex-1">
                <span className="text-zinc-500 mr-2 text-[11px]">Rotate</span>
                <input
                  type="number"
                  value={Math.round(transform.rotation || 0)}
                  onChange={(e) =>
                    updateNode(selectedNode.id, {
                      transform: { ...transform, rotation: parseFloat(e.target.value) || 0 },
                    })
                  }
                  className="bg-transparent w-full outline-none font-mono text-zinc-200"
                />
              </div>
            </div>
          </div>

          <div className="p-3 border-b border-[#27272a]/60 flex flex-col gap-2">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Appearance
            </span>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#202024] rounded border border-zinc-800 px-2 py-1 flex-1">
                <span className="text-zinc-500 mr-2 text-[11px]">Opacity</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={Math.round((selectedNode.opacity ?? 1) * 100)}
                  onChange={(e) =>
                    updateNode(selectedNode.id, {
                      opacity: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) / 100,
                    })
                  }
                  className="bg-transparent w-full outline-none font-mono text-zinc-200"
                />
                <span className="text-zinc-500 text-[11px]">%</span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round((selectedNode.opacity ?? 1) * 100)}
              onChange={(e) =>
                updateNode(selectedNode.id, { opacity: parseFloat(e.target.value) / 100 })
              }
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {type === 'text' && (
            <div className="p-3 border-b border-[#27272a]/60 flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Typography
              </span>
              {/*
              <textarea
                value={(selectedNode as any).content || ''}
                onChange={(e) =>
                  updateNode(selectedNode.id, { content: e.target.value } as any)
                }
                className="bg-[#202024] border border-zinc-800 rounded p-2 outline-none font-sans text-xs text-white resize-none h-16"
              />
              */}
              <textarea
                value={(selectedNode as any).content || ''}
                onChange={(e) => {
                  const newContent = e.target.value;
                  const fontSize = (selectedNode as any).fontSize || 16;
                  const fontFamily = (selectedNode as any).fontFamily || 'Inter';
                  const fontWeight = (selectedNode as any).fontWeight || 500;
                  const bounds = measureTextBounds(newContent, fontSize, fontFamily, fontWeight);
                  updateNode(selectedNode.id, {
                    content: newContent,
                    transform: {
                      ...selectedNode.transform,
                      width: bounds.width,
                      height: bounds.height,
                    },
                  } as any);
                }}
                className="bg-[#202024] border border-zinc-800 rounded p-2 outline-none font-sans text-xs text-white resize-none h-16"
              />
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-[#202024] rounded border border-zinc-800 px-2 py-1 flex-1">
                  <span className="text-zinc-500 mr-2 text-[11px]">Size</span>
                  {/*
                  <input
                    type="number"
                    value={(selectedNode as any).fontSize || 16}
                    onChange={(e) =>
                      updateNode(selectedNode.id, {
                        fontSize: Math.max(8, parseFloat(e.target.value) || 16),
                      } as any)
                    }
                    className="bg-transparent w-full outline-none font-mono text-zinc-200"
                  />
                  */}
                  <input
                    type="number"
                    value={(selectedNode as any).fontSize || 16}
                    onChange={(e) => {
                      const newSize = Math.max(8, parseFloat(e.target.value) || 16);
                      const content = (selectedNode as any).content || 'Text';
                      const fontFamily = (selectedNode as any).fontFamily || 'Inter';
                      const fontWeight = (selectedNode as any).fontWeight || 500;
                      const bounds = measureTextBounds(content, newSize, fontFamily, fontWeight);
                      updateNode(selectedNode.id, {
                        fontSize: newSize,
                        transform: {
                          ...selectedNode.transform,
                          width: bounds.width,
                          height: bounds.height,
                        },
                      } as any);
                    }}
                    className="bg-transparent w-full outline-none font-mono text-zinc-200"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={(selectedNode as any).fontFamily || 'Inter'}
                  onChange={(e) =>
                    updateNode(selectedNode.id, { fontFamily: e.target.value } as any)
                  }
                  className="bg-[#202024] border border-zinc-800 rounded px-2 py-1 flex-1 outline-none text-zinc-200"
                >
                  {['Inter', 'Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana'].map(
                    (font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    )
                  )}
                </select>
                <select
                  value={String((selectedNode as any).fontWeight || 500)}
                  onChange={(e) =>
                    updateNode(selectedNode.id, { fontWeight: e.target.value } as any)
                  }
                  className="bg-[#202024] border border-zinc-800 rounded px-2 py-1 w-24 outline-none text-zinc-200"
                >
                  {['300', '400', '500', '600', '700', '800'].map((weight) => (
                    <option key={weight} value={weight}>
                      {weight}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 bg-[#202024] border border-zinc-800 rounded p-0.5">
                {([
                  { id: 'left', Icon: AlignLeft },
                  { id: 'center', Icon: AlignCenter },
                  { id: 'right', Icon: AlignRight },
                  { id: 'justify', Icon: AlignJustify },
                ] as const).map(({ id: alignId, Icon }) => (
                  <button
                    key={alignId}
                    onClick={() => updateNode(selectedNode.id, { textAlign: alignId } as any)}
                    title={`Align ${alignId}`}
                    className={`p-1.5 rounded flex-1 flex items-center justify-center transition-colors ${
                      ((selectedNode as any).textAlign || 'left') === alignId
                        ? 'bg-blue-600 text-white'
                        : 'text-zinc-400 hover:bg-[#27272a] hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-[#202024] rounded border border-zinc-800 px-2 py-1 flex-1">
                  <span className="text-zinc-500 mr-2 text-[11px]">Line</span>
                  <input
                    type="number"
                    step={0.1}
                    value={(selectedNode as any).lineHeight ?? 1.4}
                    onChange={(e) =>
                      updateNode(selectedNode.id, {
                        lineHeight: parseFloat(e.target.value) || 1.4,
                      } as any)
                    }
                    className="bg-transparent w-full outline-none font-mono text-zinc-200"
                  />
                </div>
                <div className="flex items-center bg-[#202024] rounded border border-zinc-800 px-2 py-1 flex-1">
                  <span className="text-zinc-500 mr-2 text-[11px]">Letter</span>
                  <input
                    type="number"
                    step={0.1}
                    value={(selectedNode as any).letterSpacing ?? 0}
                    onChange={(e) =>
                      updateNode(selectedNode.id, {
                        letterSpacing: parseFloat(e.target.value) || 0,
                      } as any)
                    }
                    className="bg-transparent w-full outline-none font-mono text-zinc-200"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="p-3 border-b border-[#27272a]/60 flex flex-col gap-2">
            {/* <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Fill
            </span> */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Fill
              </span>
              <button
                onClick={() =>
                  updateNode(selectedNode.id, {
                    fills: [
                      ...fills,
                      { id: `f_${Date.now()}`, type: 'solid', color: '#3b82f6', opacity: 1, visible: true },
                    ],
                  })
                }
                className="hover:text-white"
                title="Add Fill"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {fills.map((fill, index) => (
              <div
                className="flex items-center gap-2 bg-[#202024] p-1.5 rounded border border-zinc-800"
                key={fill.id || index}
              >
                <input
                  type="color"
                  value={fill.color || '#ffffff'}
                  onChange={(e) => {
                    const n = [...fills];
                    n[index] = { ...fill, color: e.target.value };
                    updateNode(selectedNode.id, { fills: n });
                  }}
                  className="w-6 h-6 rounded border border-zinc-700 bg-transparent cursor-pointer p-0"
                />
                <input
                  type="text"
                  value={fill.color || '#ffffff'}
                  onChange={(e) => {
                    const n = [...fills];
                    n[index] = { ...fill, color: e.target.value };
                    updateNode(selectedNode.id, { fills: n });
                  }}
                  className="bg-transparent font-mono text-[11px] w-20 outline-none uppercase text-zinc-200"
                />
                <button
                  onClick={() => {
                    const n = [...fills];
                    n[index] = { ...fill, visible: fill.visible === false };
                    updateNode(selectedNode.id, { fills: n });
                  }}
                  className={`ml-auto p-1 hover:text-white ${
                    fill.visible === false ? 'text-amber-400' : 'text-zinc-500'
                  }`}
                  title={fill.visible === false ? 'Show fill' : 'Hide fill'}
                >
                  {fill.visible === false ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
                <button
                  onClick={() =>
                    updateNode(selectedNode.id, { fills: fills.filter((_, i) => i !== index) })
                  }
                  className="p-1 text-zinc-500 hover:text-rose-400"
                  title="Remove fill"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Stroke
              </span>
              <button
                onClick={() =>
                  updateNode(selectedNode.id, {
                    strokes: [
                      ...strokes,
                      { id: `s_${Date.now()}`, color: '#38bdf8', width: 1, visible: true },
                    ],
                  })
                }
                className="hover:text-white"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {strokes.map((stroke, index) => (
              <div
                key={stroke.id || index}
                className="flex items-center gap-2 bg-[#202024] p-1.5 rounded border border-zinc-800"
              >
                <input
                  type="color"
                  value={stroke.color}
                  onChange={(e) => {
                    const n = [...strokes];
                    n[index] = { ...stroke, color: e.target.value };
                    updateNode(selectedNode.id, { strokes: n });
                  }}
                  className="w-6 h-6 rounded border border-zinc-700 bg-transparent cursor-pointer p-0"
                />
                <input
                  type="number"
                  value={stroke.width}
                  onChange={(e) => {
                    const n = [...strokes];
                    n[index] = {
                      ...stroke,
                      width: Math.max(1, parseFloat(e.target.value) || 1),
                    };
                    updateNode(selectedNode.id, { strokes: n });
                  }}
                  className="bg-transparent font-mono text-[11px] w-12 outline-none text-zinc-200"
                />
                <button
                  onClick={() =>
                    updateNode(selectedNode.id, {
                      strokes: strokes.filter((_, i) => i !== index),
                    })
                  }
                  className="hover:text-rose-400 ml-auto p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </aside>
  );
};
