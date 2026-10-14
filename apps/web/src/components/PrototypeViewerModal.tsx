import React, { useEffect } from 'react';
import { useEditorStore } from '../store/editorStore';
import { SceneNode } from '@figma-app/shared-types';
import { X, Play, ArrowLeft, RefreshCw, Smartphone } from 'lucide-react';

export const PrototypeViewerModal: React.FC = () => {
  const {
    document,
    isPrototypeMode,
    setPrototypeMode,
    activePrototypeFrameId,
    setActivePrototypeFrameId,
  } = useEditorStore();

  // Escape exits the presentation, as advertised by the close button tooltip
  useEffect(() => {
    if (!isPrototypeMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPrototypeMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPrototypeMode, setPrototypeMode]);

  if (!isPrototypeMode) return null;

  const allFrames = Object.values(document.nodes).filter((n) => n.type === 'frame');
  const activeFrame = activePrototypeFrameId
    ? document.nodes[activePrototypeFrameId]
    : allFrames[0];

  // Find children that belong to this frame
  const childNodes = activeFrame
    ? Object.values(document.nodes).filter((n) => n.parent === activeFrame.id)
    : [];

  const getChildrenOf = (parentId: string): SceneNode[] => {
    const parent = document.nodes[parentId];
    const explicit = (parent?.children || [])
      .map((id) => document.nodes[id])
      .filter((n): n is SceneNode => Boolean(n));
    const byParent = Object.values(document.nodes).filter((n) => n.parent === parentId);
    return Array.from(new Set([...explicit, ...byParent]));
  };

  const getBackground = (node: SceneNode): string => {
    const fill = node.fills?.find((f) => f.visible !== false);
    if (fill?.type === 'image' && fill.imageUrl) return `url(${fill.imageUrl}) center/cover no-repeat`;
    return fill?.color || 'transparent';
  };

  const renderLayerTree = (nodes: SceneNode[]): React.ReactNode =>
    nodes.map((child) => {
      if (!activeFrame || child.visible === false) return null;
      const stroke = child.strokes?.find((s) => s.visible !== false);
      const relativeX = child.transform.x - activeFrame.transform.x;
      const relativeY = child.transform.y - activeFrame.transform.y;

      return (
        <div
          key={child.id}
          style={{
            position: 'absolute',
            left: `${relativeX}px`,
            top: `${relativeY}px`,
            width: `${child.transform.width}px`,
            height: `${child.transform.height}px`,
            background: getBackground(child),
            border: stroke ? `${stroke.width}px solid ${stroke.color}` : undefined,
            borderRadius:
              typeof child.cornerRadius === 'number' ? `${child.cornerRadius}px` : undefined,
            opacity: typeof child.opacity === 'number' ? child.opacity : 1,
            transform: child.transform.rotation ? `rotate(${child.transform.rotation}deg)` : undefined,
          }}
          className={`transition-all hover:ring-2 hover:ring-blue-400/50 select-none ${
            child.type === 'text' ? '' : 'cursor-pointer'
          } flex items-center justify-center`}
          onClick={() => {
            // Interactive flow simulation: clicking a layer navigates to the next frame
            const otherFrames = allFrames.filter((f) => f.id !== activeFrame.id);
            if (otherFrames.length > 0) {
              setActivePrototypeFrameId(otherFrames[0].id);
            }
          }}
        >
          {child.type === 'text' ? (
            <span
              style={{
                fontSize: `${(child as any).fontSize || 14}px`,
                fontFamily: (child as any).fontFamily || 'Inter',
                fontWeight: (child as any).fontWeight || 400,
                textAlign: (child as any).textAlign || 'left',
                color: child.fills?.find((f) => f.visible !== false)?.color || '#ffffff',
                width: '100%',
              }}
              className="px-1"
            >
              {(child as any).content}
            </span>
          ) : (
            renderLayerTree(getChildrenOf(child.id))
          )}
        </div>
      );
    });

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col select-none">
      {/* Top Prototype Player Bar */}
      <div className="h-12 border-b border-zinc-800 bg-[#141416] flex items-center justify-between px-4 text-xs text-zinc-300">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-white">
            <Play className="w-3.5 h-3.5 text-blue-400 fill-current" />
            <span>Prototype Preview</span>
          </div>
          <span className="text-zinc-500">•</span>
          <span className="text-zinc-400 font-medium">
            {activeFrame?.name || 'Screen Flow'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {allFrames.length > 1 && (
            <div className="flex items-center gap-1 bg-[#202024] p-1 rounded-lg border border-zinc-800">
              {allFrames.map((frame) => (
                <button
                  key={frame.id}
                  onClick={() => setActivePrototypeFrameId(frame.id)}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                    frame.id === activeFrame?.id
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {frame.name}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setPrototypeMode(false)}
            className="p-1.5 rounded-lg bg-[#242428] hover:bg-[#2e2e34] text-zinc-300 hover:text-white transition-colors"
            title="Exit Prototype (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Screen Presentation Viewport */}
      {/* Rendered recursively so nested frame/group layers are presented too */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-[#0a0a0c]">
        {activeFrame ? (
          <div
            style={{
              width: activeFrame.transform.width,
              height: activeFrame.transform.height,
              backgroundColor:
                activeFrame.fills?.find((f) => f.visible !== false)?.color || '#ffffff',
            }}
            className="relative shadow-2xl rounded-2xl overflow-hidden border border-zinc-700/60 ring-1 ring-white/10"
          >
            {renderLayerTree(childNodes)}
          </div>
        ) : (
          <div className="text-center text-zinc-500 text-xs">
            No frames available to preview.
          </div>
        )}
      </div>
    </div>
  );
};
