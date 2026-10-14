import React, { useState, useEffect, useRef } from 'react';
import { useEditorStore } from '../../store/editorStore';
import {
  Layers,
  FileText,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Square,
  Circle,
  Type,
  Layout,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  BringToFront,
  SendToBack,
  Folder,
  FolderOpen,
  Scissors,
  ClipboardPaste,
  ChevronRight,
  ChevronDown,
  Edit2,
  Star,
  Triangle,
  Minus,
} from 'lucide-react';
import { NodeType, ID } from '@figma-app/shared-types';

/*
Original LeftSidebar implementation:
export const LeftSidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'layers' | 'assets'>('layers');
  const {
    document,
    activePageId,
    selectedIds,
    setSelectedIds,
    toggleSelectId,
    updateNode,
    deleteSelected,
    duplicateSelected,
    copySelected,
    cutSelected,
    pasteClipboard,
    groupSelected,
    ungroupSelected,
    moveLayer,
    selectPage,
    addPage,
  } = useEditorStore();

  const activePage = document.pages[activePageId];
  const nodeIds = activePage ? activePage.children : [];
  ...
}
*/

export const LeftSidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'layers' | 'assets'>('layers');
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingNodeName, setEditingNodeName] = useState<string>('');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingPageName, setEditingPageName] = useState<string>('');
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<'before' | 'after' | 'inside'>('after');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);

  const editInputRef = useRef<HTMLInputElement>(null);
  const pageInputRef = useRef<HTMLInputElement>(null);

  const {
    document,
    activePageId,
    selectedIds,
    setSelectedIds,
    toggleSelectId,
    updateNode,
    batchUpdateNodes,
    deleteSelected,
    duplicateSelected,
    copySelected,
    cutSelected,
    pasteClipboard,
    groupSelected,
    ungroupSelected,
    moveLayer,
    selectPage,
    addPage,
    renamePage,
    deletePage,
    reorderLayers,
  } = useEditorStore();

  const activePage = document.pages[activePageId];
  const nodeIds = activePage ? activePage.children : [];

  useEffect(() => {
    const handleGlobalClick = () => {
      setContextMenu(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  useEffect(() => {
    if (editingNodeId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingNodeId]);

  useEffect(() => {
    if (editingPageId && pageInputRef.current) {
      pageInputRef.current.focus();
      pageInputRef.current.select();
    }
  }, [editingPageId]);

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStartRenameNode = (id: string, currentName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingNodeId(id);
    setEditingNodeName(currentName);
  };

  const handleCommitRenameNode = (id: string) => {
    const trimmed = editingNodeName.trim();
    if (trimmed && trimmed !== document.nodes[id]?.name) {
      updateNode(id, { name: trimmed });
    }
    setEditingNodeId(null);
  };

  const handleStartRenamePage = (pageId: string, currentName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingPageId(pageId);
    setEditingPageName(currentName);
  };

  const handleCommitRenamePage = (pageId: string) => {
    const trimmed = editingPageName.trim();
    if (trimmed && trimmed !== document.pages[pageId]?.name) {
      renamePage(pageId, trimmed);
    }
    setEditingPageId(null);
  };

  /*
  const getNodeIcon = (type: NodeType) => {
    switch (type) {
      case 'frame':
        return <Layout className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
      case 'group':
        return <Folder className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
      case 'rect':
        return <Square className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
      case 'ellipse':
        return <Circle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'text':
        return <Type className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
    }
  };
  */
  const getNodeIcon = (type: NodeType) => {
    switch (type) {
      case 'frame':
        return <Layout className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
      case 'group':
        return <Folder className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
      case 'rect':
        return <Square className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
      case 'ellipse':
        return <Circle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'text':
        return <Type className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'star':
        return <Star className="w-3.5 h-3.5 text-amber-300 shrink-0" />;
      case 'polygon':
        return <Triangle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
      case 'line':
        return <Minus className="w-3.5 h-3.5 text-blue-300 shrink-0" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
    }
  };

  const selectedPrimaryId = selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null;

  /*
  const getChildrenOf = (parentId: string): string[] => {
    const parentNode = document.nodes[parentId];
    const explicit = (parentNode?.children || []).filter((id) => document.nodes[id]);
    const byParentProp = Object.keys(document.nodes).filter(
      (id) => document.nodes[id]?.parent === parentId
    );
    const combined = Array.from(new Set([...explicit, ...byParentProp]));
    return combined;
  };
  */
  // Build tree hierarchy: identify children belonging to each frame/group
  const getChildrenOf = (parentId: string): string[] => {
    const parentNode = document.nodes[parentId];
    const explicit = (parentNode?.children || []).filter((id) => document.nodes[id]);
    const byParentProp = Object.keys(document.nodes).filter(
      (id) => document.nodes[id]?.parent === parentId
    );
    const combined = Array.from(new Set([...explicit, ...byParentProp]));
    const childList = parentNode?.children || [];
    return combined.sort((a, b) => {
      const idxA = childList.indexOf(a);
      const idxB = childList.indexOf(b);
      return idxB - idxA;
    });
  };

  // Flattened list of all visible nodes in the tree (for Shift-click range selection)
  const getVisibleTreeIds = (): string[] => {
    const result: string[] = [];
    const traverse = (ids: string[]) => {
      ids.forEach((id) => {
        result.push(id);
        if (!collapsedIds.has(id)) {
          traverse(getChildrenOf(id));
        }
      });
    };
    traverse(rootNodeIds);
    return result;
  };

  // Get all descendant IDs of a folder/frame recursively
  const getAllDescendantIds = (parentId: string): string[] => {
    const descendants: string[] = [];
    const collect = (id: string) => {
      const children = getChildrenOf(id);
      children.forEach((childId) => {
        descendants.push(childId);
        collect(childId);
      });
    };
    collect(parentId);
    return descendants;
  };

  /*
  const toggleVisibility = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const node = document.nodes[id];
    if (!node) return;
    const targetVisibility = !node.visible;
    const descendants = getAllDescendantIds(id);
    if (descendants.length > 0) {
      const updates = [
        { id, newProps: { visible: targetVisibility }, prevProps: { visible: node.visible } },
        ...descendants.map((childId) => ({
          id: childId,
          newProps: { visible: targetVisibility },
          prevProps: { visible: document.nodes[childId]?.visible ?? true },
        })),
      ];
      batchUpdateNodes(updates);
    } else {
      updateNode(id, { visible: targetVisibility });
    }
  };

  const toggleLock = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const node = document.nodes[id];
    if (!node) return;
    const targetLocked = !node.locked;
    const descendants = getAllDescendantIds(id);
    if (descendants.length > 0) {
      const updates = [
        { id, newProps: { locked: targetLocked }, prevProps: { locked: node.locked } },
        ...descendants.map((childId) => ({
          id: childId,
          newProps: { locked: targetLocked },
          prevProps: { locked: document.nodes[childId]?.locked ?? false },
        })),
      ];
      batchUpdateNodes(updates);
    } else {
      updateNode(id, { locked: targetLocked });
    }
  };
  */
  const toggleVisibility = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const node = document.nodes[id];
    if (!node) return;
    updateNode(id, { visible: !node.visible });
  };

  const toggleLock = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const node = document.nodes[id];
    if (!node) return;
    updateNode(id, { locked: !node.locked });
  };

  const isInheritedHidden = (id: string): boolean => {
    let curr = document.nodes[id];
    while (curr?.parent && document.nodes[curr.parent]) {
      if (!document.nodes[curr.parent].visible) return true;
      curr = document.nodes[curr.parent];
    }
    return false;
  };

  const isInheritedLocked = (id: string): boolean => {
    let curr = document.nodes[id];
    while (curr?.parent && document.nodes[curr.parent]) {
      if (document.nodes[curr.parent].locked) return true;
      curr = document.nodes[curr.parent];
    }
    return false;
  };

  // Root node IDs (not parented to any other node currently on page)
  const rootNodeIds = Object.keys(document.nodes)
    .filter((id) => {
      const node = document.nodes[id];
      if (!node) return false;
      if (node.parent && document.nodes[node.parent]) return false;
      return nodeIds.includes(id) || !node.parent;
    })
    .sort((a, b) => {
      const idxA = nodeIds.indexOf(a);
      const idxB = nodeIds.indexOf(b);
      return idxB - idxA;
    });

  const renderNodeRow = (id: string, depth = 0) => {
    const node = document.nodes[id];
    if (!node) return null;

    const children = getChildrenOf(id);
    const hasChildren = children.length > 0;
    const isCollapsed = collapsedIds.has(id);
    const isSelected = selectedIds.includes(id);
    const isEditing = editingNodeId === id;
    const isDragOver = dragOverNodeId === id;

    return (
      <div key={id} className="flex flex-col">
        <div
          draggable={!isEditing}
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', id);
            setDraggedNodeId(id);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const rect = e.currentTarget.getBoundingClientRect();
            const relY = e.clientY - rect.top;
            let pos: 'before' | 'after' | 'inside' = 'after';
            if (node.type === 'group' && relY > 5 && relY < rect.height - 5) {
              pos = 'inside';
            } else if (relY < rect.height / 2) {
              pos = 'before';
            } else {
              pos = 'after';
            }
            if (dragOverNodeId !== id) setDragOverNodeId(id);
            setDragPosition(pos);
          }}
          onDragLeave={() => {
            if (dragOverNodeId === id) setDragOverNodeId(null);
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (draggedNodeId && draggedNodeId !== id) {
              reorderLayers(draggedNodeId, id, dragPosition);
            }
            setDraggedNodeId(null);
            setDragOverNodeId(null);
          }}
          onClick={(e) => {
            if (isEditing) return;
            if (e.ctrlKey || e.metaKey) {
              toggleSelectId(id);
            } else if (e.shiftKey && selectedIds.length > 0) {
              const visibleIds = getVisibleTreeIds();
              const lastId = selectedIds[selectedIds.length - 1];
              const fromIdx = visibleIds.indexOf(lastId);
              const toIdx = visibleIds.indexOf(id);
              if (fromIdx !== -1 && toIdx !== -1) {
                const start = Math.min(fromIdx, toIdx);
                const end = Math.max(fromIdx, toIdx);
                const range = visibleIds.slice(start, end + 1);
                setSelectedIds(Array.from(new Set([...selectedIds, ...range])));
              } else {
                toggleSelectId(id);
              }
            } else {
              setSelectedIds([id]);
            }
          }}
          onDoubleClick={(e) => {
            handleStartRenameNode(id, node.name, e);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            if (!isSelected) setSelectedIds([id]);
            setContextMenu({ x: e.clientX, y: e.clientY, nodeId: id });
          }}
          style={{ paddingLeft: `${depth * 14 + 6}px` }}
          className={`group relative flex items-center justify-between pr-2 py-1 rounded-md cursor-pointer transition-colors ${
            isDragOver
              ? dragPosition === 'inside'
                ? 'ring-2 ring-blue-500 bg-blue-500/20 text-white'
                : dragPosition === 'before'
                ? 'border-t-2 border-blue-500 bg-blue-500/10'
                : 'border-b-2 border-blue-500 bg-blue-500/10'
              : ''
          } ${
            isSelected
              ? 'bg-blue-600 text-white font-medium'
              : 'hover:bg-[#242429] text-zinc-300'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate flex-1 min-w-0 mr-1.5">
            {/* Collapse / Expand Chevron */}
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleCollapse(id, e)}
                className="p-0.5 hover:text-white rounded shrink-0 text-zinc-400"
                title={isCollapsed ? 'Expand' : 'Collapse'}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            ) : (
              <span className="w-4 shrink-0" />
            )}

            {getNodeIcon(node.type)}

            {isEditing ? (
              <input
                ref={editInputRef}
                value={editingNodeName}
                onChange={(e) => setEditingNodeName(e.target.value)}
                onBlur={() => handleCommitRenameNode(id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCommitRenameNode(id);
                  if (e.key === 'Escape') setEditingNodeId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#18181b] border border-blue-500 rounded px-1 py-0.5 text-xs text-white outline-none w-full max-w-[120px]"
              />
            ) : (
              <span className="truncate select-none">{node.name}</span>
            )}
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            {/* Show / Hide Toggle */}
            <button
              onClick={(e) => toggleVisibility(id, e)}
              className={`p-0.5 hover:text-white rounded transition-opacity ${
                !node.visible || isInheritedHidden(id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
              title={node.visible ? 'Hide' : 'Show'}
            >
              {node.visible && !isInheritedHidden(id) ? (
                <Eye className="w-3 h-3" />
              ) : (
                <EyeOff className={`w-3 h-3 ${isInheritedHidden(id) ? 'text-zinc-600' : 'text-zinc-500'}`} />
              )}
            </button>

            {/* Lock / Unlock Toggle */}
            <button
              onClick={(e) => toggleLock(id, e)}
              className={`p-0.5 hover:text-white rounded transition-opacity ${
                node.locked || isInheritedLocked(id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
              title={node.locked ? 'Unlock' : 'Lock'}
            >
              {node.locked || isInheritedLocked(id) ? (
                <Lock className={`w-3 h-3 ${isInheritedLocked(id) ? 'text-amber-400/50' : 'text-amber-400'}`} />
              ) : (
                <Unlock className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>

        {/* Render nested children if expanded */}
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col">
            {children.map((childId) => renderNodeRow(childId, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const pageEntries = Object.values(document.pages);

  return (
    <aside className="w-64 border-r border-[#27272a] bg-[#18181b] flex flex-col h-full select-none text-xs text-zinc-300 z-10 relative">
      <div className="flex items-center border-b border-[#27272a] px-2">
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-2.5 font-medium text-center border-b-2 transition-all ${
            activeTab === 'layers'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Layers
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className={`flex-1 py-2.5 font-medium text-center border-b-2 transition-all ${
            activeTab === 'assets'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Assets
        </button>
      </div>

      {/* Pages Section */}
      <div className="p-2 border-b border-[#27272a]/60">
        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 px-2 mb-1">
          <span>PAGES</span>
          <button
            onClick={() => addPage()}
            className="hover:text-white p-0.5 rounded transition-colors"
            title="Add Page"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex flex-col gap-0.5">
          {pageEntries.map((page) => {
            const isEditingPage = editingPageId === page.id;
            const isCurrentPage = page.id === activePageId;
            return (
              <div
                key={page.id}
                onClick={() => {
                  if (!isEditingPage) selectPage(page.id);
                }}
                onDoubleClick={(e) => handleStartRenamePage(page.id, page.name, e)}
                className={`group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                  isCurrentPage
                    ? 'bg-blue-600/15 text-blue-400 font-medium'
                    : 'hover:bg-[#202024] text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2 truncate flex-1 mr-2">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  {isEditingPage ? (
                    <input
                      ref={pageInputRef}
                      value={editingPageName}
                      onChange={(e) => setEditingPageName(e.target.value)}
                      onBlur={() => handleCommitRenamePage(page.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCommitRenamePage(page.id);
                        if (e.key === 'Escape') setEditingPageId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-[#18181b] border border-blue-500 rounded px-1 py-0.5 text-xs text-white outline-none w-full max-w-[120px]"
                    />
                  ) : (
                    <span className="truncate">{page.name}</span>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleStartRenamePage(page.id, page.name, e)}
                    className="p-0.5 hover:text-white text-zinc-400"
                    title="Rename Page"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  {pageEntries.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePage(page.id);
                      }}
                      className="p-0.5 hover:text-rose-400 text-zinc-400"
                      title="Delete Page"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Layers Section */}
      <div className="flex-1 overflow-y-auto p-1.5 flex flex-col">
        <div className="text-[11px] font-semibold text-zinc-400 px-2 py-1 flex items-center justify-between border-b border-[#27272a]/40 pb-1.5 mb-1">
          <span>LAYERS ({nodeIds.length})</span>
          {selectedPrimaryId && (
            <div className="flex items-center gap-1 text-zinc-400">
              <button
                onClick={() => moveLayer(selectedPrimaryId, 'bring-to-front')}
                className="hover:text-white p-0.5"
                title="Bring to Front"
              >
                <BringToFront className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => moveLayer(selectedPrimaryId, 'up')}
                className="hover:text-white p-0.5"
                title="Move Up"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => moveLayer(selectedPrimaryId, 'down')}
                className="hover:text-white p-0.5"
                title="Move Down"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => moveLayer(selectedPrimaryId, 'send-to-back')}
                className="hover:text-white p-0.5"
                title="Send to Back"
              >
                <SendToBack className="w-3.5 h-3.5" />
              </button>
              <div className="h-3 w-px bg-zinc-700 mx-0.5" />
              {selectedIds.length >= 1 && (
                <button
                  onClick={groupSelected}
                  className="hover:text-white p-0.5"
                  title="Group Selection (Ctrl+G)"
                >
                  <Folder className="w-3.5 h-3.5" />
                </button>
              )}
              {selectedIds.some((id) => document.nodes[id]?.type === ('group' as any)) && (
                <button
                  onClick={ungroupSelected}
                  className="hover:text-white p-0.5"
                  title="Ungroup (Ctrl+Shift+G)"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={cutSelected}
                className="hover:text-white p-0.5"
                title="Cut (Ctrl+X)"
              >
                <Scissors className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={copySelected}
                className="hover:text-white p-0.5"
                title="Copy (Ctrl+C)"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={pasteClipboard}
                className="hover:text-white p-0.5"
                title="Paste (Ctrl+V)"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={deleteSelected}
                className="hover:text-rose-400 p-0.5"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Hierarchical Layer Tree */}
        <div className="flex flex-col gap-0.5 mt-1">
          {rootNodeIds.length === 0 ? (
            <div className="text-zinc-500 text-center py-6">No layers yet</div>
          ) : (
            rootNodeIds.map((id) => renderNodeRow(id, 0))
          )}
        </div>
      </div>

      {/* Figma-like Context Menu */}
      {contextMenu && (
        <div
          style={{ top: Math.min(contextMenu.y, window.innerHeight - 360), left: Math.min(contextMenu.x, window.innerWidth - 200) }}
          className="fixed z-50 w-48 bg-[#1f1f23] border border-[#2e2e33] rounded-lg shadow-2xl py-1 text-xs text-zinc-200"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              const node = document.nodes[contextMenu.nodeId];
              if (node) handleStartRenameNode(node.id, node.name);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
          >
            <span>Rename</span>
            <span className="text-[10px] text-zinc-400">Enter</span>
          </button>
          <button
            onClick={() => {
              groupSelected();
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
          >
            <span>Group Selection</span>
            <span className="text-[10px] text-zinc-400">Ctrl+G</span>
          </button>
          {selectedIds.some((id) => document.nodes[id]?.type === ('group' as any)) && (
            <button
              onClick={() => {
                ungroupSelected();
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
            >
              <span>Ungroup</span>
              <span className="text-[10px] text-zinc-400">Ctrl+Shift+G</span>
            </button>
          )}
          <div className="h-px bg-[#2e2e33] my-1" />
          <button
            onClick={() => {
              duplicateSelected();
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
          >
            <span>Duplicate</span>
            <span className="text-[10px] text-zinc-400">Ctrl+D</span>
          </button>
          <button
            onClick={() => {
              copySelected();
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
          >
            <span>Copy</span>
            <span className="text-[10px] text-zinc-400">Ctrl+C</span>
          </button>
          <button
            onClick={() => {
              cutSelected();
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
          >
            <span>Cut</span>
            <span className="text-[10px] text-zinc-400">Ctrl+X</span>
          </button>
          <button
            onClick={() => {
              pasteClipboard();
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
          >
            <span>Paste</span>
            <span className="text-[10px] text-zinc-400">Ctrl+V</span>
          </button>
          <div className="h-px bg-[#2e2e33] my-1" />
          <button
            onClick={() => {
              toggleLock(contextMenu.nodeId);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
          >
            <span>{document.nodes[contextMenu.nodeId]?.locked ? 'Unlock' : 'Lock'}</span>
          </button>
          <button
            onClick={() => {
              toggleVisibility(contextMenu.nodeId);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
          >
            <span>{document.nodes[contextMenu.nodeId]?.visible ? 'Hide' : 'Show'}</span>
          </button>
          <div className="h-px bg-[#2e2e33] my-1" />
          <button
            onClick={() => {
              moveLayer(contextMenu.nodeId, 'bring-to-front');
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white"
          >
            Bring to Front
          </button>
          <button
            onClick={() => {
              moveLayer(contextMenu.nodeId, 'up');
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white"
          >
            Bring Forward
          </button>
          <button
            onClick={() => {
              moveLayer(contextMenu.nodeId, 'down');
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white"
          >
            Send Backward
          </button>
          <button
            onClick={() => {
              moveLayer(contextMenu.nodeId, 'send-to-back');
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white"
          >
            Send to Back
          </button>
          <div className="h-px bg-[#2e2e33] my-1" />
          <button
            onClick={() => {
              deleteSelected();
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-rose-600 hover:text-white text-rose-400 flex items-center justify-between"
          >
            <span>Delete</span>
            <span className="text-[10px]">Del</span>
          </button>
        </div>
      )}
    </aside>
  );
};

