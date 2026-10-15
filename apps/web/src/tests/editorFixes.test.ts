import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useEditorStore } from '../store/editorStore';
import { createDefaultDocument, createNode } from '@figma-app/document-model';
import {
  flattenVisibleNodes,
  starPoints,
  regularPolygonPoints,
  exportDocumentToSvg,
} from '../services/exportEngine';

describe('Editor fixes - canvas viewport, path tools, components, layer ordering', () => {
  beforeEach(() => {
    useEditorStore.getState().loadDocument(createDefaultDocument('Test File'));
  });

  it('zoomToFit frames the page content inside the viewport', () => {
    const store = useEditorStore.getState();
    store.setViewportSize(1000, 600);
    store.addNode('rect', { transform: { x: 0, y: 0, width: 400, height: 300, rotation: 0 } });

    useEditorStore.getState().zoomToFit();
    const { zoom, pan } = useEditorStore.getState();

    expect(zoom).toBeGreaterThanOrEqual(0.1);
    expect(zoom).toBeLessThanOrEqual(5);
    // Content centre (200,150) must land in the middle of the 1000x600 viewport
    expect(Math.round(200 * zoom + pan.x)).toBe(500);
    expect(Math.round(150 * zoom + pan.y)).toBe(300);
  });

  it('zoomToFit resets the viewport when the page is empty', () => {
    const store = useEditorStore.getState();
    store.zoomToFit();
    expect(useEditorStore.getState().zoom).toBe(1);
    expect(useEditorStore.getState().pan).toEqual({ x: 0, y: 0 });
  });

  it('clamps zoom for both direct and functional updates', () => {
    const store = useEditorStore.getState();
    store.setZoom(50);
    expect(useEditorStore.getState().zoom).toBe(5);
    useEditorStore.getState().setZoom((z) => z - 100);
    expect(useEditorStore.getState().zoom).toBe(0.1);
  });

  it('keeps the drawing tool active when a path layer is created with keepTool', () => {
    const store = useEditorStore.getState();
    store.setActiveTool('pencil');
    useEditorStore.getState().addNode(
      'line',
      {
        points: [0, 0, 20, 10, 40, 0],
        fills: [],
        strokes: [{ id: 's_test', color: '#ffffff', width: 2, visible: true }],
      },
      true
    );

    const state = useEditorStore.getState();
    expect(state.activeTool).toBe('pencil');
    const createdId = state.selectedIds[0];
    const created = state.document.nodes[createdId];
    expect(created).toBeDefined();
    expect((created as any).points).toEqual([0, 0, 20, 10, 40, 0]);
    expect(created.strokes).toHaveLength(1);
  });

  it('creates a component from the selection and inserts an instance', () => {
    const store = useEditorStore.getState();
    const rect = createNode('rect', { name: 'Badge', transform: { x: 10, y: 10, width: 40, height: 40 } });
    useEditorStore.getState().addNode('rect', rect);
    const rectId = useEditorStore.getState().selectedIds[0];

    useEditorStore.getState().createComponentFromSelection();
    const componentId = useEditorStore.getState().selectedIds[0];
    const component = useEditorStore.getState().document.nodes[componentId];
    expect(component.type).toBe('component');
    expect(component.children).toContain(rectId);
    expect(useEditorStore.getState().document.nodes[rectId].parent).toBe(componentId);

    useEditorStore.getState().insertInstance(componentId);
    const instanceId = useEditorStore.getState().selectedIds[0];
    const instance = useEditorStore.getState().document.nodes[instanceId];
    expect(instance.type).toBe('instance');
    expect(instance.transform.x).toBe(component.transform.x + 40);

    // Undo removes the instance again
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().document.nodes[instanceId]).toBeUndefined();
    expect(useEditorStore.getState().document.nodes[componentId]).toBeDefined();
  });

  it('reorders layers through history and restores them on undo', () => {
    const store = useEditorStore.getState();
    store.addNode('rect', { name: 'A' });
    const a = useEditorStore.getState().selectedIds[0];
    useEditorStore.getState().addNode('rect', { name: 'B' });
    const b = useEditorStore.getState().selectedIds[0];

    const pageId = useEditorStore.getState().activePageId;
    expect(useEditorStore.getState().document.pages[pageId].children).toEqual([a, b]);

    useEditorStore.getState().reorderLayers(a, b, 'after');
    expect(useEditorStore.getState().document.pages[pageId].children).toEqual([b, a]);

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().document.pages[pageId].children).toEqual([a, b]);
  });

  it('nests a layer inside a frame when dropped with the inside position', () => {
    const store = useEditorStore.getState();
    store.addNode('frame', { name: 'Screen', transform: { x: 0, y: 0, width: 200, height: 200 } });
    const frameId = useEditorStore.getState().selectedIds[0];
    useEditorStore.getState().addNode('rect', { name: 'Child' });
    const rectId = useEditorStore.getState().selectedIds[0];

    const pageId = useEditorStore.getState().activePageId;
    useEditorStore.getState().reorderLayers(rectId, frameId, 'inside');

    const doc = useEditorStore.getState().document;
    expect(doc.nodes[rectId].parent).toBe(frameId);
    expect(doc.nodes[frameId].children).toContain(rectId);
    expect(doc.pages[pageId].children).not.toContain(rectId);
  });

  it('refuses to re-parent a container into one of its own children', () => {
    const store = useEditorStore.getState();
    store.addNode('frame', { name: 'Outer', transform: { x: 0, y: 0, width: 200, height: 200 } });
    const frameId = useEditorStore.getState().selectedIds[0];
    useEditorStore.getState().addNode('rect', { name: 'Inner' });
    const rectId = useEditorStore.getState().selectedIds[0];
    useEditorStore.getState().reorderLayers(rectId, frameId, 'inside');

    const childrenBefore = useEditorStore.getState().document.nodes[frameId].children;
    useEditorStore.getState().reorderLayers(frameId, rectId, 'inside');
    expect(useEditorStore.getState().document.nodes[frameId].children).toEqual(childrenBefore);
  });

  it('clears stale selections after undo deletes the selected layer', () => {
    const store = useEditorStore.getState();
    store.addNode('rect', { name: 'Temp' });
    const tempId = useEditorStore.getState().selectedIds[0];
    expect(useEditorStore.getState().selectedIds).toEqual([tempId]);

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().document.nodes[tempId]).toBeUndefined();
    expect(useEditorStore.getState().selectedIds).toEqual([]);
  });

  it('tracks comments and resolves them', () => {
    const store = useEditorStore.getState();
    const before = useEditorStore.getState().comments.length;
    store.addComment('Looks good', { x: 120, y: 80 });
    expect(useEditorStore.getState().comments.length).toBe(before + 1);
    const lastComment = useEditorStore.getState().comments[useEditorStore.getState().comments.length - 1];
    expect(lastComment.content).toBe('Looks good');
    useEditorStore.getState().resolveComment(lastComment.id);
    expect(
      useEditorStore.getState().comments.find((c) => c.id === lastComment.id)?.resolved
    ).toBe(true);
  });

  it('updates text content and keeps bounds in sync', () => {
    const store = useEditorStore.getState();
    store.addNode('text', { content: 'Hi' });
    const textId = useEditorStore.getState().selectedIds[0];
    const before = useEditorStore.getState().document.nodes[textId].transform.width;

    useEditorStore.getState().updateNode(textId, { content: 'A much longer headline' } as any);
    const after = useEditorStore.getState().document.nodes[textId].transform.width;
    expect(after).toBeGreaterThan(before);
    expect((useEditorStore.getState().document.nodes[textId] as any).content).toBe(
      'A much longer headline'
    );
  });

  it('normalises incomplete documents when loading a file or cache entry', () => {
    useEditorStore.getState().loadDocument({
      id: 'doc_partial',
      schemaVersion: 1,
      title: 'Imported',
      activePageId: 'page_x',
      pages: { page_x: { id: 'page_x', name: 'Page 1', children: ['rect_partial'], background: '#1e1e24' } },
      nodes: {
        rect_partial: { id: 'rect_partial', name: 'Partial', type: 'rect' } as any,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    const node = useEditorStore.getState().document.nodes['rect_partial'];
    expect(node.fills).toEqual([]);
    expect(node.strokes).toEqual([]);
    expect(node.effects).toEqual([]);
    expect(node.visible).toBe(true);
    expect(node.locked).toBe(false);
    expect(node.opacity).toBe(1);
    expect(node.transform).toEqual({ x: 0, y: 0, width: 100, height: 100, rotation: 0 });
  });

  it('keeps collaborators in sync as presence messages arrive and leave', () => {
    const store = useEditorStore.getState();
    store.upsertCollaborator({ id: 'peer-9', name: 'Alex', color: '#10b981', cursor: { x: 10, y: 20 } });
    expect(useEditorStore.getState().collaborators['peer-9']).toEqual({
      id: 'peer-9',
      name: 'Alex',
      color: '#10b981',
      cursor: { x: 10, y: 20 },
    });
    useEditorStore.getState().removeCollaborator('peer-9');
    expect(useEditorStore.getState().collaborators['peer-9']).toBeUndefined();
  });
});

describe('Export helpers', () => {
  it('walks nested layers recursively and skips hidden subtrees', () => {
    const doc = createDefaultDocument('Nested');
    const frame = createNode('frame', { name: 'Frame', transform: { x: 0, y: 0, width: 300, height: 300 } });
    const child = createNode('rect', { name: 'Child', parent: frame.id, transform: { x: 20, y: 20, width: 100, height: 100 } });
    const hiddenGroup = createNode('group', { name: 'Hidden', visible: false, transform: { x: 0, y: 0, width: 50, height: 50 } });
    const hiddenChild = createNode('rect', { name: 'HiddenChild', parent: hiddenGroup.id, transform: { x: 0, y: 0, width: 50, height: 50 } });

    doc.nodes[frame.id] = { ...frame, children: [child.id] };
    doc.nodes[child.id] = child;
    doc.nodes[hiddenGroup.id] = { ...hiddenGroup, children: [hiddenChild.id] };
    doc.nodes[hiddenChild.id] = hiddenChild;
    doc.pages[doc.activePageId].children = [frame.id, hiddenGroup.id];

    const names = flattenVisibleNodes(doc).map((n) => n.name);
    expect(names).toEqual(['Frame', 'Child']);
  });

  it('produces star and polygon point strings', () => {
    const star = starPoints(50, 50, 40, 40, 5, 16);
    expect(star.split(' ')).toHaveLength(10);
    const triangle = regularPolygonPoints(50, 50, 40, 40, 3);
    expect(triangle.split(' ')).toHaveLength(3);
    expect(triangle.split(' ')[0].startsWith('50.00')).toBe(true);
  });

  it('serialises nested, text, star and line layers into SVG markup', () => {
    const captured: string[] = [];
    const OriginalBlob = globalThis.Blob;
    vi.stubGlobal(
      'Blob',
      class extends OriginalBlob {
        constructor(parts: BlobPart[], options?: BlobPropertyBag) {
          super(parts, options);
          captured.push(parts.join(''));
        }
      }
    );
    vi.stubGlobal('alert', () => {});

    const doc = createDefaultDocument('SVG Check');
    const frame = createNode('frame', {
      name: 'Screen',
      transform: { x: 100, y: 100, width: 400, height: 300, rotation: 0 },
      fills: [{ id: 'f_frame', type: 'solid', color: '#0f172a', opacity: 1, visible: true }],
    });
    const heading = createNode('text', {
      name: 'Heading',
      parent: frame.id,
      content: 'Hello & welcome',
      fontSize: 24,
      textAlign: 'center',
      transform: { x: 140, y: 130, width: 220, height: 30, rotation: 0 },
      fills: [{ id: 'f_text', type: 'solid', color: '#ffffff', opacity: 1, visible: true }],
    });
    const star = createNode('star', {
      name: 'Star',
      transform: { x: 520, y: 120, width: 60, height: 60, rotation: 0 },
    });
    const stroke = createNode('line', {
      name: 'Stroke',
      transform: { x: 200, y: 500, width: 100, height: 0, rotation: 0 },
      points: [0, 0, 40, 12, 100, 0],
      fills: [],
      strokes: [{ id: 's_line', color: '#3b82f6', width: 2, visible: true }],
    });

    doc.nodes[frame.id] = { ...frame, children: [heading.id] };
    doc.nodes[heading.id] = heading;
    doc.nodes[star.id] = star;
    doc.nodes[stroke.id] = stroke;
    doc.pages[doc.activePageId].children = [frame.id, star.id, stroke.id];

    exportDocumentToSvg(doc);

    const svg = captured.join('');
    expect(svg).toContain('<rect x="0" y="0" width="400" height="300"');
    expect(svg).toContain('<text x="150" y="49.2"');
    expect(svg).toContain('text-anchor="middle"');
    expect(svg).toContain('Hello &amp; welcome');
    expect(svg).toContain('<polygon points=');
    expect(svg).toContain('<polyline points="100.00,400.00 140.00,412.00 200.00,400.00"');

    vi.unstubAllGlobals();
  });
});
