import { describe, it, expect } from 'vitest';
import {
  AddNodeCommand,
  DeleteNodesCommand,
  BatchAddNodesCommand,
  BatchUpdateNodesCommand,
  GroupNodesCommand,
  UngroupNodesCommand,
} from '@figma-app/editor-commands';
import { createDefaultDocument, createNode } from '@figma-app/document-model';

describe('Milestone 3 - Advanced Editing Commands & History', () => {
  it('executes BatchAddNodesCommand and rolls back atomically on undo', () => {
    const doc = createDefaultDocument();
    const pageId = doc.activePageId;

    const n1 = createNode('rect', { name: 'Box 1', transform: { x: 50, y: 50, width: 100, height: 100, rotation: 0 } });
    const n2 = createNode('ellipse', { name: 'Circle 1', transform: { x: 200, y: 50, width: 80, height: 80, rotation: 0 } });

    const batchCmd = new BatchAddNodesCommand([n1, n2], pageId);
    const updated = batchCmd.execute(doc);

    expect(updated.nodes[n1.id]).toBeDefined();
    expect(updated.nodes[n2.id]).toBeDefined();
    expect(updated.pages[pageId].children).toContain(n1.id);
    expect(updated.pages[pageId].children).toContain(n2.id);

    const undone = batchCmd.undo(updated);
    expect(undone.nodes[n1.id]).toBeUndefined();
    expect(undone.nodes[n2.id]).toBeUndefined();
    expect(undone.pages[pageId].children).not.toContain(n1.id);
    expect(undone.pages[pageId].children).not.toContain(n2.id);
  });

  it('executes BatchUpdateNodesCommand across multiple nodes and restores previous properties on undo', () => {
    let doc = createDefaultDocument();
    const pageId = doc.activePageId;

    const n1 = createNode('rect', { transform: { x: 10, y: 10, width: 50, height: 50, rotation: 0 } });
    const n2 = createNode('rect', { transform: { x: 80, y: 80, width: 50, height: 50, rotation: 0 } });
    doc = new BatchAddNodesCommand([n1, n2], pageId).execute(doc);

    const updateCmd = new BatchUpdateNodesCommand([
      {
        id: n1.id,
        newProps: { transform: { ...n1.transform, x: 25 } },
        prevProps: { transform: { ...n1.transform } },
      },
      {
        id: n2.id,
        newProps: { transform: { ...n2.transform, x: 95 } },
        prevProps: { transform: { ...n2.transform } },
      },
    ]);

    const updated = updateCmd.execute(doc);
    expect(updated.nodes[n1.id].transform.x).toBe(25);
    expect(updated.nodes[n2.id].transform.x).toBe(95);

    const undone = updateCmd.undo(updated);
    expect(undone.nodes[n1.id].transform.x).toBe(10);
    expect(undone.nodes[n2.id].transform.x).toBe(80);
  });

  it('groups multiple nodes with GroupNodesCommand and ungroups with UngroupNodesCommand', () => {
    let doc = createDefaultDocument();
    const pageId = doc.activePageId;

    const n1 = createNode('rect', { transform: { x: 20, y: 20, width: 40, height: 40, rotation: 0 } });
    const n2 = createNode('rect', { transform: { x: 100, y: 100, width: 60, height: 60, rotation: 0 } });
    doc = new BatchAddNodesCommand([n1, n2], pageId).execute(doc);

    const groupNode = createNode('group' as any, {
      name: 'Group 1',
      transform: { x: 20, y: 20, width: 140, height: 140, rotation: 0 },
      children: [n1.id, n2.id],
    });

    const groupCmd = new GroupNodesCommand(groupNode, [n1.id, n2.id], pageId);
    const grouped = groupCmd.execute(doc);

    expect(grouped.nodes[groupNode.id]).toBeDefined();
    expect(grouped.nodes[n1.id].parent).toBe(groupNode.id);
    expect(grouped.nodes[n2.id].parent).toBe(groupNode.id);
    expect(grouped.pages[pageId].children).toContain(groupNode.id);
    expect(grouped.pages[pageId].children).not.toContain(n1.id);
    expect(grouped.pages[pageId].children).not.toContain(n2.id);

    // Test ungroup
    const ungroupCmd = new UngroupNodesCommand(groupNode.id, pageId);
    const ungrouped = ungroupCmd.execute(grouped);

    expect(ungrouped.nodes[groupNode.id]).toBeUndefined();
    expect(ungrouped.nodes[n1.id].parent).toBeNull();
    expect(ungrouped.nodes[n2.id].parent).toBeNull();
    expect(ungrouped.pages[pageId].children).toContain(n1.id);
    expect(ungrouped.pages[pageId].children).toContain(n2.id);

    // Test undo of ungroup restores the group
    const restoredGroup = ungroupCmd.undo(ungrouped);
    expect(restoredGroup.nodes[groupNode.id]).toBeDefined();
    expect(restoredGroup.nodes[n1.id].parent).toBe(groupNode.id);
  });
});
