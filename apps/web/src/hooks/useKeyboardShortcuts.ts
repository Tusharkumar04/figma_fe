import { useEffect } from 'react';
import { useEditorStore } from '../store/editorStore';

export const useKeyboardShortcuts = () => {
  const {
    undo,
    redo,
    deleteSelected,
    duplicateSelected,
    copySelected,
    cutSelected,
    pasteClipboard,
    groupSelected,
    ungroupSelected,
    setActiveTool,
    setZoom,
    selectedIds,
    setSelectedIds,
    document: doc,
    activePageId,
    batchUpdateNodes,
  } = useEditorStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Y / Cmd+Y or Ctrl+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        redo();
        return;
      }

      // Duplicate: Ctrl+D / Cmd+D
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelected();
        return;
      }

      // Copy: Ctrl+C / Cmd+C
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copySelected();
        return;
      }

      // Cut: Ctrl+X / Cmd+X
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        cutSelected();
        return;
      }

      // Paste: Ctrl+V / Cmd+V
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        pasteClipboard();
        return;
      }

      // Group: Ctrl+G / Cmd+G
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g' && !e.shiftKey) {
        e.preventDefault();
        groupSelected();
        return;
      }

      // Ungroup: Ctrl+Shift+G / Cmd+Shift+G
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        ungroupSelected();
        return;
      }

      // Select All: Ctrl+A / Cmd+A
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        const activePage = doc.pages[activePageId];
        if (activePage) {
          setSelectedIds([...activePage.children]);
        }
        return;
      }

      // Delete: Backspace / Delete
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        deleteSelected();
        return;
      }

      // Arrow Key Nudging (Shift = 10px, Normal = 1px)
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
        if (selectedIds.length > 0) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          const updates = selectedIds.map((id) => {
            const node = doc.nodes[id];
            if (!node) return null;
            let dx = 0;
            let dy = 0;
            if (e.key.toLowerCase() === 'arrowup') dy = -step;
            if (e.key.toLowerCase() === 'arrowdown') dy = step;
            if (e.key.toLowerCase() === 'arrowleft') dx = -step;
            if (e.key.toLowerCase() === 'arrowright') dx = step;
            return {
              id,
              newProps: {
                transform: {
                  ...node.transform,
                  x: node.transform.x + dx,
                  y: node.transform.y + dy,
                },
              },
              prevProps: {
                transform: { ...node.transform },
              },
            };
          }).filter(Boolean) as { id: string; newProps: any; prevProps: any }[];

          if (updates.length > 0) {
            batchUpdateNodes(updates);
          }
          return;
        }
      }

      switch (e.key.toLowerCase()) {
        case 'v': setActiveTool('select'); break;
        case 'h': setActiveTool('hand'); break;
        case 'f': setActiveTool('frame'); break;
        case 'r': setActiveTool('rect'); break;
        case 'o': setActiveTool('ellipse'); break;
        case 't': setActiveTool('text'); break;
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setZoom(1);
          }
          break;
      }
    };

    /*
    Original listener:
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    */
    const handlePaste = (e: ClipboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      pasteClipboard();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paste', handlePaste);
    };
  }, [
    undo,
    redo,
    deleteSelected,
    duplicateSelected,
    copySelected,
    cutSelected,
    pasteClipboard,
    groupSelected,
    ungroupSelected,
    setActiveTool,
    setZoom,
    selectedIds,
    setSelectedIds,
    doc,
    activePageId,
    batchUpdateNodes,
  ]);
};
