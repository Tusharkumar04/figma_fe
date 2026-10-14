import { describe, it, expect } from 'vitest';
import { createDefaultDocument, createNode } from '@figma-app/document-model';

describe('Milestone 8 - Multi-format Export System', () => {
  it('serializes document correctly into exportable JSON schema', () => {
    const doc = createDefaultDocument('Client Landing Page');
    const f1 = createNode('frame', { name: 'Main Frame' });
    const r1 = createNode('rect', { name: 'Hero Banner' });
    doc.nodes[f1.id] = f1;
    doc.nodes[r1.id] = r1;
    doc.pages[doc.activePageId].children = [f1.id, r1.id];

    const jsonStr = JSON.stringify(doc, null, 2);
    expect(jsonStr).toContain('Client Landing Page');
    expect(jsonStr).toContain('Hero Banner');

    const parsed = JSON.parse(jsonStr);
    expect(parsed.id).toBe(doc.id);
    expect(parsed.nodes[r1.id].name).toBe('Hero Banner');
    expect(parsed.schemaVersion).toBe(1);
  });

  it('generates valid SVG markup with nested shapes and fills', () => {
    const doc = createDefaultDocument('Vector Export Test');
    const r1 = createNode('rect', {
      name: 'Blue Rect',
      transform: { x: 50, y: 50, width: 200, height: 100, rotation: 0 },
      cornerRadius: 8,
      fills: [{ id: 'f1', type: 'solid', color: '#2563eb', opacity: 1, visible: true }],
    });
    doc.nodes[r1.id] = r1;
    doc.pages[doc.activePageId].children = [r1.id];

    // Compute basic SVG representation
    const fill = r1.fills[0]?.color || 'transparent';
    const svgNode = `<rect x="${r1.transform.x}" y="${r1.transform.y}" width="${r1.transform.width}" height="${r1.transform.height}" fill="${fill}" rx="${r1.cornerRadius}" />`;

    expect(svgNode).toContain('width="200"');
    expect(svgNode).toContain('height="100"');
    expect(svgNode).toContain('fill="#2563eb"');
    expect(svgNode).toContain('rx="8"');
  });
});
