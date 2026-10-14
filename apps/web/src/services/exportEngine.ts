import { DocumentModel, SceneNode } from '@figma-app/shared-types';

// export type ExportFormat = 'png' | 'jpg' | 'svg' | 'json';
export type ExportFormat = 'png' | 'jpg' | 'svg' | 'json' | 'pdf';

export function exportDocumentToJson(doc: DocumentModel): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(doc, null, 2));
  downloadFile(dataStr, `${doc.title.replace(/\s+/g, '_')}.figma.json`);
}

export function exportDocumentToSvg(doc: DocumentModel): void {
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

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${svgElements.join('\n  ')}
</svg>`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  downloadFile(url, `${doc.title.replace(/\s+/g, '_')}.svg`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

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

export function exportDocumentToPdf(docTitle: string): void {
  const konvaStageCanvas = window.document.querySelector('.canvas-grid canvas') as HTMLCanvasElement;
  if (!konvaStageCanvas) {
    alert('Canvas element not found for export');
    return;
  }

  try {
    const imgData = konvaStageCanvas.toDataURL('image/png', 1.0);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${docTitle} - Export PDF</title>
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
