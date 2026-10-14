import { create } from 'zustand';
// import { DocumentModel, ToolType, ID, SceneNode, NodeType, Point, Comment } from '@figma-app/shared-types';
import { DocumentModel, Page, ToolType, ID, SceneNode, NodeType, Point, Comment, Fill, Stroke } from '@figma-app/shared-types';
import { createDefaultDocument, createNode, cloneNode, measureTextBounds, createId } from '@figma-app/document-model';
import {
  Command,
  AddNodeCommand,
  UpdateNodeCommand,
  DeleteNodesCommand,
  MoveLayerCommand,
  LayerMoveDirection,
  AlignNodesCommand,
  AlignmentType,
  DistributeNodesCommand,
  DistributionType,
  BatchAddNodesCommand,
  BatchUpdateNodesCommand,
  GroupNodesCommand,
  UngroupNodesCommand,
  ReorderNodesCommand,
  DocumentSnapshotCommand,
} from '@figma-app/editor-commands';

interface EditorState {
  document: DocumentModel;
  activePageId: ID;
  activeTool: ToolType;
  selectedIds: ID[];
  hoveredId: ID | null;
  zoom: number;
  pan: Point;
  isDraggingCanvas: boolean;
  undoStack: Command[];
  redoStack: Command[];
  clipboard: SceneNode[];
  collaborators: Record<string, { id: string; name: string; color: string; cursor: Point | null }>;
  isPrototypeMode: boolean;
  activePrototypeFrameId: ID | null;
  comments: Comment[];
  isCommentMode: boolean;
  activeTab: 'design' | 'prototype' | 'inspect';
  leftTab: 'layers' | 'assets';
  viewport: { width: number; height: number };

  setActiveTool: (tool: ToolType) => void;
  setSelectedIds: (ids: ID[]) => void;
  toggleSelectId: (id: ID) => void;
  setHoveredId: (id: ID | null) => void;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  setPan: (pan: Point | ((prev: Point) => Point)) => void;
  setViewportSize: (width: number, height: number) => void;
  zoomToFit: () => void;
  zoomToSelection: () => void;
  setActiveTab: (tab: 'design' | 'prototype' | 'inspect') => void;
  setLeftTab: (tab: 'layers' | 'assets') => void;
  setPrototypeMode: (active: boolean) => void;
  setActivePrototypeFrameId: (id: ID | null) => void;
  setCommentMode: (active: boolean) => void;
  addComment: (content: string, position: Point) => void;
  resolveComment: (id: ID) => void;
  upsertCollaborator: (peer: { id: string; name: string; color: string; cursor: Point | null }) => void;
  removeCollaborator: (peerId: string) => void;

  executeCommand: (command: Command) => void;
  undo: () => void;
  redo: () => void;

  addNode: (type: NodeType, overrides?: Partial<SceneNode>, keepTool?: boolean) => void;
  updateNode: (id: ID, props: Partial<SceneNode>) => void;
  batchUpdateNodes: (updates: { id: ID; newProps: Partial<SceneNode>; prevProps: Partial<SceneNode> }[]) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  copySelected: () => void;
  cutSelected: () => void;
  // pasteClipboard: () => void;
  pasteClipboard: () => void | Promise<void>;
  groupSelected: () => void;
  ungroupSelected: () => void;
  createComponentFromSelection: () => void;
  insertInstance: (componentId: ID) => void;
  moveLayer: (nodeId: ID, direction: LayerMoveDirection) => void;
  alignSelected: (alignment: AlignmentType) => void;
  distributeSelected: (distribution: DistributionType) => void;
  saveStatus: 'saved' | 'saving' | 'offline';
  setSaveStatus: (status: 'saved' | 'saving' | 'offline') => void;
  loadDocument: (doc: DocumentModel) => void;
  selectPage: (pageId: ID) => void;
  // renameDocument: (title: string) => void;
  renameDocument: (title: string) => void;
  addPage: (name?: string) => void;
  renamePage: (pageId: ID, name: string) => void;
  deletePage: (pageId: ID) => void;
  // reorderLayers: (sourceId: ID, targetId: ID, position?: 'before' | 'after') => void;
  reorderLayers: (sourceId: ID, targetId: ID, position?: 'before' | 'after' | 'inside') => void;
}

function cloneSubtree(
  rootIds: ID[],
  nodes: Record<ID, SceneNode>,
  offset: { x: number; y: number } = { x: 20, y: 20 }
): { clonedNodes: SceneNode[]; newRootIds: ID[] } {
  const selectedSet = new Set(rootIds);
  const effectiveRoots = rootIds.filter((id) => {
    let curr = nodes[id]?.parent;
    while (curr) {
      if (selectedSet.has(curr)) return false;
      curr = nodes[curr]?.parent;
    }
    return true;
  });

  const allSubtreeNodes: SceneNode[] = [];
  const visited = new Set<ID>();
  function collect(id: ID) {
    if (visited.has(id)) return;
    visited.add(id);
    const node = nodes[id];
    if (!node) return;
    allSubtreeNodes.push(node);
    const childIds = (node.children || []).concat(
      Object.keys(nodes).filter((k) => nodes[k]?.parent === id)
    );
    childIds.forEach(collect);
  }
  effectiveRoots.forEach(collect);

  const idMap = new Map<ID, ID>();
  allSubtreeNodes.forEach((node) => {
    idMap.set(node.id, createId(node.type));
  });

  const clonedNodes: SceneNode[] = allSubtreeNodes.map((node) => {
    const cloned = JSON.parse(JSON.stringify(node)) as SceneNode;
    cloned.id = idMap.get(node.id)!;

    if (effectiveRoots.includes(node.id)) {
      cloned.name = `${cloned.name} (Copy)`;
      cloned.parent = node.parent || null;
    } else {
      if (node.parent && idMap.has(node.parent)) {
        cloned.parent = idMap.get(node.parent)!;
      }
    }

    if (cloned.children && cloned.children.length > 0) {
      cloned.children = cloned.children.map((childId) => idMap.get(childId) || childId);
    }

    cloned.transform = {
      ...cloned.transform,
      x: cloned.transform.x + offset.x,
      y: cloned.transform.y + offset.y,
    };

    return cloned;
  });

  const newRootIds = effectiveRoots.map((id) => idMap.get(id)!).filter(Boolean);
  return { clonedNodes, newRootIds };
}

function parseSvgToNodes(svgStr: string): SceneNode[] {
  try {
    if (typeof window === 'undefined' || !window.DOMParser) return [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgStr, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');
    if (!svgEl) return [];

    const nodes: SceneNode[] = [];

    const getFill = (el: Element): Fill[] => {
      const fill = el.getAttribute('fill') || el.getAttribute('style')?.match(/fill:\s*([^;]+)/)?.[1];
      if (!fill || fill.toLowerCase() === 'none') return [];
      return [{
        id: createId('fill'),
        type: 'solid',
        color: fill.startsWith('#') || fill.startsWith('rgb') ? fill : '#000000',
        opacity: 1,
        visible: true,
      }];
    };

    const getStroke = (el: Element): Stroke[] => {
      const stroke = el.getAttribute('stroke') || el.getAttribute('style')?.match(/stroke:\s*([^;]+)/)?.[1];
      if (!stroke || stroke.toLowerCase() === 'none') return [];
      const width = parseFloat(el.getAttribute('stroke-width') || '1') || 1;
      return [{
        id: createId('stroke'),
        color: stroke.startsWith('#') || stroke.startsWith('rgb') ? stroke : '#000000',
        width,
        align: 'center',
        opacity: 1,
        visible: true,
      }];
    };

    function parseElement(el: Element, parentId: ID | null = null): SceneNode | null {
      const tagName = el.tagName.toLowerCase();

      if (tagName === 'g') {
        const groupId = createId('group');
        const childNodes: SceneNode[] = [];

        for (let i = 0; i < el.children.length; i++) {
          const childNode = parseElement(el.children[i], groupId);
          if (childNode) {
            childNodes.push(childNode);
            nodes.push(childNode);
          }
        }

        if (childNodes.length === 0) return null;

        const minX = Math.min(...childNodes.map((n) => n.transform.x));
        const minY = Math.min(...childNodes.map((n) => n.transform.y));
        const maxX = Math.max(...childNodes.map((n) => n.transform.x + n.transform.width));
        const maxY = Math.max(...childNodes.map((n) => n.transform.y + n.transform.height));

        const groupNode = createNode('group' as NodeType, {
          id: groupId,
          name: el.getAttribute('id') || 'Group',
          parent: parentId,
          transform: {
            x: minX,
            y: minY,
            width: Math.max(10, maxX - minX),
            height: Math.max(10, maxY - minY),
            rotation: 0,
          },
          children: childNodes.map((c) => c.id),
          fills: [],
          strokes: [],
        });
        return groupNode;
      }

      if (tagName === 'rect') {
        const x = parseFloat(el.getAttribute('x') || '0') || 0;
        const y = parseFloat(el.getAttribute('y') || '0') || 0;
        const width = parseFloat(el.getAttribute('width') || '100') || 100;
        const height = parseFloat(el.getAttribute('height') || '100') || 100;
        const rx = parseFloat(el.getAttribute('rx') || '0') || 0;
        const fills = getFill(el);
        const strokes = getStroke(el);

        return createNode('rect', {
          parent: parentId,
          name: el.getAttribute('id') || 'Rectangle',
          transform: { x, y, width, height, rotation: 0 },
          cornerRadius: rx,
          fills: fills.length > 0 ? fills : [{ id: createId('fill'), type: 'solid', color: '#18a0fb', opacity: 1, visible: true }],
          strokes,
        });
      }

      if (tagName === 'circle' || tagName === 'ellipse') {
        let x = 0, y = 0, width = 60, height = 60;
        if (tagName === 'circle') {
          const cx = parseFloat(el.getAttribute('cx') || '30') || 30;
          const cy = parseFloat(el.getAttribute('cy') || '30') || 30;
          const r = parseFloat(el.getAttribute('r') || '30') || 30;
          x = cx - r;
          y = cy - r;
          width = r * 2;
          height = r * 2;
        } else {
          const cx = parseFloat(el.getAttribute('cx') || '30') || 30;
          const cy = parseFloat(el.getAttribute('cy') || '30') || 30;
          const rx = parseFloat(el.getAttribute('rx') || '30') || 30;
          const ry = parseFloat(el.getAttribute('ry') || '30') || 30;
          x = cx - rx;
          y = cy - ry;
          width = rx * 2;
          height = ry * 2;
        }
        const fills = getFill(el);
        const strokes = getStroke(el);

        return createNode('ellipse', {
          parent: parentId,
          name: el.getAttribute('id') || 'Ellipse',
          transform: { x, y, width, height, rotation: 0 },
          fills: fills.length > 0 ? fills : [{ id: createId('fill'), type: 'solid', color: '#7b61ff', opacity: 1, visible: true }],
          strokes,
        });
      }

      if (tagName === 'text') {
        const x = parseFloat(el.getAttribute('x') || '0') || 0;
        const y = parseFloat(el.getAttribute('y') || '0') || 0;
        const content = el.textContent || 'Text';
        const fontSize = parseFloat(el.getAttribute('font-size') || '14') || 14;
        const fills = getFill(el);
        const strokes = getStroke(el);

        return createNode('text', {
          parent: parentId,
          name: content.slice(0, 15) || 'Text',
          content,
          fontSize,
          transform: { x, y, width: Math.max(40, content.length * (fontSize * 0.6)), height: fontSize * 1.4, rotation: 0 },
          fills: fills.length > 0 ? fills : [{ id: createId('fill'), type: 'solid', color: '#ffffff', opacity: 1, visible: true }],
          strokes,
        });
      }

      if (tagName === 'path' || tagName === 'polygon' || tagName === 'polyline') {
        const fills = getFill(el);
        const strokes = getStroke(el);
        return createNode('rect', {
          parent: parentId,
          name: el.getAttribute('id') || 'Vector',
          transform: { x: 0, y: 0, width: 80, height: 80, rotation: 0 },
          fills: fills.length > 0 ? fills : [{ id: createId('fill'), type: 'solid', color: '#9747ff', opacity: 1, visible: true }],
          strokes,
        });
      }

      return null;
    }

    const topNodes: SceneNode[] = [];
    for (let i = 0; i < svgEl.children.length; i++) {
      const parsed = parseElement(svgEl.children[i], null);
      if (parsed) {
        topNodes.push(parsed);
        nodes.push(parsed);
      }
    }

    if (topNodes.length > 1) {
      const groupId = createId('group');
      topNodes.forEach((n) => { n.parent = groupId; });
      const minX = Math.min(...topNodes.map((n) => n.transform.x));
      const minY = Math.min(...topNodes.map((n) => n.transform.y));
      const maxX = Math.max(...topNodes.map((n) => n.transform.x + n.transform.width));
      const maxY = Math.max(...topNodes.map((n) => n.transform.y + n.transform.height));

      const groupNode = createNode('group' as NodeType, {
        id: groupId,
        name: 'Figma Group',
        parent: null,
        transform: {
          x: minX,
          y: minY,
          width: Math.max(10, maxX - minX),
          height: Math.max(10, maxY - minY),
          rotation: 0,
        },
        children: topNodes.map((c) => c.id),
        fills: [],
        strokes: [],
      });
      nodes.push(groupNode);
    }

    return nodes;
  } catch (err) {
    console.error('Failed to parse SVG from clipboard:', err);
    return [];
  }
}

export const useEditorStore = create<EditorState>((set, get) => {
  const initialDoc = createDefaultDocument('Master UI Design');

  const frame1 = createNode('frame', {
    name: 'Desktop / 1440',
    transform: { x: 120, y: 80, width: 900, height: 600, rotation: 0 },
    fills: [{ id: 'f1', type: 'solid', color: '#0f172a', opacity: 1, visible: true }],
  });

  const card1 = createNode('rect', {
    name: 'Hero Card',
    parent: frame1.id,
    transform: { x: 180, y: 160, width: 440, height: 260, rotation: 0 },
    cornerRadius: 16,
    fills: [{ id: 'f2', type: 'solid', color: '#1e293b', opacity: 1, visible: true }],
    strokes: [{ id: 's1', color: '#38bdf8', width: 2, align: 'inside', visible: true }],
  });

  const titleNode = createNode('text', {
    name: 'Hero Title',
    parent: frame1.id,
    transform: { x: 210, y: 200, width: 380, height: 48, rotation: 0 },
    content: 'Collaborative Canvas',
    fontSize: 28,
    fontWeight: 700,
    fills: [{ id: 'f3', type: 'solid', color: '#ffffff', opacity: 1, visible: true }],
  });

  const btnNode = createNode('rect', {
    name: 'Primary Button',
    parent: frame1.id,
    transform: { x: 210, y: 320, width: 140, height: 44, rotation: 0 },
    cornerRadius: 8,
    fills: [{ id: 'f4', type: 'solid', color: '#3b82f6', opacity: 1, visible: true }],
  });

  const btnText = createNode('text', {
    name: 'Button Label',
    parent: frame1.id,
    transform: { x: 240, y: 332, width: 80, height: 20, rotation: 0 },
    content: 'Get Started',
    fontSize: 14,
    fontWeight: 600,
    fills: [{ id: 'f5', type: 'solid', color: '#ffffff', opacity: 1, visible: true }],
  });

  initialDoc.nodes[frame1.id] = frame1;
  initialDoc.nodes[card1.id] = card1;
  initialDoc.nodes[titleNode.id] = titleNode;
  initialDoc.nodes[btnNode.id] = btnNode;
  initialDoc.nodes[btnText.id] = btnText;

  const activePage = initialDoc.pages[initialDoc.activePageId];
  /*
  Original seed listed frame children at page root as well, which duplicated them in the
  layers tree and in canvas hit-testing:
  activePage.children = [frame1.id, card1.id, titleNode.id, btnNode.id, btnText.id];
  */
  initialDoc.nodes[frame1.id] = { ...frame1, children: [card1.id, titleNode.id, btnNode.id, btnText.id] };
  activePage.children = [frame1.id];

  return {
    document: initialDoc,
    activePageId: initialDoc.activePageId,
    activeTool: 'select',
    selectedIds: [frame1.id],
    hoveredId: null,
    zoom: 1,
    pan: { x: 0, y: 0 },
    isDraggingCanvas: false,
    undoStack: [],
    redoStack: [],
    clipboard: [],
    // collaborators: {
    //   'peer-1': { id: 'peer-1', name: 'Sarah (Design Lead)', color: '#ec4899', cursor: { x: 420, y: 240 } },
    //   'peer-2': { id: 'peer-2', name: 'Alex (Engineer)', color: '#10b981', cursor: { x: 740, y: 390 } },
    // },
    collaborators: {},
    isPrototypeMode: false,
    activePrototypeFrameId: frame1.id,
    comments: [
      {
        id: 'c_welcome',
        documentId: initialDoc.id,
        pageId: initialDoc.activePageId,
        authorId: 'usr_demo_lead',
        authorName: 'Sarah',
        authorColor: '#ec4899',
        position: { x: 640, y: 150 },
        content: 'Check the primary button contrast with the dark card.',
        resolved: false,
        createdAt: new Date().toISOString(),
      },
    ],
    isCommentMode: false,
    activeTab: 'design',
    leftTab: 'layers',
    viewport:
      typeof window !== 'undefined'
        ? { width: window.innerWidth, height: window.innerHeight }
        : { width: 1200, height: 800 },

    setActiveTool: (tool) => set({ activeTool: tool }),
    setSelectedIds: (ids) => set({ selectedIds: ids }),
    toggleSelectId: (id) =>
      set((state) => {
        const exists = state.selectedIds.includes(id);
        return {
          selectedIds: exists ? state.selectedIds.filter((item) => item !== id) : [...state.selectedIds, id],
        };
      }),
    setHoveredId: (id) => set({ hoveredId: id }),
    /*
    Original zoom setter (did not clamp functional updates):
    setZoom: (zoom) =>
      set((state) => ({
        zoom: typeof zoom === 'function' ? zoom(state.zoom) : Math.max(0.1, Math.min(zoom, 5)),
      })),
    */
    setZoom: (zoom) =>
      set((state) => {
        const next = typeof zoom === 'function' ? zoom(state.zoom) : zoom;
        return { zoom: Math.max(0.1, Math.min(next, 5)) };
      }),
    setPan: (pan) =>
      set((state) => ({
        pan: typeof pan === 'function' ? pan(state.pan) : pan,
      })),
    setViewportSize: (width, height) =>
      set((state) => {
        if (state.viewport.width === width && state.viewport.height === height) return {};
        return { viewport: { width, height } };
      }),
    zoomToFit: () => {
      const { document, activePageId, viewport } = get();
      const page = document.pages[activePageId];
      const roots = (page?.children || [])
        .map((id) => document.nodes[id])
        .filter((n): n is SceneNode => Boolean(n));
      if (roots.length === 0) {
        set({ zoom: 1, pan: { x: 0, y: 0 } });
        return;
      }
      const minX = Math.min(...roots.map((n) => n.transform.x));
      const minY = Math.min(...roots.map((n) => n.transform.y));
      const maxX = Math.max(...roots.map((n) => n.transform.x + n.transform.width));
      const maxY = Math.max(...roots.map((n) => n.transform.y + n.transform.height));
      const contentWidth = Math.max(1, maxX - minX);
      const contentHeight = Math.max(1, maxY - minY);
      const padding = 64;
      const vw = viewport.width || window.innerWidth;
      const vh = viewport.height || window.innerHeight;
      const scale = Math.max(
        0.1,
        Math.min(
          Math.min((vw - padding * 2) / contentWidth, (vh - padding * 2) / contentHeight),
          5
        )
      );
      set({
        zoom: Number(scale.toFixed(4)),
        pan: {
          x: vw / 2 - (minX + contentWidth / 2) * scale,
          y: vh / 2 - (minY + contentHeight / 2) * scale,
        },
      });
    },
    zoomToSelection: () => {
      const { document, selectedIds, viewport } = get();
      const selected = selectedIds
        .map((id) => document.nodes[id])
        .filter((n): n is SceneNode => Boolean(n));
      if (selected.length === 0) {
        get().zoomToFit();
        return;
      }
      const minX = Math.min(...selected.map((n) => n.transform.x));
      const minY = Math.min(...selected.map((n) => n.transform.y));
      const maxX = Math.max(...selected.map((n) => n.transform.x + n.transform.width));
      const maxY = Math.max(...selected.map((n) => n.transform.y + n.transform.height));
      const vw = viewport.width || window.innerWidth;
      const vh = viewport.height || window.innerHeight;
      const padding = 96;
      const scale = Math.max(
        0.1,
        Math.min(
          Math.min(
            (vw - padding * 2) / Math.max(1, maxX - minX),
            (vh - padding * 2) / Math.max(1, maxY - minY)
          ),
          5
        )
      );
      set({
        zoom: Number(scale.toFixed(4)),
        pan: {
          x: vw / 2 - ((minX + maxX) / 2) * scale,
          y: vh / 2 - ((minY + maxY) / 2) * scale,
        },
      });
    },
    setActiveTab: (tab) => set({ activeTab: tab }),
    setLeftTab: (tab) => set({ leftTab: tab }),
    setPrototypeMode: (active) => set({ isPrototypeMode: active }),
    setActivePrototypeFrameId: (id) => set({ activePrototypeFrameId: id }),
    setCommentMode: (active) => set({ isCommentMode: active }),
    addComment: (content, position) => {
      const { document, activePageId } = get();
      const newComment: Comment = {
        id: `c_${Date.now().toString(36)}`,
        documentId: document.id,
        pageId: activePageId,
        authorId: 'usr_current',
        authorName: 'You',
        authorColor: '#3b82f6',
        position,
        content,
        resolved: false,
        createdAt: new Date().toISOString(),
      };
      set((state) => ({ comments: [...state.comments, newComment], isCommentMode: false }));
    },
    resolveComment: (id) => {
      set((state) => ({
        comments: state.comments.map((c) => (c.id === id ? { ...c, resolved: true } : c)),
      }));
    },
    upsertCollaborator: (peer) =>
      set((state) => ({
        collaborators: { ...state.collaborators, [peer.id]: peer },
      })),
    removeCollaborator: (peerId) =>
      set((state) => {
        if (!state.collaborators[peerId]) return {};
        const nextCollaborators = { ...state.collaborators };
        delete nextCollaborators[peerId];
        return { collaborators: nextCollaborators };
      }),

    executeCommand: (command) => {
      const nextDoc = command.execute(get().document);
      set((state) => ({
        document: nextDoc,
        undoStack: [...state.undoStack, command],
        redoStack: [],
      }));
    },

    undo: () => {
      const { undoStack, redoStack, document, selectedIds } = get();
      if (undoStack.length === 0) return;
      const cmd = undoStack[undoStack.length - 1];
      const nextDoc = cmd.undo(document);
      set({
        document: nextDoc,
        undoStack: undoStack.slice(0, -1),
        redoStack: [...redoStack, cmd],
        selectedIds: selectedIds.filter((id) => Boolean(nextDoc.nodes[id])),
      });
    },

    redo: () => {
      const { undoStack, redoStack, document, selectedIds } = get();
      if (redoStack.length === 0) return;
      const cmd = redoStack[redoStack.length - 1];
      const nextDoc = cmd.execute(document);
      set({
        document: nextDoc,
        undoStack: [...undoStack, cmd],
        redoStack: redoStack.slice(0, -1),
        selectedIds: selectedIds.filter((id) => Boolean(nextDoc.nodes[id])),
      });
    },

    addNode: (type, overrides = {}, keepTool = false) => {
      const { activePageId, activeTool, executeCommand } = get();
      const node = createNode(type, overrides);
      executeCommand(new AddNodeCommand(node, activePageId));
      set({ selectedIds: [node.id], activeTool: keepTool ? activeTool : 'select' });
    },

    /*
    updateNode: (id, props) => {
      const { document, executeCommand } = get();
      const node = document.nodes[id];
      if (!node) return;
      const prevProps: Partial<SceneNode> = {};
      (Object.keys(props) as (keyof SceneNode)[]).forEach((key) => {
        prevProps[key] = node[key] as any;
      });
      executeCommand(new UpdateNodeCommand(id, props, prevProps));
    },
    */
    updateNode: (id, props) => {
      const { document, executeCommand } = get();
      const node = document.nodes[id];
      if (!node) return;

      let finalProps = { ...props };
      const rawProps = props as any;
      if (node.type === 'text' && (rawProps.content !== undefined || rawProps.fontSize !== undefined)) {
        if (!props.transform || props.transform.width === undefined) {
          const nextContent = rawProps.content !== undefined ? (rawProps.content as string) : ((node as any).content || '');
          const nextFontSize = rawProps.fontSize !== undefined ? (rawProps.fontSize as number) : ((node as any).fontSize || 16);
          const fontFamily = (node as any).fontFamily || 'Inter';
          const fontWeight = (node as any).fontWeight || 500;
          const bounds = measureTextBounds(nextContent, nextFontSize, fontFamily, fontWeight);
          finalProps = {
            ...finalProps,
            transform: {
              ...(props.transform || node.transform),
              width: bounds.width,
              height: bounds.height,
            },
          };
        }
      }

      const prevProps: Partial<SceneNode> = {};
      (Object.keys(finalProps) as (keyof SceneNode)[]).forEach((key) => {
        prevProps[key] = node[key] as any;
      });
      executeCommand(new UpdateNodeCommand(id, finalProps, prevProps));
    },

    batchUpdateNodes: (updates) => {
      const { executeCommand } = get();
      if (updates.length === 0) return;
      executeCommand(new BatchUpdateNodesCommand(updates));
    },

    /*
    deleteSelected: () => {
      const { selectedIds, activePageId, executeCommand } = get();
      if (selectedIds.length === 0) return;
      executeCommand(new DeleteNodesCommand(selectedIds, activePageId));
      set({ selectedIds: [] });
    },
    */
    deleteSelected: () => {
      const { selectedIds, activePageId, executeCommand, document } = get();
      if (selectedIds.length === 0) return;
      const allIdsToDelete = new Set<string>();
      selectedIds.forEach((id) => {
        allIdsToDelete.add(id);
        const collectDescendants = (parentId: string) => {
          const node = document.nodes[parentId];
          const children = (node?.children || []).concat(
            Object.keys(document.nodes).filter((k) => document.nodes[k]?.parent === parentId)
          );
          children.forEach((cId) => {
            if (!allIdsToDelete.has(cId)) {
              allIdsToDelete.add(cId);
              collectDescendants(cId);
            }
          });
        };
        collectDescendants(id);
      });
      executeCommand(new DeleteNodesCommand(Array.from(allIdsToDelete), activePageId));
      set({ selectedIds: [] });
    },

    /*
    Original duplicateSelected, copySelected, cutSelected, pasteClipboard:
    duplicateSelected: () => {
      const { selectedIds, activePageId, document, executeCommand } = get();
      if (selectedIds.length === 0) return;
      const newSelection: ID[] = [];
      const clonedNodes: SceneNode[] = [];
      selectedIds.forEach((id) => {
        const node = document.nodes[id];
        if (node) {
          const cloned = cloneNode(node);
          clonedNodes.push(cloned);
          newSelection.push(cloned.id);
        }
      });
      if (clonedNodes.length > 0) {
        executeCommand(new BatchAddNodesCommand(clonedNodes, activePageId));
        set({ selectedIds: newSelection });
      }
    },

    copySelected: () => {
      const { selectedIds, document } = get();
      if (selectedIds.length === 0) return;
      const copied: SceneNode[] = selectedIds
        .map((id) => document.nodes[id])
        .filter((n): n is SceneNode => !!n);
      set({ clipboard: copied });
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(JSON.stringify(copied)).catch(() => {});
        }
      } catch {}
    },

    cutSelected: () => {
      const { selectedIds, activePageId, document, executeCommand } = get();
      if (selectedIds.length === 0) return;
      const cutNodes: SceneNode[] = selectedIds
        .map((id) => document.nodes[id])
        .filter((n): n is SceneNode => !!n);
      set({ clipboard: cutNodes });
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(JSON.stringify(cutNodes)).catch(() => {});
        }
      } catch {}
      executeCommand(new DeleteNodesCommand(selectedIds, activePageId));
      set({ selectedIds: [] });
    },

    pasteClipboard: () => {
      const { clipboard, activePageId, executeCommand } = get();
      if (clipboard.length === 0) return;
      const newNodes: SceneNode[] = [];
      const newSelection: ID[] = [];

      clipboard.forEach((node) => {
        const cloned = cloneNode(node);
        // Offset slightly for visual feedback
        cloned.transform = {
          ...cloned.transform,
          x: cloned.transform.x + 10,
          y: cloned.transform.y + 10,
        };
        newNodes.push(cloned);
        newSelection.push(cloned.id);
      });

      if (newNodes.length > 0) {
        executeCommand(new BatchAddNodesCommand(newNodes, activePageId));
        set({
          clipboard: newNodes, // Update clipboard position so successive pastes cascade nicely
          selectedIds: newSelection,
        });
      }
    },
    */
    duplicateSelected: () => {
      const { selectedIds, activePageId, document, executeCommand } = get();
      if (selectedIds.length === 0) return;
      const { clonedNodes, newRootIds } = cloneSubtree(selectedIds, document.nodes, { x: 20, y: 20 });
      if (clonedNodes.length > 0) {
        executeCommand(new BatchAddNodesCommand(clonedNodes, activePageId));
        set({ selectedIds: newRootIds });
      }
    },

    copySelected: () => {
      const { selectedIds, document } = get();
      if (selectedIds.length === 0) return;

      const selectedSet = new Set(selectedIds);
      const effectiveRoots = selectedIds.filter((id) => {
        let curr = document.nodes[id]?.parent;
        while (curr) {
          if (selectedSet.has(curr)) return false;
          curr = document.nodes[curr]?.parent;
        }
        return true;
      });

      const allNodesToCopy: SceneNode[] = [];
      const visited = new Set<ID>();
      function collect(id: ID) {
        if (visited.has(id)) return;
        visited.add(id);
        const node = document.nodes[id];
        if (!node) return;
        allNodesToCopy.push(JSON.parse(JSON.stringify(node)));
        const childIds = (node.children || []).concat(
          Object.keys(document.nodes).filter((k) => document.nodes[k]?.parent === id)
        );
        childIds.forEach(collect);
      }
      effectiveRoots.forEach(collect);

      if (allNodesToCopy.length === 0) return;

      set({ clipboard: allNodesToCopy });
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(JSON.stringify(allNodesToCopy)).catch(() => {});
        }
      } catch {}
    },

    cutSelected: () => {
      const { selectedIds, copySelected, deleteSelected } = get();
      if (selectedIds.length === 0) return;
      copySelected();
      deleteSelected();
    },

    pasteClipboard: async () => {
      const { clipboard, activePageId, executeCommand } = get();
      let sourceNodes: SceneNode[] = [];

      // Attempt to read from system clipboard (supports Figma SVG copy & JSON copy)
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          // First check readText()
          if (navigator.clipboard.readText) {
            const text = await navigator.clipboard.readText();
            if (text && text.trim()) {
              const trimmed = text.trim();
              if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                try {
                  const parsed = JSON.parse(trimmed);
                  if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id && parsed[0].type) {
                    sourceNodes = parsed as SceneNode[];
                  }
                } catch {}
              } else if (trimmed.includes('<svg') || trimmed.includes('<SVG')) {
                const svgNodes = parseSvgToNodes(trimmed);
                if (svgNodes.length > 0) {
                  sourceNodes = svgNodes;
                }
              }
            }
          }

          // If no nodes found yet, try reading rich items (HTML containing SVG)
          if (sourceNodes.length === 0 && (navigator.clipboard as any).read) {
            try {
              const items = await (navigator.clipboard as any).read();
              for (const item of items) {
                if (item.types && item.types.includes('text/html')) {
                  const blob = await item.getType('text/html');
                  const htmlText = await blob.text();
                  if (htmlText.includes('<svg') || htmlText.includes('<SVG')) {
                    const match = htmlText.match(/<svg[\s\S]*?<\/svg>/i);
                    if (match) {
                      const svgNodes = parseSvgToNodes(match[0]);
                      if (svgNodes.length > 0) {
                        sourceNodes = svgNodes;
                        break;
                      }
                    }
                  }
                }
              }
            } catch {}
          }
        }
      } catch {}

      // Fallback to internal clipboard if no external clipboard nodes found
      if (sourceNodes.length === 0) {
        sourceNodes = clipboard;
      }

      if (sourceNodes.length === 0) return;

      const sourceLookup: Record<ID, SceneNode> = {};
      sourceNodes.forEach((node) => {
        sourceLookup[node.id] = node;
      });

      // Find root IDs in sourceNodes (nodes whose parents are not in sourceNodes)
      const rootIds = sourceNodes
        .filter((node) => !node.parent || !sourceLookup[node.parent])
        .map((node) => node.id);

      const { clonedNodes, newRootIds } = cloneSubtree(rootIds, sourceLookup, { x: 20, y: 20 });

      if (clonedNodes.length > 0) {
        executeCommand(new BatchAddNodesCommand(clonedNodes, activePageId));
        set({
          clipboard: clonedNodes,
          selectedIds: newRootIds,
        });
      }
    },

    /*
    Original groupSelected:
    groupSelected: () => {
      const { selectedIds, activePageId, document, executeCommand } = get();
      if (selectedIds.length < 2) return;
      const nodes = selectedIds.map((id) => document.nodes[id]).filter(Boolean);
      if (nodes.length < 2) return;
      ...
    },
    */
    groupSelected: () => {
      const { selectedIds, activePageId, document, executeCommand } = get();
      if (selectedIds.length < 1) return;
      const nodes = selectedIds.map((id) => document.nodes[id]).filter(Boolean);
      if (nodes.length < 1) return;

      const minX = Math.min(...nodes.map((n) => n.transform.x));
      const minY = Math.min(...nodes.map((n) => n.transform.y));
      const maxX = Math.max(...nodes.map((n) => n.transform.x + n.transform.width));
      const maxY = Math.max(...nodes.map((n) => n.transform.y + n.transform.height));

      const firstParent = nodes[0].parent || null;
      const allShareParent = nodes.every((n) => (n.parent || null) === firstParent);
      const parentId = allShareParent && firstParent && document.nodes[firstParent] ? firstParent : null;

      const groupNode = createNode('group' as NodeType, {
        name: 'Group',
        parent: parentId,
        transform: {
          x: minX,
          y: minY,
          width: Math.max(10, maxX - minX),
          height: Math.max(10, maxY - minY),
          rotation: 0,
        },
        children: [...selectedIds],
        fills: [],
        strokes: [],
      });

      executeCommand(new GroupNodesCommand(groupNode, selectedIds, activePageId));
      set({ selectedIds: [groupNode.id] });
    },

    /*
    ungroupSelected: () => {
      const { selectedIds, activePageId, document, executeCommand } = get();
      if (selectedIds.length !== 1) return;
      const targetId = selectedIds[0];
      const target = document.nodes[targetId];
      if (!target || target.type !== ('group' as any)) return;

      const memberIds = target.children ? [...target.children] : [];
      executeCommand(new UngroupNodesCommand(targetId, activePageId));
      set({ selectedIds: memberIds });
    },
    */
    ungroupSelected: () => {
      const { selectedIds, activePageId, document, executeCommand } = get();
      if (selectedIds.length === 0) return;

      const groupsToUngroup = new Set<string>();
      selectedIds.forEach((id) => {
        const node = document.nodes[id];
        if (node?.type === 'group') {
          groupsToUngroup.add(id);
        } else if (node?.parent && document.nodes[node.parent]?.type === 'group') {
          groupsToUngroup.add(node.parent);
        }
      });

      if (groupsToUngroup.size === 0) return;

      const allNewSelection: string[] = [];
      groupsToUngroup.forEach((groupId) => {
        const group = document.nodes[groupId];
        if (group) {
          const members = (group.children || []).concat(
            Object.keys(document.nodes).filter((k) => document.nodes[k]?.parent === groupId)
          );
          allNewSelection.push(...members);
          executeCommand(new UngroupNodesCommand(groupId, activePageId));
        }
      });

      set({ selectedIds: Array.from(new Set(allNewSelection)) });
    },

    createComponentFromSelection: () => {
      const { selectedIds, activePageId, document, executeCommand } = get();
      const nodes = selectedIds.map((id) => document.nodes[id]).filter(Boolean);
      if (nodes.length === 0) return;

      const minX = Math.min(...nodes.map((n) => n.transform.x));
      const minY = Math.min(...nodes.map((n) => n.transform.y));
      const maxX = Math.max(...nodes.map((n) => n.transform.x + n.transform.width));
      const maxY = Math.max(...nodes.map((n) => n.transform.y + n.transform.height));

      const firstParent = nodes[0].parent || null;
      const allShareParent = nodes.every((n) => (n.parent || null) === firstParent);
      const parentId = allShareParent && firstParent && document.nodes[firstParent] ? firstParent : null;

      const componentCount = Object.values(document.nodes).filter((n) => n.type === 'component').length + 1;

      const componentNode = createNode('component' as NodeType, {
        name: `Component ${componentCount}`,
        parent: parentId,
        transform: {
          x: minX,
          y: minY,
          width: Math.max(10, maxX - minX),
          height: Math.max(10, maxY - minY),
          rotation: 0,
        },
        children: [...selectedIds],
        fills: [],
        strokes: [],
      });

      executeCommand(new GroupNodesCommand(componentNode, selectedIds, activePageId));
      set({ selectedIds: [componentNode.id] });
    },

    insertInstance: (componentId) => {
      const { document, activePageId, executeCommand } = get();
      const component = document.nodes[componentId];
      if (!component || component.type !== 'component') return;

      const { clonedNodes, newRootIds } = cloneSubtree([componentId], document.nodes, { x: 40, y: 40 });
      if (clonedNodes.length === 0) return;

      clonedNodes.forEach((n) => {
        if (newRootIds.includes(n.id)) {
          n.type = 'instance' as NodeType;
          n.name = `${component.name} Instance`;
        }
      });

      executeCommand(new BatchAddNodesCommand(clonedNodes, activePageId));
      set({ selectedIds: newRootIds });
    },

    moveLayer: (nodeId, direction) => {
      const { activePageId, executeCommand } = get();
      executeCommand(new MoveLayerCommand(nodeId, activePageId, direction));
    },

    // alignSelected: (alignment) => {
    //   const { selectedIds, executeCommand } = get();
    //   if (selectedIds.length < 2) return;
    //   executeCommand(new AlignNodesCommand(selectedIds, alignment));
    // },
    alignSelected: (alignment) => {
      const { selectedIds, executeCommand } = get();
      if (selectedIds.length === 0) return;
      executeCommand(new AlignNodesCommand(selectedIds, alignment));
    },

    distributeSelected: (distribution) => {
      const { selectedIds, executeCommand } = get();
      if (selectedIds.length < 3) return;
      executeCommand(new DistributeNodesCommand(selectedIds, distribution));
    },

    saveStatus: 'saved',
    setSaveStatus: (status) => set({ saveStatus: status }),
    /*
    Original loader assumed every stored node was complete:
    loadDocument: (doc) =>
      set({
        document: doc,
        activePageId: doc.activePageId || Object.keys(doc.pages)[0] || '',
        selectedIds: [],
        undoStack: [],
        redoStack: [],
      }),
    */
    loadDocument: (doc) => {
      // Normalise documents coming from localStorage or an imported file so the
      // canvas and panels always receive complete nodes.
      const sourceNodes = doc.nodes || {};
      const normalizedNodes: Record<ID, SceneNode> = {};
      Object.keys(sourceNodes).forEach((id) => {
        const node = sourceNodes[id];
        if (!node) return;
        normalizedNodes[id] = {
          ...node,
          id: node.id || id,
          visible: node.visible !== false,
          locked: node.locked === true,
          opacity: typeof node.opacity === 'number' ? node.opacity : 1,
          transform: {
            x: node.transform?.x ?? 0,
            y: node.transform?.y ?? 0,
            width: node.transform?.width ?? 100,
            height: node.transform?.height ?? 100,
            rotation: node.transform?.rotation ?? 0,
          },
          fills: Array.isArray(node.fills) ? node.fills : [],
          strokes: Array.isArray(node.strokes) ? node.strokes : [],
          effects: Array.isArray(node.effects) ? node.effects : [],
        } as SceneNode;
      });

      const pages = doc.pages || {};
      set({
        document: {
          ...doc,
          pages,
          nodes: normalizedNodes,
          activePageId: doc.activePageId || Object.keys(pages)[0] || '',
        },
        activePageId: doc.activePageId || Object.keys(pages)[0] || '',
        selectedIds: [],
        undoStack: [],
        redoStack: [],
      });
    },

    selectPage: (pageId) => set({ activePageId: pageId, selectedIds: [] }),
    // renameDocument: (title) =>
    //   set((state) => ({
    //     document: { ...state.document, title, updatedAt: new Date().toISOString() },
    //   })),
    renameDocument: (title) =>
      set((state) => ({
        document: { ...state.document, title, updatedAt: new Date().toISOString() },
      })),
    addPage: (name) => {
      const { document } = get();
      const pageCount = Object.keys(document.pages).length + 1;
      const newPageId = `page_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
      const newPage: Page = {
        id: newPageId,
        name: name || `Page ${pageCount}`,
        children: [],
        background: '#1e1e24',
      };
      set({
        document: {
          ...document,
          pages: { ...document.pages, [newPageId]: newPage },
          activePageId: newPageId,
          updatedAt: new Date().toISOString(),
        },
        activePageId: newPageId,
        selectedIds: [],
      });
    },
    renamePage: (pageId, name) => {
      const { document } = get();
      const page = document.pages[pageId];
      if (!page) return;
      set({
        document: {
          ...document,
          pages: {
            ...document.pages,
            [pageId]: { ...page, name },
          },
          updatedAt: new Date().toISOString(),
        },
      });
    },
    deletePage: (pageId) => {
      const { document, activePageId } = get();
      const pageKeys = Object.keys(document.pages);
      if (pageKeys.length <= 1) return;
      const nextPages = { ...document.pages };
      delete nextPages[pageId];
      const remainingKeys = Object.keys(nextPages);
      const newActivePageId = activePageId === pageId ? remainingKeys[0] : activePageId;
      set({
        document: {
          ...document,
          pages: nextPages,
          activePageId: newActivePageId,
          updatedAt: new Date().toISOString(),
        },
        activePageId: newActivePageId,
        selectedIds: [],
      });
    },
    /*
    reorderLayers: (sourceId, targetId, position = 'after') => {
      const { document, activePageId, executeCommand } = get();
      const page = document.pages[activePageId];
      if (!page) return;
      const list = [...page.children];
      const srcIdx = list.indexOf(sourceId);
      const tgtIdx = list.indexOf(targetId);
      if (srcIdx === -1 || tgtIdx === -1 || srcIdx === tgtIdx) return;
      list.splice(srcIdx, 1);
      const newTgtIdx = list.indexOf(targetId);
      const insertIdx = position === 'before' ? newTgtIdx : newTgtIdx + 1;
      list.splice(insertIdx, 0, sourceId);
      executeCommand(new ReorderNodesCommand(activePageId, list, page.children));
    },
    */
    reorderLayers: (sourceId, targetId, position: 'before' | 'after' | 'inside' = 'after') => {
      const { document, activePageId, executeCommand } = get();
      const page = document.pages[activePageId];
      if (!page || sourceId === targetId) return;

      const srcNode = document.nodes[sourceId];
      const tgtNode = document.nodes[targetId];
      if (!srcNode || !tgtNode) return;

      // Prevent re-parenting a container into one of its own descendants
      let ancestorId: ID | null | undefined = tgtNode.parent;
      while (ancestorId) {
        if (ancestorId === sourceId) return;
        ancestorId = document.nodes[ancestorId]?.parent;
      }

      const nextNodes = { ...document.nodes };
      const nextPages = { ...document.pages };
      let pageChildren = [...page.children];

      // Remove sourceId from its current container
      const prevParentId = srcNode.parent;
      if (prevParentId && nextNodes[prevParentId]) {
        const prevParent = nextNodes[prevParentId];
        nextNodes[prevParentId] = {
          ...prevParent,
          children: (prevParent.children || []).filter((id) => id !== sourceId),
        };
      } else {
        pageChildren = pageChildren.filter((id) => id !== sourceId);
      }

      // Determine destination container
      const isContainerTarget =
        tgtNode.type === 'group' ||
        tgtNode.type === 'frame' ||
        tgtNode.type === 'component' ||
        tgtNode.type === 'instance';
      if (isContainerTarget && position === 'inside') {
        // Drop directly inside group folder
        const tgtChildren = tgtNode.children ? [...tgtNode.children] : [];
        if (!tgtChildren.includes(sourceId)) {
          tgtChildren.push(sourceId);
        }
        nextNodes[targetId] = {
          ...tgtNode,
          children: tgtChildren,
        };
        nextNodes[sourceId] = {
          ...srcNode,
          parent: targetId,
        };
      } else if (tgtNode.parent && nextNodes[tgtNode.parent]) {
        // Target is inside a group/frame: insert source into the same container next to target
        const parentId = tgtNode.parent;
        const parent = nextNodes[parentId];
        const list = parent.children ? [...parent.children] : [];
        const tgtIdx = list.indexOf(targetId);
        const insertIdx = position === 'before' ? Math.max(0, tgtIdx) : tgtIdx + 1;
        if (tgtIdx !== -1) {
          list.splice(insertIdx, 0, sourceId);
        } else {
          list.push(sourceId);
        }
        nextNodes[parentId] = {
          ...parent,
          children: list,
        };
        nextNodes[sourceId] = {
          ...srcNode,
          parent: parentId,
        };
      } else {
        // Target is at root level: insert source into page.children next to target
        const tgtIdx = pageChildren.indexOf(targetId);
        const insertIdx = position === 'before' ? Math.max(0, tgtIdx) : tgtIdx + 1;
        if (tgtIdx !== -1) {
          pageChildren.splice(insertIdx, 0, sourceId);
        } else {
          pageChildren.push(sourceId);
        }
        nextNodes[sourceId] = {
          ...srcNode,
          parent: null,
        };
      }

      nextPages[activePageId] = {
        ...page,
        children: pageChildren,
      };

      const nextDocument = {
        ...document,
        nodes: nextNodes,
        pages: nextPages,
        updatedAt: new Date().toISOString(),
      };

      executeCommand(new DocumentSnapshotCommand(nextDocument, document, 'Reorder layers'));
    },
  };
});
