import { DocumentModel } from '@figma-app/shared-types';

const STORAGE_KEY = 'figma_autosave_doc';

export async function saveDocumentLocally(doc: DocumentModel): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
  } catch (err) {
    console.error('Failed to save document to localStorage:', err);
  }
}

export function loadDocumentLocally(): DocumentModel | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DocumentModel;
  } catch (err) {
    console.error('Failed to load document from localStorage:', err);
    return null;
  }
}

export async function saveDocumentToApi(doc: DocumentModel): Promise<boolean> {
  try {
    const res = await fetch(`http://localhost:4000/api/documents/${doc.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    });
    if (!res.ok && res.status === 404) {
      // Create if doesn't exist
      const createRes = await fetch('http://localhost:4000/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      });
      return createRes.ok;
    }
    return res.ok;
  } catch (err) {
    // API server may not be running in all client environments
    return false;
  }
}
