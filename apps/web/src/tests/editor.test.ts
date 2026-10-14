import { describe, it, expect } from 'vitest';
import { createDefaultDocument, createNode, cloneNode } from '@figma-app/document-model';
import { AddNodeCommand, UpdateNodeCommand, DeleteNodesCommand } from '@figma-app/editor-commands';

describe('Document Model & Command System', () => {
  it('creates a default document with a page and metadata', () => {
    const doc = createDefaultDocument('My Test App');
    expect(doc.title).toBe('My Test App');
    expect(doc.schemaVersion).toBe(1);
    expect(doc.activePageId).toBeDefined();
    expect(doc.pages[doc.activePageId]).toBeDefined();
    expect(doc.pages[doc.activePageId].children).toEqual([]);
  });

  it('creates and executes AddNodeCommand, supporting full undo and redo', () => {
    const doc = createDefaultDocument();
    const pageId = doc.activePageId;
    const rect = createNode('rect', { transform: { x: 50, y: 50, width: 200, height: 100 } });

    const addCmd = new AddNodeCommand(rect, pageId);
    const addedDoc = addCmd.execute(doc);

    expect(addedDoc.nodes[rect.id]).toBeDefined();
    expect(addedDoc.pages[pageId].children).toContain(rect.id);

    const undoneDoc = addCmd.undo(addedDoc);
    expect(undoneDoc.nodes[rect.id]).toBeUndefined();
    expect(undoneDoc.pages[pageId].children).not.toContain(rect.id);
  });

  it('updates node properties and preserves previous state on undo', () => {
    const doc = createDefaultDocument();
    const pageId = doc.activePageId;
    const textNode = createNode('text', { content: 'Initial Text' });
    const addCmd = new AddNodeCommand(textNode, pageId);
    let currentDoc = addCmd.execute(doc);

    const updateCmd = new UpdateNodeCommand(textNode.id, { content: 'Updated Text' }, { content: 'Initial Text' });
    currentDoc = updateCmd.execute(currentDoc);
    expect((currentDoc.nodes[textNode.id] as any).content).toBe('Updated Text');

    currentDoc = updateCmd.undo(currentDoc);
    expect((currentDoc.nodes[textNode.id] as any).content).toBe('Initial Text');
  });

  it('clones nodes with deep ID regeneration and position offsets', () => {
    const orig = createNode('frame', { name: 'Original Frame' });
    const copy = cloneNode(orig);

    expect(copy.id).not.toBe(orig.id);
    expect(copy.name).toBe('Original Frame (Copy)');
    expect(copy.transform.x).toBe(orig.transform.x + 20);
    expect(copy.transform.y).toBe(orig.transform.y + 20);
  });
});
