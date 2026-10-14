import { describe, it, expect } from 'vitest';
import { createDefaultDocument, createNode } from '@figma-app/document-model';
import {
  AddNodeCommand,
  UpdateNodeCommand,
  DeleteNodesCommand,
  MoveLayerCommand,
  AlignNodesCommand,
  DistributeNodesCommand,
  ReorderNodesCommand,
  GroupNodesCommand,
} from '@figma-app/editor-commands';

describe('Milestone 2 - Layer Ordering & Alignment Commands', () => {
  it('moves layers up, down, to front, and to back in z-order', () => {
    const doc = createDefaultDocument();
    const pageId = doc.activePageId;
    const n1 = createNode('rect', { name: 'Node 1' });
    const n2 = createNode('rect', { name: 'Node 2' });
    const n3 = createNode('rect', { name: 'Node 3' });

    let currentDoc = new AddNodeCommand(n1, pageId).execute(doc);
    currentDoc = new AddNodeCommand(n2, pageId).execute(currentDoc);
    currentDoc = new AddNodeCommand(n3, pageId).execute(currentDoc);

    expect(currentDoc.pages[pageId].children).toEqual([n1.id, n2.id, n3.id]);

    // Move Node 1 to front (top)
    const bringToFront = new MoveLayerCommand(n1.id, pageId, 'bring-to-front');
    currentDoc = bringToFront.execute(currentDoc);
    expect(currentDoc.pages[pageId].children).toEqual([n2.id, n3.id, n1.id]);

    // Undo bring to front
    currentDoc = bringToFront.undo(currentDoc);
    expect(currentDoc.pages[pageId].children).toEqual([n1.id, n2.id, n3.id]);

    // Move Node 3 to back (bottom)
    const sendToBack = new MoveLayerCommand(n3.id, pageId, 'send-to-back');
    currentDoc = sendToBack.execute(currentDoc);
    expect(currentDoc.pages[pageId].children).toEqual([n3.id, n1.id, n2.id]);
  });

  it('aligns multiple nodes along left, center, right, top, middle, bottom', () => {
    const doc = createDefaultDocument();
    const pageId = doc.activePageId;
    const n1 = createNode('rect', { transform: { x: 10, y: 20, width: 100, height: 100 } });
    const n2 = createNode('rect', { transform: { x: 50, y: 40, width: 80, height: 80 } });

    let currentDoc = new AddNodeCommand(n1, pageId).execute(doc);
    currentDoc = new AddNodeCommand(n2, pageId).execute(currentDoc);

    // Align Left
    const alignLeftCmd = new AlignNodesCommand([n1.id, n2.id], 'left');
    currentDoc = alignLeftCmd.execute(currentDoc);
    expect(currentDoc.nodes[n1.id].transform.x).toBe(10);
    expect(currentDoc.nodes[n2.id].transform.x).toBe(10);

    // Undo restore original x
    currentDoc = alignLeftCmd.undo(currentDoc);
    expect(currentDoc.nodes[n2.id].transform.x).toBe(50);
  });

  it('distributes nodes evenly horizontally and vertically', () => {
    const doc = createDefaultDocument();
    const pageId = doc.activePageId;
    const n1 = createNode('rect', { transform: { x: 0, y: 0, width: 50, height: 50 } });
    const n2 = createNode('rect', { transform: { x: 20, y: 0, width: 50, height: 50 } });
    const n3 = createNode('rect', { transform: { x: 200, y: 0, width: 50, height: 50 } });

    let currentDoc = new AddNodeCommand(n1, pageId).execute(doc);
    currentDoc = new AddNodeCommand(n2, pageId).execute(currentDoc);
    currentDoc = new AddNodeCommand(n3, pageId).execute(currentDoc);

    const distCmd = new DistributeNodesCommand([n1.id, n2.id, n3.id], 'horizontal');
    currentDoc = distCmd.execute(currentDoc);

    // Total width span = (200 + 50) - 0 = 250. Total item width = 150. Remaining space = 100 / 2 = 50 gap.
    // n1 = 0, n2 = 50 + 50 = 100, n3 = 200
    expect(currentDoc.nodes[n1.id].transform.x).toBe(0);
    expect(currentDoc.nodes[n2.id].transform.x).toBe(100);
    expect(currentDoc.nodes[n3.id].transform.x).toBe(200);

    // Undo restores
    currentDoc = distCmd.undo(currentDoc);
    expect(currentDoc.nodes[n2.id].transform.x).toBe(20);
  });

  it('reorders layers via ReorderNodesCommand with undo support', () => {
    const doc = createDefaultDocument();
    const pageId = doc.activePageId;
    const n1 = createNode('rect', { name: 'A' });
    const n2 = createNode('rect', { name: 'B' });
    const n3 = createNode('rect', { name: 'C' });

    let currentDoc = new AddNodeCommand(n1, pageId).execute(doc);
    currentDoc = new AddNodeCommand(n2, pageId).execute(currentDoc);
    currentDoc = new AddNodeCommand(n3, pageId).execute(currentDoc);

    expect(currentDoc.pages[pageId].children).toEqual([n1.id, n2.id, n3.id]);

    const reorderCmd = new ReorderNodesCommand(pageId, [n3.id, n1.id, n2.id], [n1.id, n2.id, n3.id]);
    currentDoc = reorderCmd.execute(currentDoc);
    expect(currentDoc.pages[pageId].children).toEqual([n3.id, n1.id, n2.id]);

    currentDoc = reorderCmd.undo(currentDoc);
    expect(currentDoc.pages[pageId].children).toEqual([n1.id, n2.id, n3.id]);
  });

  it('supports creating a folder inside a folder (nested groups)', () => {
    const doc = createDefaultDocument();
    const pageId = doc.activePageId;
    const item1 = createNode('rect', { name: 'Item 1' });
    const item2 = createNode('rect', { name: 'Item 2' });
    const item3 = createNode('text', { name: 'Item 3' });

    let currentDoc = new AddNodeCommand(item1, pageId).execute(doc);
    currentDoc = new AddNodeCommand(item2, pageId).execute(currentDoc);
    currentDoc = new AddNodeCommand(item3, pageId).execute(currentDoc);

    // Group item1 and item2 into Parent Folder (Group 1)
    const parentFolder = createNode('group' as any, { name: 'Parent Folder', children: [item1.id, item2.id] });
    currentDoc = new GroupNodesCommand(parentFolder, [item1.id, item2.id], pageId).execute(currentDoc);

    expect(currentDoc.nodes[parentFolder.id]).toBeDefined();
    expect(currentDoc.nodes[item1.id].parent).toBe(parentFolder.id);
    expect(currentDoc.nodes[item2.id].parent).toBe(parentFolder.id);

    // Now create a nested folder inside Parent Folder by grouping item1
    const childFolder = createNode('group' as any, { name: 'Nested Folder', children: [item1.id] });
    currentDoc = new GroupNodesCommand(childFolder, [item1.id], pageId).execute(currentDoc);

    expect(currentDoc.nodes[childFolder.id]).toBeDefined();
    expect(currentDoc.nodes[childFolder.id].parent).toBe(parentFolder.id);
    expect(currentDoc.nodes[item1.id].parent).toBe(childFolder.id);
    expect(currentDoc.nodes[parentFolder.id].children).toContain(childFolder.id);
  });
});

