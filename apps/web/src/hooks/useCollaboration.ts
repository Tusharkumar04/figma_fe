import { useEffect, useRef } from 'react';
import { useEditorStore } from '../store/editorStore';

const PEER_COLORS = ['#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444'];
const RECONNECT_DELAY = 4000;
const CURSOR_THROTTLE = 50;

export const useCollaboration = () => {
  const { document: doc, upsertCollaborator, removeCollaborator } = useEditorStore();
  const socketRef = useRef<WebSocket | null>(null);
  const documentIdRef = useRef(doc.id);
  const identityRef = useRef<{ id: string; name: string; color: string } | null>(null);
  const lastCursorSentRef = useRef(0);

  documentIdRef.current = doc.id;

  if (!identityRef.current) {
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    identityRef.current = {
      id: `user_${Math.random().toString(36).substring(2, 9)}`,
      name: `Guest ${suffix}`,
      color: PEER_COLORS[Math.floor(Math.random() * PEER_COLORS.length)],
    };
  }

  useEffect(() => {
    const identity = identityRef.current!;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const connect = () => {
      if (disposed || typeof WebSocket === 'undefined') return;
      const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
      let socket: WebSocket;
      try {
        socket = new WebSocket(`${protocol}${window.location.host}/ws`);
      } catch {
        return;
      }
      socketRef.current = socket;

      socket.onopen = () => {
        socket.send(
          JSON.stringify({
            type: 'join',
            documentId: documentIdRef.current,
            userId: identity.id,
            userName: identity.name,
            userColor: identity.color,
          })
        );
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string);
          if (data.type === 'cursor' && data.userId && data.userId !== identity.id && data.cursor) {
            upsertCollaborator({
              id: data.userId,
              name: data.userName || 'Collaborator',
              color: data.userColor || '#3b82f6',
              cursor: data.cursor,
            });
          } else if (data.type === 'user_left' && data.userId) {
            removeCollaborator(data.userId);
          }
        } catch {
          // Ignore malformed collaboration payloads
        }
      };

      const scheduleReconnect = () => {
        socketRef.current = null;
        if (disposed || reconnectTimer) return;
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          connect();
        }, RECONNECT_DELAY);
      };

      socket.onclose = scheduleReconnect;
      socket.onerror = () => socket.close();
    };

    connect();

    const handlePointerMove = (e: MouseEvent) => {
      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      const now = Date.now();
      if (now - lastCursorSentRef.current < CURSOR_THROTTLE) return;
      lastCursorSentRef.current = now;

      const canvasEl = window.document.querySelector('.canvas-grid');
      if (!canvasEl) return;
      const rect = canvasEl.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
        return;
      }

      const { pan, zoom } = useEditorStore.getState();
      const cursor = {
        x: (e.clientX - rect.left - pan.x) / zoom,
        y: (e.clientY - rect.top - pan.y) / zoom,
      };
      socket.send(
        JSON.stringify({
          type: 'cursor',
          userId: identity.id,
          userName: identity.name,
          userColor: identity.color,
          cursor,
        })
      );
    };

    window.addEventListener('mousemove', handlePointerMove);

    return () => {
      disposed = true;
      window.removeEventListener('mousemove', handlePointerMove);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        socketRef.current.close();
        socketRef.current = null;
      }
      if (identityRef.current) {
        removeCollaborator(identityRef.current.id);
      }
    };
  }, [removeCollaborator, upsertCollaborator]);
};
