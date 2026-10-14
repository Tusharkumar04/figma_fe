import { DocumentModel, SceneNode } from '@figma-app/shared-types';
import { useEditorStore } from '../store/editorStore';

// export type ExportFormat = 'png' | 'jpg' | 'svg' | 'json';
export type ExportFormat = 'png' | 'jpg' | 'svg' | 'json' | 'pdf';

export function exportDocumentToJson(doc: DocumentModel): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(doc, null, 2));
  downloadFile(dataStr, `${doc.title.replace(/\s+/g, '_')}.figma.json`);
}

function getChildrenOf(parentId: string, nodes: Record<string, SceneNode>): string[] {
  const parent = nodes[parentId];
  const explicit = (parent?.children || []).filter((id) => nodes[id]);
  const byParent = Object.keys(nodes).filter((id) => nodes[id]?.parent === parentId);
  return Array.from(new Set([...explicit, ...byParent]));
}

function isVisible(node: SceneNode, nodes: Record<string, SceneNode>): boolean {
  let current: SceneNode | undefined = node;
  while (current) {
    if (current.visible === false) return false;
    current = current.parent ? nodes[current.parent] : undefined;
  }
  return true;
}

export function flattenVisibleNodes(doc: DocumentModel): SceneNode[] {
  const activePage = doc.pages[doc.activePageId];
  const result: SceneNode[] = [];
  const visited = new Set<string>();
  const walk = (ids: string[]) => {
    ids.forEach((id) => {
      const node = doc.nodes[id];
      if (!node || visited.has(id) || !isVisible(node, doc.nodes)) return;
      visited.add(id);
      result.push(node);
      walk(getChildrenOf(id, doc.nodes));
    });
  };
  walk(activePage ? activePage.children : []);
  return result;
}

export function starPoints(cx: number, cy: number, rx: number, ry: number, numPoints: number, innerRadius?: number): string {
  const outer = Math.max(rx, ry);
  const inner = innerRadius && innerRadius > 0 ? innerRadius : outer * 0.4;
  const ratio = Math.min(1, inner / outer);
  const points: string[] = [];
  for (let i = 0; i < numPoints * 2; i++) {
    const angle = (Math.PI / numPoints) * i - Math.PI / 2;
    const factor = i % 2 === 0 ? 1 : ratio;
    points.push(`${(cx + rx * factor * Math.cos(angle)).toFixed(2)},${(cy + ry * factor * Math.sin(angle)).toFixed(2)}`);
  }
  return points.join(' ');
}

export function regularPolygonPoints(cx: number, cy: number, rx: number, ry: number, sides: number): string {
  const points: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    points.push(`${(cx + rx * Math.cos(angle)).toFixed(2)},${(cy + ry * Math.sin(angle)).toFixed(2)}`);
  }
  return points.join(' ');
}

export function exportDocumentToSvg(doc: DocumentModel): void {
  const nodes = flattenVisibleNodes(doc);

  if (nodes.length === 0) {
    alert('No layers to export');
    return;
  }

  // Calculate bounding box
  const minX = Math.min(...nodes.map((n) => n.transform.x));
  const minY = Math.min(...nodes.map((n) => n.transform.y));
  const maxX = Math.max(...nodes.map((n) => n.transform.x + n.transform.width));
  const maxY = Math.max(...nodes.map((n) => n.transform.y + n.transform.height));
  const width = Math.max(100, maxX - minX);
  const height = Math.max(100, maxY - minY);

  const svgElements = nodes.map((node) => {
    const fill = node.fills?.find((f) => f.visible !== false)?.color || 'transparent';
    const stroke = node.strokes?.find((s) => s.visible !== false);
    const strokeAttr = stroke ? `stroke="${stroke.color}" stroke-width="${stroke.width}"` : '';
    const rotationAttr = node.transform.rotation
      ? ` transform="rotate(${node.transform.rotation} ${(node.transform.x - minX + node.transform.width / 2).toFixed(2)} ${(node.transform.y - minY + node.transform.height / 2).toFixed(2)})"`
      : '';
    const opacityAttr = typeof node.opacity === 'number' && node.opacity < 1 ? ` opacity="${node.opacity}"` : '';
    const x = node.transform.x - minX;
    const y = node.transform.y - minY;

    if (node.type === 'text') {
      const textNode = node as any;
      const baseline = (textNode.fontSize || 16) * 0.8;
      const anchor = textNode.textAlign === 'center' ? 'middle' : textNode.textAlign === 'right' ? 'end' : 'start';
      const anchorX =
        textNode.textAlign === 'center'
          ? x + node.transform.width / 2
          : textNode.textAlign === 'right'
          ? x + node.transform.width
          : x;
      const weightAttr = Number(textNode.fontWeight) >= 600 ? ' font-weight="bold"' : ` font-weight="${textNode.fontWeight || 400}"`;
      return `<text x="${anchorX}" y="${y + baseline}" font-family="${textNode.fontFamily || 'Inter'}" font-size="${textNode.fontSize || 16}"${weightAttr} text-anchor="${anchor}" fill="${fill}"${rotationAttr}${opacityAttr}>${escapeXml(textNode.content || '')}</text>`;
    }

    if (node.type === 'rect' || node.type === 'frame' || node.type === 'component' || node.type === 'instance') {
      const rx = typeof node.cornerRadius === 'number' ? `rx="${node.cornerRadius}"` : '';
      return `<rect x="${x}" y="${y}" width="${node.transform.width}" height="${node.transform.height}" fill="${fill}" ${strokeAttr} ${rx}${rotationAttr}${opacityAttr} />`;
    }

    if (node.type === 'ellipse') {
      const cx = x + node.transform.width / 2;
      const cy = y + node.transform.height / 2;
      return `<ellipse cx="${cx}" cy="${cy}" rx="${node.transform.width / 2}" ry="${node.transform.height / 2}" fill="${fill}" ${strokeAttr}${rotationAttr}${opacityAttr} />`;
    }

    if (node.type === 'star') {
      const cx = x + node.transform.width / 2;
      const cy = y + node.transform.height / 2;
      const points = starPoints(
        cx,
        cy,
        node.transform.width / 2,
        node.transform.height / 2,
        (node as any).numPoints || 5,
        (node as any).innerRadius
      );
      return `<polygon points="${points}" fill="${fill}" ${strokeAttr}${rotationAttr}${opacityAttr} />`;
    }

    if (node.type === 'polygon') {
      const cx = x + node.transform.width / 2;
      const cy = y + node.transform.height / 2;
      const points = regularPolygonPoints(
        cx,
        cy,
        node.transform.width / 2,
        node.transform.height / 2,
        (node as any).sides || 3
      );
      return `<polygon points="${points}" fill="${fill}" ${strokeAttr}${rotationAttr}${opacityAttr} />`;
    }

    if (node.type === 'line') {
      const pathPoints = (node as any).points as number[] | undefined;
      const lineColor = stroke?.color || fill;
      if (pathPoints && pathPoints.length >= 4) {
        const pairs: string[] = [];
        for (let i = 0; i < pathPoints.length; i += 2) {
          pairs.push(`${(x + pathPoints[i]).toFixed(2)},${(y + pathPoints[i + 1]).toFixed(2)}`);
        }
        return `<polyline points="${pairs.join(' ')}" fill="none" stroke="${lineColor}" stroke-width="${stroke?.width || 2}" stroke-linecap="round" stroke-linejoin="round"${rotationAttr}${opacityAttr} />`;
      }
      return `<line x1="${x}" y1="${y}" x2="${x + node.transform.width}" y2="${y + node.transform.height}" stroke="${lineColor}" stroke-width="${stroke?.width || 2}"${rotationAttr}${opacityAttr} />`;
    }

    return '';
  });

  /*
  Original single-level export pass kept for reference:
  const activePage = doc.pages[doc.activePageId];
  const nodeIds = activePage ? activePage.children : [];
  const nodes = nodeIds.map((id) => doc.nodes[id]).filter(Boolean);

  if (nodes.length === 0) {
    alert('No layers to export');
    return;
  }

  // Calculate bounding box
  const minX = Math.min(...nodes.map((n) => n.transform.x));
  const minY = Math.min(...nodes.map((n) => n.transform.y));
  const maxX = Math.max(...nodes.map((n) => n.transform.x + n.transform.width));
  const maxY = Math.max(...nodes.map((n) => n.transform.y + n.transform.height));
  const width = Math.max(100, maxX - minX);
  const height = Math.max(100, maxY - minY);

  const svgElements = nodes.map((node) => {
    const fill = node.fills?.find((f) => f.visible !== false)?.color || 'transparent';
    const stroke = node.strokes?.find((s) => s.visible !== false);
    const strokeAttr = stroke ? `stroke="${stroke.color}" stroke-width="${stroke.width}"` : '';

    if (node.type === 'rect' || node.type === 'frame') {
      const rx = typeof node.cornerRadius === 'number' ? `rx="${node.cornerRadius}"` : '';
      return `<rect x="${node.transform.x - minX}" y="${node.transform.y - minY}" width="${node.transform.width}" height="${node.transform.height}" fill="${fill}" ${strokeAttr} ${rx} />`;
    }

    if (node.type === 'ellipse') {
      const cx = node.transform.x - minX + node.transform.width / 2;
      const cy = node.transform.y - minY + node.transform.height / 2;
      return `<ellipse cx="${cx}" cy="${cy}" rx="${node.transform.width / 2}" ry="${node.transform.height / 2}" fill="${fill}" ${strokeAttr} />`;
    }

    if (node.type === 'text') {
      const textNode = node as any;
      return `<text x="${node.transform.x - minX}" y="${node.transform.y - minY + 20}" font-family="${textNode.fontFamily || 'Inter'}" font-size="${textNode.fontSize || 16}" fill="${fill}">${escapeXml(textNode.content || '')}</text>`;
    }

    return '';
  });

  */

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${svgElements.join('\n  ')}
</svg>`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  downloadFile(url, `${doc.title.replace(/\s+/g, '_')}.svg`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/*
Original raster export captured the whole visible canvas viewport:
export function exportCanvasToRaster(
  format: 'png' | 'jpg',
  docTitle: string,
  pixelRatio = 2
): void {
  const konvaStageCanvas = window.document.querySelector('.canvas-grid canvas') as HTMLCanvasElement;
  if (!konvaStageCanvas) {
    alert('Canvas element not found for export');
    return;
  }

  try {
    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const dataUrl = konvaStageCanvas.toDataURL(mimeType, 0.95);
    downloadFile(dataUrl, `${docTitle.replace(/\s+/g, '_')}.${format}`);
  } catch (err) {
    console.error('Failed to export canvas image:', err);
    alert('Export error occurred. Please try again.');
  }
}
*/

export function captureDesignDataUrl(format: 'png' | 'jpg'): string | null {
  const konvaStageCanvas = window.document.querySelector('.canvas-grid canvas') as HTMLCanvasElement;
  if (!konvaStageCanvas) {
    alert('Canvas element not found for export');
    return null;
  }

  const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
  const state = useEditorStore.getState();
  const page = state.document.pages[state.activePageId];
  const roots = (page?.children || [])
    .map((id) => state.document.nodes[id])
    .filter((node): node is SceneNode => Boolean(node) && node!.visible !== false);

  if (roots.length > 0) {
    const minX = Math.min(...roots.map((n) => n.transform.x));
    const minY = Math.min(...roots.map((n) => n.transform.y));
    const maxX = Math.max(...roots.map((n) => n.transform.x + n.transform.width));
    const maxY = Math.max(...roots.map((n) => n.transform.y + n.transform.height));

    const deviceScale =
      konvaStageCanvas.clientWidth > 0 ? konvaStageCanvas.width / konvaStageCanvas.clientWidth : 1;
    const sourceX = (state.pan.x + minX * state.zoom) * deviceScale;
    const sourceY = (state.pan.y + minY * state.zoom) * deviceScale;
    const sourceW = Math.max(1, (maxX - minX) * state.zoom * deviceScale);
    const sourceH = Math.max(1, (maxY - minY) * state.zoom * deviceScale);

    const cropX = Math.max(0, sourceX);
    const cropY = Math.max(0, sourceY);
    const cropW = Math.min(konvaStageCanvas.width, sourceX + sourceW) - cropX;
    const cropH = Math.min(konvaStageCanvas.height, sourceY + sourceH) - cropY;

    if (cropW > 4 && cropH > 4) {
      const output = window.document.createElement('canvas');
      const scale = 2;
      output.width = Math.round(cropW * scale);
      output.height = Math.round(cropH * scale);
      const ctx = output.getContext('2d');
      if (ctx) {
        ctx.fillStyle = format === 'jpg' ? '#ffffff' : page?.background || '#1e1e24';
        ctx.fillRect(0, 0, output.width, output.height);
        ctx.drawImage(konvaStageCanvas, cropX, cropY, cropW, cropH, 0, 0, output.width, output.height);
        return output.toDataURL(mimeType, 0.95);
      }
    }
  }

  return konvaStageCanvas.toDataURL(mimeType, 0.95);
}

export function exportCanvasToRaster(
  format: 'png' | 'jpg',
  docTitle: string,
  pixelRatio = 2
): void {
  try {
    const dataUrl = captureDesignDataUrl(format);
    if (!dataUrl) return;
    downloadFile(dataUrl, `${docTitle.replace(/\s+/g, '_')}.${format}`);
  } catch (err) {
    console.error('Failed to export canvas image:', err);
    alert('Export error occurred. Please try again.');
  }
}

export function exportDocumentToPdf(docTitle: string, doc?: DocumentModel): void {
  try {
    const imgData = captureDesignDataUrl('png');
    if (!imgData) return;
    const title = doc ? doc.title : docTitle;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title} - Export PDF</title>
            <style>
              @page { size: auto; margin: 0; }
              body { margin: 0; display: flex; justify-content: center; align-items: center; background: #fff; min-height: 100vh; }
              img { max-width: 100%; max-height: 100vh; object-fit: contain; }
            </style>
          </head>
          <body>
            <img src="${imgData}" onload="setTimeout(() => { window.print(); }, 250);" />
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  } catch (err) {
    console.error('Failed to export PDF:', err);
    alert('PDF export failed. Please try again.');
  }
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function downloadFile(url: string, filename: string): void {
  if (typeof window === 'undefined' || !window.document) return;
  const a = window.document.createElement('a');
  a.href = url;
  a.download = filename;
  window.document.body.appendChild(a);
  a.click();
  a.remove();
}
