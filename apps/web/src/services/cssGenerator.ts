import { SceneNode } from '@figma-app/shared-types';

export interface GeneratedCss {
  selector: string;
  styles: Record<string, string>;
  cssString: string;
}

export function generateNodeCss(node: SceneNode): GeneratedCss {
  const styles: Record<string, string> = {};

  /*
  // Dimensions & Position
  styles['position'] = 'absolute';
  styles['left'] = `${Math.round(node.transform.x)}px`;
  styles['top'] = `${Math.round(node.transform.y)}px`;
  styles['width'] = `${Math.round(node.transform.width)}px`;
  styles['height'] = `${Math.round(node.transform.height)}px`;
  */

  // Box Sizing & Dimensions (Figma pattern)
  styles['box-sizing'] = 'border-box';
  styles['width'] = `${Math.round(node.transform.width)}px`;
  styles['height'] = `${Math.round(node.transform.height)}px`;

  // In Figma, only layers explicitly configured with absolute positioning get position: absolute
  if ((node as any).layoutPositioning === 'absolute' || (node as any).isAbsolute) {
    styles['position'] = 'absolute';
    styles['left'] = `${Math.round(node.transform.x)}px`;
    styles['top'] = `${Math.round(node.transform.y)}px`;
  }

  // Auto Layout / Flexbox (if frame with layoutMode)
  if (node.type === 'frame') {
    const frameNode = node as any;
    if (frameNode.layoutMode && frameNode.layoutMode !== 'none') {
      styles['display'] = 'flex';
      styles['flex-direction'] = frameNode.layoutMode === 'vertical' ? 'column' : 'row';
      if (typeof frameNode.itemSpacing === 'number' && frameNode.itemSpacing > 0) {
        styles['gap'] = `${frameNode.itemSpacing}px`;
      }
      if (frameNode.padding) {
        const { top = 0, right = 0, bottom = 0, left = 0 } = frameNode.padding;
        if (top || right || bottom || left) {
          styles['padding'] = `${top}px ${right}px ${bottom}px ${left}px`;
        }
      }
    }
  }

  if (node.transform.rotation) {
    styles['transform'] = `rotate(${node.transform.rotation}deg)`;
  }

  // Fills & Background (In Figma: background-color applies to shapes/frames; text uses color)
  const visibleFill = node.fills?.find((f) => f.visible !== false);
  if (visibleFill && node.type !== 'text') {
    if (visibleFill.type === 'solid' && visibleFill.color) {
      styles['background-color'] = visibleFill.color;
      if (typeof visibleFill.opacity === 'number' && visibleFill.opacity < 1) {
        styles['opacity'] = visibleFill.opacity.toString();
      }
    }
  }

  // Border & Stroke
  const visibleStroke = node.strokes?.find((s) => s.visible !== false);
  if (visibleStroke && visibleStroke.width) {
    styles['border'] = `${visibleStroke.width}px solid ${visibleStroke.color}`;
  }

  // Corner Radius
  if (typeof node.cornerRadius === 'number' && node.cornerRadius > 0) {
    styles['border-radius'] = `${node.cornerRadius}px`;
  }

  // Effects (Box Shadow)
  const visibleEffect = node.effects?.find((e) => e.visible !== false && e.type === 'drop-shadow');
  if (visibleEffect) {
    const ox = visibleEffect.offset?.x ?? 0;
    const oy = visibleEffect.offset?.y ?? 4;
    const blur = visibleEffect.radius ?? 12;
    const col = visibleEffect.color || 'rgba(0, 0, 0, 0.15)';
    styles['box-shadow'] = `${ox}px ${oy}px ${blur}px ${col}`;
  }

  // Typography for Text nodes
  if (node.type === 'text') {
    const textNode = node as any;
    if (textNode.fontFamily) styles['font-family'] = `'${textNode.fontFamily}', sans-serif`;
    styles['font-style'] = 'normal';
    if (textNode.fontWeight) styles['font-weight'] = textNode.fontWeight.toString();
    if (textNode.fontSize) styles['font-size'] = `${textNode.fontSize}px`;
    styles['line-height'] = textNode.lineHeight ? `${textNode.lineHeight}px` : '1.4';
    if (textNode.textAlign) styles['text-align'] = textNode.textAlign;
    if (visibleFill?.color) styles['color'] = visibleFill.color;
  }

  const cssLines = Object.entries(styles).map(([prop, val]) => `  ${prop}: ${val};`);
  const selector = `.${node.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-') || 'layer'}`;
  const cssString = `${selector} {\n${cssLines.join('\n')}\n}`;

  return { selector, styles, cssString };
}
