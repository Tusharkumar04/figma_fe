import { useEffect, useRef } from 'react';
import { useEditorStore } from '../store/editorStore';
import { saveDocumentLocally, saveDocumentToApi, loadDocumentLocally } from '../services/documentStorage';

export const useAutosave = () => {
  const { document, setSaveStatus, loadDocument } = useEditorStore();
  const initialLoadDone = useRef(false);

  // Restore cached document on mount if available
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      const cached = loadDocumentLocally();
      if (cached && cached.nodes && Object.keys(cached.nodes).length > 0) {
        loadDocument(cached);
      }
    }
  }, [loadDocument]);

  // Debounced auto-save on document changes
  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      // 1. Save locally to localStorage (synchronous & guaranteed)
      saveDocumentLocally(document);

      // 2. Attempt background persistence to API server
      const apiSuccess = await saveDocumentToApi(document);
      if (apiSuccess) {
        setSaveStatus('saved');
      } else {
        setSaveStatus('offline');
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [document, setSaveStatus]);
};
