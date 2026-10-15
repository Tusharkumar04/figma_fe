import { DocumentModel, Page, SceneNode, NodeType, ID } from '@figma-app/shared-types';

export function createId(prefix = 'node'): ID {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
}

export function createDefaultDocument(title = 'Untitled Design'): DocumentModel {
  const pageId = createId('page');
  const now = new Date().toISOString();

  const defaultPage: Page = {
    id: pageId,
    name: 'Page 1',
    children: [],
    background: '#1e1e24',
  };

  return {
    id: createId('doc'),
    schemaVersion: 1,
    title,
    pages: {
      [pageId]: defaultPage,
    },
    activePageId: pageId,
    nodes: {},
    createdAt: now,
    updatedAt: now,
  };
}

export function measureTextBounds(
  text: string,
  fontSize: number = 20,
  fontFamily: string = 'Inter',
  fontWeight: number | string = 500
): { width: number; height: number } {
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}, sans-serif`;
      const lines = (text || '').split('\n');
      let maxWidth = 0;
      for (const line of lines) {
        const metrics = ctx.measureText(line);
        if (metrics.width > maxWidth) {
          maxWidth = metrics.width;
        }
      }
      const lineHeight = Math.round(fontSize * 1.25);
      return {
        width: Math.ceil(Math.max(10, maxWidth)),
        height: Math.ceil(Math.max(fontSize, lines.length * lineHeight)),
      };
    }
  }
  const lines = (text || '').split('\n');
  const maxLen = Math.max(...lines.map((l) => l.length), 1);
  return {
    width: Math.ceil(maxLen * fontSize * 0.6),
    height: Math.ceil(lines.length * fontSize * 1.25),
  };
}

export function createNode(type: NodeType, overrides: Partial<SceneNode> = {}): SceneNode {
  const id = createId(type);
  const baseDefaults: Partial<SceneNode> = {
    id,
    name: type.charAt(0).toUpperCase() + type.slice(1),
    type,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 100, y: 100, width: 120, height: 120, rotation: 0 },
    fills: [{ id: createId('fill'), type: 'solid', color: '#3b82f6', opacity: 1, visible: true }],
    strokes: [],
    effects: [],
  };

  if (type === 'frame') {
    return {
      ...baseDefaults,
      name: 'Frame',
      transform: { x: 100, y: 100, width: 375, height: 812, rotation: 0 },
      fills: [{ id: createId('fill'), type: 'solid', color: '#ffffff', opacity: 1, visible: true }],
      children: [],
      clipContent: true,
      ...overrides,
    } as SceneNode;
  }

  if (type === 'text') {
    /*
    return {
      ...baseDefaults,
      name: 'Text',
      transform: { x: 100, y: 100, width: 200, height: 40, rotation: 0 },
      fills: [{ id: createId('fill'), type: 'solid', color: '#ffffff', opacity: 1, visible: true }],
      content: 'Type something...',
      fontFamily: 'Inter',
      fontSize: 20,
      fontWeight: 500,
      textAlign: 'left',
      ...overrides,
    } as SceneNode;
    */
    const content = (overrides as any)?.content || 'Type something...';
    const fontSize = (overrides as any)?.fontSize || 20;
    const fontFamily = (overrides as any)?.fontFamily || 'Inter';
    const fontWeight = (overrides as any)?.fontWeight || 500;
    const bounds = measureTextBounds(content, fontSize, fontFamily, fontWeight);

    return {
      ...baseDefaults,
      name: 'Text',
      transform: {
        x: overrides.transform?.x ?? 100,
        y: overrides.transform?.y ?? 100,
        width: overrides.transform?.width ?? bounds.width,
        height: overrides.transform?.height ?? bounds.height,
        rotation: overrides.transform?.rotation ?? 0,
      },
      fills: [{ id: createId('fill'), type: 'solid', color: '#ffffff', opacity: 1, visible: true }],
      content,
      fontFamily,
      fontSize,
      fontWeight,
      textAlign: 'left',
      ...overrides,
    } as SceneNode;
  }

  if (type === 'textOnPath') {
    const content = (overrides as any)?.content || 'Curved Text on Path';
    const fontSize = (overrides as any)?.fontSize || 18;
    const fontFamily = (overrides as any)?.fontFamily || 'Inter';
    const fontWeight = (overrides as any)?.fontWeight || 500;
    const radius = (overrides as any)?.radius || 80;
    const arcAngle = (overrides as any)?.arcAngle || 270;
    const startAngle = (overrides as any)?.startAngle || -225;

    return {
      ...baseDefaults,
      name: 'Text on Path',
      transform: {
        x: overrides.transform?.x ?? 150,
        y: overrides.transform?.y ?? 150,
        width: overrides.transform?.width ?? radius * 2 + 40,
        height: overrides.transform?.height ?? radius * 2 + 40,
        rotation: overrides.transform?.rotation ?? 0,
      },
      fills: [{ id: createId('fill'), type: 'solid', color: '#000000', opacity: 1, visible: true }],
      content,
      fontFamily,
      fontSize,
      fontWeight,
      radius,
      innerRadius: radius - fontSize - 10,
      arcAngle,
      startAngle,
      ...overrides,
    } as SceneNode;
  }

  if (type === 'ellipse') {
    return {
      ...baseDefaults,
      name: 'Ellipse',
      fills: [{ id: createId('fill'), type: 'solid', color: '#10b981', opacity: 1, visible: true }],
      ...overrides,
    } as SceneNode;
  }

  if (type === 'star') {
    return {
      ...baseDefaults,
      name: 'Star',
      numPoints: 5,
      innerRadius: 24,
      ...overrides,
    } as SceneNode;
  }

  if (type === 'polygon') {
    return {
      ...baseDefaults,
      name: 'Polygon',
      sides: 3,
      ...overrides,
    } as SceneNode;
  }

  return {
    ...baseDefaults,
    ...overrides,
  } as SceneNode;
}

export function cloneNode(node: SceneNode, idMap: Map<ID, ID> = new Map()): SceneNode {
  const newId = createId(node.type);
  idMap.set(node.id, newId);

  const cloned: SceneNode = JSON.parse(JSON.stringify(node));
  cloned.id = newId;
  cloned.name = `${cloned.name} (Copy)`;
  cloned.transform.x += 20;
  cloned.transform.y += 20;

  if (cloned.children && cloned.children.length > 0) {
    cloned.children = cloned.children.map((childId) => idMap.get(childId) || childId);
  }

  return cloned;
}
