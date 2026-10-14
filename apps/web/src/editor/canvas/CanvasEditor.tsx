import React, { useRef, useEffect, useState } from 'react';
// import { Stage, Layer, Rect, Circle, Text, Group, Transformer } from 'react-konva';
import { Stage, Layer, Rect, Circle, Text, Group, Transformer, Star, RegularPolygon, Line, Image as KonvaImage } from 'react-konva';
import { useEditorStore } from '../../store/editorStore';
import { SceneNode, NodeType, Point } from '@figma-app/shared-types';
import { measureTextBounds, createId } from '@figma-app/document-model';
import Konva from 'konva';

export const CanvasEditor: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<Point | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<Point | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [pencilPoints, setPencilPoints] = useState<number[]>([]);
  const [penPoints, setPenPoints] = useState<number[]>([]);
  const [penCursor, setPenCursor] = useState<Point | null>(null);
  const [pendingComment, setPendingComment] = useState<{ x: number; y: number } | null>(null);
  const [pendingCommentText, setPendingCommentText] = useState('');
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [imageCache, setImageCache] = useState<Record<string, HTMLImageElement>>({});
  const [canvasMenu, setCanvasMenu] = useState<{ x: number; y: number; nodeId: string | null } | null>(
    null
  );
  const scaleGestureRef = useRef<{ center: Point; startDistance: number; nodeIds: string[] } | null>(null);
  const scaleFactorRef = useRef(1);

  const {
    document,
    activePageId,
    activeTool,
    selectedIds,
    setSelectedIds,
    toggleSelectId,
    zoom,
    setZoom,
    pan,
    setPan,
    setViewportSize,
    updateNode,
    batchUpdateNodes,
    addNode,
    collaborators,
    comments,
    resolveComment,
    isCommentMode,
    addComment,
    copySelected,
    pasteClipboard,
    duplicateSelected,
    deleteSelected,
    groupSelected,
    ungroupSelected,
    moveLayer,
    zoomToFit,
    setActiveTool,
  } = useEditorStore();

  // const isCreationTool = ['frame', 'rect', 'ellipse', 'text'].includes(activeTool);
  const isCreationTool = ['frame', 'rect', 'ellipse', 'text', 'star', 'polygon', 'line'].includes(activeTool);
  const isPathTool = activeTool === 'pencil' || activeTool === 'pen';
  const isPanningTool = activeTool === 'hand' || isSpaceDown;

  const activePage = document.pages[activePageId];
  const nodeIds = activePage ? activePage.children : [];

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = containerRef.current.offsetHeight;
        setDimensions({ width, height });
        setViewportSize(width, height);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [setViewportSize]);

  // Spacebar temporarily enables the hand tool (Figma behaviour)
  useEffect(() => {
    const isFieldFocused = () => {
      const el = window.document.activeElement;
      return (
        !!el &&
        (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable)
      );
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || isFieldFocused()) return;
      e.preventDefault();
      setIsSpaceDown(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsSpaceDown(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Preload every bitmap used on the canvas so image layers can be painted by Konva
  useEffect(() => {
    const urls = new Set<string>();
    Object.values(document.nodes).forEach((node) => {
      const src = (node as any).src;
      if (node.type === 'image' && typeof src === 'string' && src) urls.add(src);
      (node.fills || []).forEach((fill) => {
        if (fill.type === 'image' && fill.imageUrl) urls.add(fill.imageUrl);
      });
    });
    urls.forEach((url) => {
      if (imageCache[url]) return;
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => setImageCache((prev) => ({ ...prev, [url]: img }));
      img.src = url;
    });
  }, [document, imageCache]);

  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    const stage = stageRef.current;
    const tr = transformerRef.current;
    const selectedNodes = selectedIds
      .filter((id) => {
        const node = document.nodes[id];
        // Locked layers keep their selection but expose no transform handles
        return node && isNodeEffectivelyVisible(node) && !isNodeEffectivelyLocked(node);
      })
      .map((id) => stage.findOne(`#${id}`))
      .filter((node): node is Konva.Node => !!node);
    tr.nodes(selectedNodes);
    tr.forceUpdate();
    tr.getLayer()?.batchDraw();
  }, [selectedIds, document]);

  const getChildrenOf = (parentId: string, nodes: Record<string, SceneNode>): string[] => {
    const parentNode = nodes[parentId];
    const explicit = (parentNode?.children || []).filter((id) => nodes[id]);
    const byParentProp = Object.keys(nodes).filter((id) => nodes[id]?.parent === parentId);
    return Array.from(new Set([...explicit, ...byParentProp]));
  };

  const getAllDescendantIds = (rootId: string, nodes: Record<string, SceneNode>): string[] => {
    const result: string[] = [];
    const visited = new Set<string>();
    const queue = [...getChildrenOf(rootId, nodes)];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (!visited.has(id)) {
        visited.add(id);
        result.push(id);
        const children = getChildrenOf(id, nodes);
        if (children.length > 0) {
          queue.push(...children);
        }
      }
    }
    return result;
  };

  const getTopGroupOrSelf = (nodeId: string, nodes: Record<string, SceneNode>): string => {
    let curr: SceneNode | undefined = nodes[nodeId];
    while (curr?.parent && nodes[curr.parent]?.type === 'group') {
      curr = nodes[curr.parent];
    }
    return curr?.id || nodeId;
  };

  const handleTransformerEnd = () => {
    if (!stageRef.current) return;
    const stage = stageRef.current;
    const updates: { id: string; newProps: any; prevProps: any }[] = [];

    selectedIds.forEach((id) => {
      const konvaNode = stage.findOne(`#${id}`);
      const docNode = document.nodes[id];
      if (konvaNode && docNode) {
        const sx = konvaNode.scaleX();
        const sy = konvaNode.scaleY();
        konvaNode.scaleX(1);
        konvaNode.scaleY(1);

        /*
        const newTransform = {
          x: Math.round(konvaNode.x()),
          y: Math.round(konvaNode.y()),
          width: Math.round(Math.max(5, docNode.transform.width * sx)),
          height: Math.round(Math.max(5, docNode.transform.height * sy)),
          rotation: Math.round(konvaNode.rotation()),
        };
        */
        const isCentered = docNode.type === 'ellipse' || docNode.type === 'star' || docNode.type === 'polygon';
        const newWidth = Math.round(Math.max(5, docNode.transform.width * sx));
        const newHeight = Math.round(Math.max(5, docNode.transform.height * sy));
        const newTransform = {
          x: Math.round(isCentered ? konvaNode.x() - newWidth / 2 : konvaNode.x()),
          y: Math.round(isCentered ? konvaNode.y() - newHeight / 2 : konvaNode.y()),
          width: newWidth,
          height: newHeight,
          rotation: Math.round(konvaNode.rotation()),
        };

        // Path layers (pencil/pen strokes) scale their vertices together with the box
        const docPoints = (docNode as any).points as number[] | undefined;
        if (docPoints && docPoints.length >= 4) {
          const scaledPoints = docPoints.map((value, index) =>
            Math.round((index % 2 === 0 ? value * sx : value * sy) * 100) / 100
          );
          updates.push({
            id,
            newProps: { transform: newTransform, points: scaledPoints } as any,
            prevProps: { transform: { ...docNode.transform }, points: docPoints } as any,
          });
        } else {
          updates.push({
            id,
            newProps: { transform: newTransform },
            prevProps: { transform: { ...docNode.transform } },
          });
        }

        if (docNode.children && docNode.children.length > 0) {
          const descendantIds = getAllDescendantIds(docNode.id, document.nodes);
          descendantIds.forEach((childId) => {
            const childDoc = document.nodes[childId];
            if (childDoc) {
              const childNewX = Math.round(newTransform.x + (childDoc.transform.x - docNode.transform.x) * sx);
              const childNewY = Math.round(newTransform.y + (childDoc.transform.y - docNode.transform.y) * sy);
              const childNewW = Math.round(Math.max(5, childDoc.transform.width * sx));
              const childNewH = Math.round(Math.max(5, childDoc.transform.height * sy));
              updates.push({
                id: childId,
                newProps: {
                  transform: {
                    ...childDoc.transform,
                    x: childNewX,
                    y: childNewY,
                    width: childNewW,
                    height: childNewH,
                  },
                },
                prevProps: { transform: { ...childDoc.transform } },
              });
            }
          });
        }
      }
    });

    if (updates.length > 0) {
      batchUpdateNodes(updates);
    }
  };

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    if (e.evt.ctrlKey || e.evt.metaKey) {
      const scaleBy = 1.05;
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition() || { x: dimensions.width / 2, y: dimensions.height / 2 };
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };
      const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
      const clampedScale = Math.max(0.1, Math.min(newScale, 5));
      setZoom(clampedScale);
      setPan({
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      });
    } else {
      setPan((prev) => ({
        x: prev.x - e.evt.deltaX,
        y: prev.y - e.evt.deltaY,
      }));
    }
  };

  const getPointerInCanvasSpace = (): Point | null => {
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!pointer) return null;
    return { x: (pointer.x - pan.x) / zoom, y: (pointer.y - pan.y) / zoom };
  };

  const getSelectionCenter = (): Point => {
    const nodes = selectedIds.map((id) => document.nodes[id]).filter(Boolean) as SceneNode[];
    if (nodes.length === 0) return { x: 0, y: 0 };
    const minX = Math.min(...nodes.map((n) => n.transform.x));
    const minY = Math.min(...nodes.map((n) => n.transform.y));
    const maxX = Math.max(...nodes.map((n) => n.transform.x + n.transform.width));
    const maxY = Math.max(...nodes.map((n) => n.transform.y + n.transform.height));
    return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  };

  const isCenteredShape = (node: SceneNode) =>
    node.type === 'ellipse' || node.type === 'star' || node.type === 'polygon';

  const getShapeAnchor = (node: SceneNode): Point => {
    if (isCenteredShape(node)) {
      return {
        x: node.transform.x + node.transform.width / 2,
        y: node.transform.y + node.transform.height / 2,
      };
    }
    return { x: node.transform.x, y: node.transform.y };
  };

  const buildPathOverrides = (points: number[], strokeColor = '#e4e4e7', strokeWidth = 2) => {
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i < points.length; i += 2) {
      xs.push(points[i]);
      ys.push(points[i + 1]);
    }
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    const relativePoints = points.map((value, index) => (index % 2 === 0 ? value - minX : value - minY));
    return {
      points: relativePoints,
      transform: {
        x: Math.round(minX),
        y: Math.round(minY),
        width: Math.max(1, Math.round(maxX - minX)),
        height: Math.max(1, Math.round(maxY - minY)),
        rotation: 0,
      },
      fills: [],
      strokes: [
        {
          id: createId('stroke'),
          color: strokeColor,
          width: strokeWidth,
          align: 'center' as const,
          opacity: 1,
          visible: true,
        },
      ],
    };
  };

  const finishFreehandPath = () => {
    if (pencilPoints.length >= 4) {
      addNode('line' as NodeType, buildPathOverrides(pencilPoints), true);
    }
    setPencilPoints([]);
    setIsDrawing(false);
  };

  const finishPenPath = () => {
    if (penPoints.length >= 4) {
      addNode('line' as NodeType, buildPathOverrides(penPoints, '#3b82f6', 2), true);
    }
    setPenPoints([]);
    setPenCursor(null);
  };

  const applyScalePreview = (canvasPoint: Point) => {
    const gesture = scaleGestureRef.current;
    const stage = stageRef.current;
    if (!gesture || !stage) return;
    const distance = Math.max(1, Math.hypot(canvasPoint.x - gesture.center.x, canvasPoint.y - gesture.center.y));
    const factor = Math.max(0.05, Math.min(distance / gesture.startDistance, 20));
    scaleFactorRef.current = factor;
    gesture.nodeIds.forEach((id) => {
      const konvaNode = stage.findOne(`#${id}`);
      const docNode = document.nodes[id];
      if (!konvaNode || !docNode) return;
      const anchor = getShapeAnchor(docNode);
      konvaNode.position({
        x: gesture.center.x + (anchor.x - gesture.center.x) * factor,
        y: gesture.center.y + (anchor.y - gesture.center.y) * factor,
      });
      konvaNode.scaleX(factor);
      konvaNode.scaleY(factor);
    });
    stage.batchDraw();
  };

  const commitScaleGesture = () => {
    const gesture = scaleGestureRef.current;
    const stage = stageRef.current;
    const factor = scaleFactorRef.current;
    scaleGestureRef.current = null;
    scaleFactorRef.current = 1;
    if (!gesture) return;

    if (stage) {
      gesture.nodeIds.forEach((id) => {
        const konvaNode = stage.findOne(`#${id}`);
        if (konvaNode) {
          konvaNode.scaleX(1);
          konvaNode.scaleY(1);
        }
      });
      stage.batchDraw();
    }

    if (Math.abs(factor - 1) < 0.001) return;

    const idsToScale = new Set<string>();
    gesture.nodeIds.forEach((id) => {
      idsToScale.add(id);
      getAllDescendantIds(id, document.nodes).forEach((childId) => idsToScale.add(childId));
    });

    const updates: { id: string; newProps: Partial<SceneNode>; prevProps: Partial<SceneNode> }[] = [];
    idsToScale.forEach((id) => {
      const docNode = document.nodes[id];
      if (!docNode) return;
      const anchor = getShapeAnchor(docNode);
      const newWidth = Math.max(1, docNode.transform.width * factor);
      const newHeight = Math.max(1, docNode.transform.height * factor);
      const newAnchorX = gesture.center.x + (anchor.x - gesture.center.x) * factor;
      const newAnchorY = gesture.center.y + (anchor.y - gesture.center.y) * factor;
      const nextTransform = {
        ...docNode.transform,
        x: Math.round(isCenteredShape(docNode) ? newAnchorX - newWidth / 2 : newAnchorX),
        y: Math.round(isCenteredShape(docNode) ? newAnchorY - newHeight / 2 : newAnchorY),
        width: Math.round(newWidth),
        height: Math.round(newHeight),
      };
      const newProps: Partial<SceneNode> = { transform: nextTransform };
      if (docNode.type === 'text') {
        (newProps as any).fontSize = Math.max(
          4,
          Math.round((((docNode as any).fontSize || 16) * factor))
        );
      }
      updates.push({ id, newProps, prevProps: { transform: { ...docNode.transform } } });
    });

    if (updates.length > 0) {
      batchUpdateNodes(updates);
    }
  };

  const commitComment = () => {
    if (!pendingComment) return;
    const text = (pendingCommentText || '').trim();
    addComment(text || 'New comment', { x: pendingComment.x, y: pendingComment.y });
    setPendingComment(null);
    setPendingCommentText('');
  };

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isPanningTool) return;

    const canvasPoint = getPointerInCanvasSpace();

    if (isCommentMode && canvasPoint) {
      setActiveCommentId(null);
      setPendingComment(canvasPoint);
      return;
    }

    if (activeTool === 'pencil' && canvasPoint) {
      setIsDrawing(true);
      setPencilPoints([canvasPoint.x, canvasPoint.y]);
      return;
    }

    if (activeTool === 'pen' && canvasPoint) {
      setPenPoints((prev) => [...prev, canvasPoint.x, canvasPoint.y]);
      setPenCursor(canvasPoint);
      return;
    }

    const clickedNodeId = e.target === stageRef.current ? null : e.target.id();
    const clickedInsideSelection = !clickedNodeId || selectedIds.includes(clickedNodeId);

    if (activeTool === 'scale' && canvasPoint && selectedIds.length > 0 && clickedInsideSelection) {
      const center = getSelectionCenter();
      scaleGestureRef.current = {
        center,
        startDistance: Math.max(1, Math.hypot(canvasPoint.x - center.x, canvasPoint.y - center.y)),
        nodeIds: [...selectedIds],
      };
      return;
    }

    if (isCreationTool) {
      const stage = stageRef.current;
      const pointer = stage?.getPointerPosition();
      if (!pointer) return;
      const canvasX = (pointer.x - pan.x) / zoom;
      const canvasY = (pointer.y - pan.y) / zoom;
      setDrawStart({ x: canvasX, y: canvasY });
      setDrawCurrent({ x: canvasX, y: canvasY });
      setIsDrawing(true);
      return;
    }

    /*
    Original stage mouse down / up / click:
    if (e.target === stageRef.current) {
      setSelectedIds([]);
    }
    ...
    if (e.evt.shiftKey) toggleSelectId(node.id);
    else setSelectedIds([node.id]);
    */
    if (activeTool === 'select' && e.target === stageRef.current) {
      const stage = stageRef.current;
      const pointer = stage?.getPointerPosition();
      if (!pointer) return;
      const canvasX = (pointer.x - pan.x) / zoom;
      const canvasY = (pointer.y - pan.y) / zoom;
      setDrawStart({ x: canvasX, y: canvasY });
      setDrawCurrent({ x: canvasX, y: canvasY });
      setIsDrawing(true);
      if (!e.evt.shiftKey && !e.evt.ctrlKey && !e.evt.metaKey) {
        setSelectedIds([]);
      }
      return;
    }

    if (e.target === stageRef.current) {
      setSelectedIds([]);
    }
  };

  const handleStageMouseMove = () => {
    const canvasPoint = getPointerInCanvasSpace();
    if (!canvasPoint) return;
    const canvasX = canvasPoint.x;
    const canvasY = canvasPoint.y;

    if (activeTool === 'pencil' && isDrawing) {
      setPencilPoints((prev) => {
        const lastX = prev[prev.length - 2];
        const lastY = prev[prev.length - 1];
        if (lastX !== undefined && Math.abs(lastX - canvasX) < 1.5 && Math.abs(lastY - canvasY) < 1.5) {
          return prev;
        }
        return [...prev, canvasX, canvasY];
      });
      return;
    }

    if (activeTool === 'pen' && penPoints.length > 0) {
      setPenCursor({ x: canvasX, y: canvasY });
      return;
    }

    if (scaleGestureRef.current) {
      applyScalePreview(canvasPoint);
      return;
    }

    if (!isDrawing || !drawStart) return;
    setDrawCurrent({ x: canvasX, y: canvasY });
  };

  const handleStageMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool === 'pencil' && isDrawing) {
      finishFreehandPath();
      return;
    }

    if (scaleGestureRef.current) {
      commitScaleGesture();
      return;
    }

    if (!isDrawing || !drawStart || !drawCurrent) return;

    if (activeTool === 'select') {
      const x1 = Math.min(drawStart.x, drawCurrent.x);
      const y1 = Math.min(drawStart.y, drawCurrent.y);
      const x2 = Math.max(drawStart.x, drawCurrent.x);
      const y2 = Math.max(drawStart.y, drawCurrent.y);
      const width = x2 - x1;
      const height = y2 - y1;

      if (width > 4 || height > 4) {
        const candidateSet = new Set<string>();
        const collectPageNodes = (ids: string[]) => {
          ids.forEach((id) => {
            if (!document.nodes[id] || candidateSet.has(id)) return;
            candidateSet.add(id);
            collectPageNodes(getChildrenOf(id, document.nodes));
          });
        };
        collectPageNodes(nodeIds);
        const candidates = Array.from(candidateSet);

        const hits = candidates.filter((id) => {
          const n = document.nodes[id];
          if (!n || !n.visible) return false;
          const nx1 = n.transform.x;
          const ny1 = n.transform.y;
          const nx2 = nx1 + n.transform.width;
          const ny2 = ny1 + n.transform.height;
          return nx1 < x2 && nx2 > x1 && ny1 < y2 && ny2 > y1;
        });

        const hitSet = new Set(hits);
        const topHits = hits.filter((id) => {
          let ancestor = document.nodes[id]?.parent;
          while (ancestor) {
            if (hitSet.has(ancestor)) return false;
            ancestor = document.nodes[ancestor]?.parent;
          }
          return true;
        });

        if (topHits.length > 0) {
          setSelectedIds(
            e.evt.shiftKey ? Array.from(new Set([...selectedIds, ...topHits])) : topHits
          );
        }
      }
      setIsDrawing(false);
      setDrawStart(null);
      setDrawCurrent(null);
      return;
    }

    const x = Math.min(drawStart.x, drawCurrent.x);
    const y = Math.min(drawStart.y, drawCurrent.y);
    let width = Math.abs(drawCurrent.x - drawStart.x);
    let height = Math.abs(drawCurrent.y - drawStart.y);

    if (width < 8 && height < 8) {
      if (activeTool === 'frame') {
        width = 375;
        height = 812;
      /*
      } else if (activeTool === 'text') {
        width = 180;
        height = 40;
      */
      } else if (activeTool === 'text') {
        const textContent = 'Type something...';
        const bounds = measureTextBounds(textContent, 20, 'Inter');
        width = bounds.width;
        height = bounds.height;
      } else {
        width = 120;
        height = 120;
      }
    } else if (activeTool === 'text') {
      const textContent = 'Type something...';
      const bounds = measureTextBounds(textContent, 20, 'Inter');
      width = bounds.width;
      height = bounds.height;
    }

    addNode(activeTool as NodeType, {
      transform: {
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(Math.max(10, width)),
        height: Math.round(Math.max(10, height)),
        rotation: 0,
      },
    });

    // Text layers start editing immediately, matching the Figma text workflow
    if (activeTool === 'text') {
      const createdId = useEditorStore.getState().selectedIds[0];
      if (createdId) setEditingTextId(createdId);
    }

    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
  };

  // Pen tool: Enter finishes the polyline, Escape cancels it
  useEffect(() => {
    if (activeTool !== 'pen') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        finishPenPath();
      } else if (e.key === 'Escape') {
        setPenPoints([]);
        setPenCursor(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, penPoints]);

  const renderCreationPreview = () => {
    if (activeTool === 'pencil' && pencilPoints.length >= 4) {
      return (
        <Line
          points={pencilPoints}
          stroke="#3b82f6"
          strokeWidth={2 / zoom}
          lineCap="round"
          lineJoin="round"
          listening={false}
        />
      );
    }

    if (activeTool === 'pen' && penPoints.length >= 2) {
      const livePoints =
        penCursor && penPoints.length >= 2
          ? [...penPoints, penCursor.x, penCursor.y]
          : penPoints;
      return (
        <>
          <Line
            points={livePoints}
            stroke="#3b82f6"
            strokeWidth={1.5 / zoom}
            dash={[4 / zoom, 4 / zoom]}
            listening={false}
          />
          {penPoints.length >= 2 && (
            <Circle
              x={penPoints[penPoints.length - 2]}
              y={penPoints[penPoints.length - 1]}
              radius={3 / zoom}
              fill="#3b82f6"
              listening={false}
            />
          )}
        </>
      );
    }

    if (!isDrawing || !drawStart || !drawCurrent) return null;

    const x = Math.min(drawStart.x, drawCurrent.x);
    const y = Math.min(drawStart.y, drawCurrent.y);
    const width = Math.max(2, Math.abs(drawCurrent.x - drawStart.x));
    const height = Math.max(2, Math.abs(drawCurrent.y - drawStart.y));

    if (activeTool === 'select') {
      return (
        <Rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="rgba(59, 130, 246, 0.15)"
          stroke="#3b82f6"
          strokeWidth={1 / zoom}
          dash={[3 / zoom, 3 / zoom]}
          listening={false}
        />
      );
    }

    if (activeTool === 'ellipse') {
      const rx = width / 2;
      const ry = height / 2;
      return (
        <Circle
          x={x + rx}
          y={y + ry}
          radius={Math.max(rx, ry)}
          fill="rgba(59, 130, 246, 0.2)"
          stroke="#3b82f6"
          strokeWidth={1.5 / zoom}
          dash={[4 / zoom, 4 / zoom]}
          listening={false}
        />
      );
    }

    if (activeTool === 'star') {
      const rx = width / 2;
      const ry = height / 2;
      const radius = Math.max(rx, ry);
      return (
        <Star
          x={x + rx}
          y={y + ry}
          numPoints={5}
          innerRadius={radius * 0.4}
          outerRadius={radius}
          fill="rgba(59, 130, 246, 0.2)"
          stroke="#3b82f6"
          strokeWidth={1.5 / zoom}
          dash={[4 / zoom, 4 / zoom]}
          listening={false}
        />
      );
    }

    if (activeTool === 'polygon') {
      const rx = width / 2;
      const ry = height / 2;
      return (
        <RegularPolygon
          x={x + rx}
          y={y + ry}
          sides={3}
          radius={Math.max(rx, ry)}
          fill="rgba(59, 130, 246, 0.2)"
          stroke="#3b82f6"
          strokeWidth={1.5 / zoom}
          dash={[4 / zoom, 4 / zoom]}
          listening={false}
        />
      );
    }

    if (activeTool === 'line') {
      return (
        <Line
          points={[drawStart.x, drawStart.y, drawCurrent.x, drawCurrent.y]}
          stroke="#3b82f6"
          strokeWidth={2 / zoom}
          dash={[4 / zoom, 4 / zoom]}
          listening={false}
        />
      );
    }

    return (
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={activeTool === 'frame' ? '#0f172a' : 'rgba(59, 130, 246, 0.2)'}
        stroke="#3b82f6"
        strokeWidth={1.5 / zoom}
        dash={[4 / zoom, 4 / zoom]}
        cornerRadius={activeTool === 'frame' ? 8 : 4}
        listening={false}
      />
    );
  };

  const isNodeEffectivelyVisible = (node: SceneNode): boolean => {
    let curr: SceneNode | null | undefined = node;
    while (curr) {
      if (!curr.visible) return false;
      if (!curr.parent) break;
      curr = document.nodes[curr.parent];
    }
    return true;
  };

  const isNodeEffectivelyLocked = (node: SceneNode): boolean => {
    let curr: SceneNode | null | undefined = node;
    while (curr) {
      if (curr.locked) return true;
      if (!curr.parent) break;
      curr = document.nodes[curr.parent];
    }
    return false;
  };

  const renderNode = (node: SceneNode) => {
    if (!isNodeEffectivelyVisible(node)) return null;
    const isLocked = isNodeEffectivelyLocked(node);
    const activeFill = node.fills.find((f) => f.visible !== false);
    const fillProp = activeFill?.color || 'transparent';
    const imageUrl = activeFill?.type === 'image' ? activeFill.imageUrl : (node as any).src;
    const loadedImage = imageUrl ? imageCache[imageUrl] : undefined;
    const strokeObj = node.strokes.find((s) => s.visible !== false);
    const strokeProp = strokeObj?.color;
    const strokeWidthProp = strokeObj?.width;

    const commonProps = {
      id: node.id,
      x: node.transform.x,
      y: node.transform.y,
      rotation: node.transform.rotation || 0,
      opacity: typeof node.opacity === 'number' ? node.opacity : 1,
      listening: !isLocked,
      draggable: !isLocked && activeTool === 'select',
      onContextMenu: (e: any) => {
        if (isCreationTool || isPathTool || isCommentMode) return;
        e.evt.preventDefault();
        e.cancelBubble = true;
        const targetId = getTopGroupOrSelf(node.id, document.nodes);
        if (!selectedIds.includes(targetId)) setSelectedIds([targetId]);
        const rect = containerRef.current?.getBoundingClientRect();
        setCanvasMenu({
          x: e.evt.clientX - (rect?.left || 0),
          y: e.evt.clientY - (rect?.top || 0),
          nodeId: targetId,
        });
      },
      onClick: (e: any) => {
        if (isCreationTool || isPathTool || isCommentMode) return;
        e.cancelBubble = true;
        const targetId = (e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey)
          ? node.id
          : getTopGroupOrSelf(node.id, document.nodes);
        if (e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey) toggleSelectId(targetId);
        else setSelectedIds([targetId]);
      },
      onDblClick: (e: any) => {
        if (isCreationTool || isPathTool || isCommentMode) return;
        e.cancelBubble = true;
        setSelectedIds([node.id]);
      },
      onDragMove: (e: any) => {
        const stage = stageRef.current;
        if (!stage) return;
        const isCentered = node.type === 'ellipse' || node.type === 'star' || node.type === 'polygon';
        const originX = isCentered ? node.transform.x + node.transform.width / 2 : node.transform.x;
        const originY = isCentered ? node.transform.y + node.transform.height / 2 : node.transform.y;
        const dx = e.target.x() - originX;
        const dy = e.target.y() - originY;

        const idsToMove = new Set<string>();
        const topGroup = getTopGroupOrSelf(node.id, document.nodes);
        const isGroupSelected = selectedIds.includes(topGroup);

        if (isGroupSelected || topGroup === node.id) {
          idsToMove.add(topGroup);
          getAllDescendantIds(topGroup, document.nodes).forEach((id) => idsToMove.add(id));
        } else {
          idsToMove.add(node.id);
          getAllDescendantIds(node.id, document.nodes).forEach((id) => idsToMove.add(id));
        }
        if (selectedIds.includes(node.id)) {
          selectedIds.forEach((selId) => {
            idsToMove.add(selId);
            getAllDescendantIds(selId, document.nodes).forEach((id) => idsToMove.add(id));
          });
        }

        idsToMove.forEach((otherId) => {
          if (otherId === node.id) return;
          const otherKonva = stage.findOne(`#${otherId}`);
          const otherDoc = document.nodes[otherId];
          if (otherKonva && otherDoc) {
            const childIsCentered = otherDoc.type === 'ellipse' || otherDoc.type === 'star' || otherDoc.type === 'polygon';
            const childOriginX = childIsCentered ? otherDoc.transform.x + otherDoc.transform.width / 2 : otherDoc.transform.x;
            const childOriginY = childIsCentered ? otherDoc.transform.y + otherDoc.transform.height / 2 : otherDoc.transform.y;
            otherKonva.position({
              x: childOriginX + dx,
              y: childOriginY + dy,
            });
          }
          const header = stage.findOne(`#header_${otherId}`);
          if (header && otherDoc) {
            header.position({
              x: otherDoc.transform.x + dx,
              y: otherDoc.transform.y + dy - (otherDoc.type === 'frame' ? 18 : 16),
            });
          }
        });

        const headerText = stage.findOne(`#header_${node.id}`);
        if (headerText) {
          headerText.position({
            x: node.transform.x + dx,
            y: node.transform.y + dy - (node.type === 'frame' ? 18 : 16),
          });
        }
        stage.batchDraw();
      },
      /*
      onDragEnd: (e: any) => {
        updateNode(node.id, {
          transform: { ...node.transform, x: e.target.x(), y: e.target.y() },
        });
      },
      */
      onDragEnd: (e: any) => {
        const isCentered = node.type === 'ellipse' || node.type === 'star' || node.type === 'polygon';
        const originX = isCentered ? node.transform.x + node.transform.width / 2 : node.transform.x;
        const originY = isCentered ? node.transform.y + node.transform.height / 2 : node.transform.y;
        const dx = Math.round(e.target.x() - originX);
        const dy = Math.round(e.target.y() - originY);
        if (dx === 0 && dy === 0) return;

        const idsToMove = new Set<string>();
        const topGroup = getTopGroupOrSelf(node.id, document.nodes);
        const isGroupSelected = selectedIds.includes(topGroup);

        if (isGroupSelected || topGroup === node.id) {
          idsToMove.add(topGroup);
          getAllDescendantIds(topGroup, document.nodes).forEach((id) => idsToMove.add(id));
        } else {
          idsToMove.add(node.id);
          getAllDescendantIds(node.id, document.nodes).forEach((id) => idsToMove.add(id));
        }
        if (selectedIds.includes(node.id)) {
          selectedIds.forEach((selId) => {
            idsToMove.add(selId);
            getAllDescendantIds(selId, document.nodes).forEach((id) => idsToMove.add(id));
          });
        }

        const updates: { id: string; newProps: Partial<SceneNode>; prevProps: Partial<SceneNode> }[] = [];
        idsToMove.forEach((moveId) => {
          const docNode = document.nodes[moveId];
          if (docNode) {
            updates.push({
              id: moveId,
              newProps: {
                transform: {
                  ...docNode.transform,
                  x: docNode.transform.x + dx,
                  y: docNode.transform.y + dy,
                },
              },
              prevProps: { transform: { ...docNode.transform } },
            });
          }
        });

        if (topGroup !== node.id && !isGroupSelected) {
          const topGroupDoc = document.nodes[topGroup];
          if (topGroupDoc) {
            const memberIds = getAllDescendantIds(topGroup, document.nodes);
            const memberNodes = memberIds.map((mId) => {
              if (mId === node.id) {
                return { ...node, transform: { ...node.transform, x: node.transform.x + dx, y: node.transform.y + dy } };
              }
              return document.nodes[mId];
            }).filter(Boolean);
            if (memberNodes.length > 0) {
              const minX = Math.min(...memberNodes.map((c) => c.transform.x));
              const minY = Math.min(...memberNodes.map((c) => c.transform.y));
              const maxX = Math.max(...memberNodes.map((c) => c.transform.x + c.transform.width));
              const maxY = Math.max(...memberNodes.map((c) => c.transform.y + c.transform.height));
              updates.push({
                id: topGroup,
                newProps: {
                  transform: {
                    ...topGroupDoc.transform,
                    x: minX,
                    y: minY,
                    width: Math.max(5, maxX - minX),
                    height: Math.max(5, maxY - minY),
                  },
                },
                prevProps: { transform: { ...topGroupDoc.transform } },
              });
            }
          }
        }

        if (updates.length > 0) {
          batchUpdateNodes(updates);
        }
      },
      /*
      onTransformEnd: (e: any) => {
        const shape = e.target;
        const sx = shape.scaleX();
        const sy = shape.scaleY();
        shape.scaleX(1);
        shape.scaleY(1);
        updateNode(node.id, {
          transform: {
            x: shape.x(),
            y: shape.y(),
            width: Math.max(5, shape.width() * sx),
            height: Math.max(5, shape.height() * sy),
            rotation: shape.rotation(),
          },
        });
      },
      */
    };

    if (node.type === 'rect') {
      if (loadedImage) {
        return (
          <KonvaImage
            key={node.id}
            {...commonProps}
            image={loadedImage}
            width={node.transform.width}
            height={node.transform.height}
            stroke={strokeProp}
            strokeWidth={strokeWidthProp}
          />
        );
      }
      return (
        <Rect
          key={node.id}
          {...commonProps}
          width={node.transform.width}
          height={node.transform.height}
          fill={fillProp}
          stroke={strokeProp}
          strokeWidth={strokeWidthProp}
          cornerRadius={typeof node.cornerRadius === 'number' ? node.cornerRadius : 0}
          shadowBlur={12}
          shadowOpacity={0.15}
        />
      );
    }

    if (node.type === 'image') {
      if (loadedImage) {
        return (
          <KonvaImage
            key={node.id}
            {...commonProps}
            image={loadedImage}
            width={node.transform.width}
            height={node.transform.height}
            stroke={strokeProp}
            strokeWidth={strokeWidthProp}
          />
        );
      }
      return (
        <Rect
          key={node.id}
          {...commonProps}
          width={node.transform.width}
          height={node.transform.height}
          fill="#27272a"
          stroke="#52525b"
          strokeWidth={1 / zoom}
          dash={[4 / zoom, 4 / zoom]}
        />
      );
    }

    if (node.type === 'ellipse') {
      const rx = node.transform.width / 2;
      const ry = node.transform.height / 2;
      return (
        <Circle
          key={node.id}
          {...commonProps}
          x={node.transform.x + rx}
          y={node.transform.y + ry}
          radius={Math.max(rx, ry)}
          fill={fillProp}
          stroke={strokeProp}
          strokeWidth={strokeWidthProp}
        />
      );
    }

    if (node.type === 'star') {
      const rx = node.transform.width / 2;
      const ry = node.transform.height / 2;
      const radius = Math.max(rx, ry);
      return (
        <Star
          key={node.id}
          {...commonProps}
          x={node.transform.x + rx}
          y={node.transform.y + ry}
          numPoints={(node as any).numPoints || 5}
          innerRadius={(node as any).innerRadius || radius * 0.4}
          outerRadius={radius}
          fill={fillProp}
          stroke={strokeProp}
          strokeWidth={strokeWidthProp}
        />
      );
    }

    if (node.type === 'polygon') {
      const rx = node.transform.width / 2;
      const ry = node.transform.height / 2;
      const radius = Math.max(rx, ry);
      return (
        <RegularPolygon
          key={node.id}
          {...commonProps}
          x={node.transform.x + rx}
          y={node.transform.y + ry}
          sides={(node as any).sides || 3}
          radius={radius}
          fill={fillProp}
          stroke={strokeProp}
          strokeWidth={strokeWidthProp}
        />
      );
    }

    if (node.type === 'line') {
      const pathPoints = (node as any).points as number[] | undefined;
      const isArrow = Boolean((node as any).arrow);
      return (
        <Line
          key={node.id}
          {...commonProps}
          points={
            pathPoints && pathPoints.length >= 4
              ? pathPoints
              : [0, 0, node.transform.width, node.transform.height || 0]
          }
          stroke={strokeProp || fillProp || '#3b82f6'}
          strokeWidth={strokeWidthProp || 2}
          lineCap={pathPoints ? 'round' : 'butt'}
          lineJoin={pathPoints ? 'round' : 'miter'}
          hitStrokeWidth={Math.max(10, (strokeWidthProp || 2) * 3)}
          pointerAtEnding={isArrow}
          pointerLength={isArrow ? 10 : undefined}
          pointerWidth={isArrow ? 10 : undefined}
          fill={isArrow ? strokeProp || fillProp || '#3b82f6' : undefined}
        />
      );
    }

    if (node.type === 'text') {
      /*
      return (
        <Text
          key={node.id}
          {...commonProps}
          text={(node as any).content || 'Text'}
          fontSize={(node as any).fontSize || 16}
          fontFamily={(node as any).fontFamily || 'Inter'}
          fill={fillProp}
          width={node.transform.width}
        />
      );
      */
      return (
        <Text
          key={node.id}
          {...commonProps}
          text={(node as any).content !== undefined ? (node as any).content : 'Text'}
          fontSize={(node as any).fontSize || 16}
          fontFamily={(node as any).fontFamily || 'Inter'}
          fontStyle={Number((node as any).fontWeight) >= 600 ? 'bold' : 'normal'}
          align={(node as any).textAlign || 'left'}
          lineHeight={(node as any).lineHeight ?? 1.25}
          letterSpacing={(node as any).letterSpacing ?? 0}
          fill={fillProp}
          width={node.transform.width}
          onDblClick={(e) => {
            e.cancelBubble = true;
            setEditingTextId(node.id);
          }}
        />
      );
    }

    /*
    if (node.type === 'frame') {
      return (
        <Group key={node.id} id={node.id}>
          <Text
            id={`header_${node.id}`}
            x={node.transform.x}
            y={node.transform.y - 18}
            text={node.name}
            fontSize={11}
            fill="#94a3b8"
            fontFamily="Inter"
          />
          <Rect
            {...commonProps}
            width={node.transform.width}
            height={node.transform.height}
            fill={fillProp}
            stroke="#334155"
            strokeWidth={1}
            cornerRadius={typeof node.cornerRadius === 'number' ? node.cornerRadius : 0}
          />
        </Group>
      );
    }

    if (node.type === 'group') {
      return (
        <Group key={node.id} id={node.id}>
          <Text
            id={`header_${node.id}`}
            x={node.transform.x}
            y={node.transform.y - 16}
            text={`Group (${node.children?.length || 0})`}
            fontSize={10}
            fill="#a1a1aa"
            fontFamily="Inter"
          />
          <Rect
            {...commonProps}
            width={node.transform.width}
            height={node.transform.height}
            fill="rgba(99, 102, 241, 0.001)"
            stroke="#6366f1"
            strokeWidth={1 / zoom}
            dash={[4 / zoom, 4 / zoom]}
          />
        </Group>
      );
    }
    */
    if (node.type === 'frame') {
      const children = getChildrenOf(node.id, document.nodes);
      return (
        <React.Fragment key={node.id}>
          <Text
            id={`header_${node.id}`}
            x={node.transform.x}
            y={node.transform.y - 18}
            text={node.name}
            fontSize={11}
            fill="#94a3b8"
            fontFamily="Inter"
          />
          <Rect
            {...commonProps}
            width={node.transform.width}
            height={node.transform.height}
            fill={fillProp}
            stroke="#334155"
            strokeWidth={1}
            cornerRadius={typeof node.cornerRadius === 'number' ? node.cornerRadius : 0}
          />
          {children.map((childId) => {
            const childNode = document.nodes[childId];
            return childNode ? renderNode(childNode) : null;
          })}
        </React.Fragment>
      );
    }

    if (node.type === 'component' || node.type === 'instance') {
      const children = getChildrenOf(node.id, document.nodes);
      const childDocs = children.map((cid) => document.nodes[cid]).filter(Boolean);
      let cX = node.transform.x;
      let cY = node.transform.y;
      let cW = node.transform.width;
      let cH = node.transform.height;
      if (childDocs.length > 0) {
        const minX = Math.min(...childDocs.map((c) => c.transform.x));
        const minY = Math.min(...childDocs.map((c) => c.transform.y));
        const maxX = Math.max(...childDocs.map((c) => c.transform.x + c.transform.width));
        const maxY = Math.max(...childDocs.map((c) => c.transform.y + c.transform.height));
        cX = minX;
        cY = minY;
        cW = Math.max(5, maxX - minX);
        cH = Math.max(5, maxY - minY);
      }
      const accent = node.type === 'component' ? '#a855f7' : '#0d99ff';
      return (
        <React.Fragment key={node.id}>
          <Text
            id={`header_${node.id}`}
            x={cX}
            y={cY - 16}
            text={node.name}
            fontSize={10}
            fill={accent}
            fontFamily="Inter"
            onClick={(e) => {
              if (isCreationTool || isPathTool) return;
              e.cancelBubble = true;
              setSelectedIds([node.id]);
            }}
          />
          <Rect
            {...commonProps}
            x={cX}
            y={cY}
            width={cW}
            height={cH}
            fill="rgba(168, 85, 247, 0.06)"
            stroke={accent}
            strokeWidth={1 / zoom}
            dash={[4 / zoom, 4 / zoom]}
            hitFunc={(context, shape) => {
              context.beginPath();
              context.rect(0, 0, shape.width(), shape.height());
              context.closePath();
              context.fillStrokeShape(shape);
            }}
          />
          {children.map((childId) => {
            const childNode = document.nodes[childId];
            return childNode ? renderNode(childNode) : null;
          })}
        </React.Fragment>
      );
    }

    if (node.type === 'group') {
      const children = getChildrenOf(node.id, document.nodes);
      const childDocs = children.map((cid) => document.nodes[cid]).filter(Boolean);
      let gX = node.transform.x;
      let gY = node.transform.y;
      let gW = node.transform.width;
      let gH = node.transform.height;
      if (childDocs.length > 0) {
        const minX = Math.min(...childDocs.map((c) => c.transform.x));
        const minY = Math.min(...childDocs.map((c) => c.transform.y));
        const maxX = Math.max(...childDocs.map((c) => c.transform.x + c.transform.width));
        const maxY = Math.max(...childDocs.map((c) => c.transform.y + c.transform.height));
        gX = minX;
        gY = minY;
        gW = Math.max(5, maxX - minX);
        gH = Math.max(5, maxY - minY);
      }
      return (
        <React.Fragment key={node.id}>
          <Text
            id={`header_${node.id}`}
            x={gX}
            y={gY - 16}
            text={`Group (${children.length})`}
            fontSize={10}
            fill="#a1a1aa"
            fontFamily="Inter"
            onClick={(e) => {
              if (isCreationTool || isPathTool || isCommentMode) return;
              e.cancelBubble = true;
              setSelectedIds([node.id]);
            }}
          />
          <Rect
            {...commonProps}
            x={gX}
            y={gY}
            width={gW}
            height={gH}
            fill="rgba(99, 102, 241, 0.001)"
            stroke="#6366f1"
            strokeWidth={1 / zoom}
            dash={[4 / zoom, 4 / zoom]}
            hitFunc={(context, shape) => {
              context.beginPath();
              context.rect(0, 0, shape.width(), shape.height());
              context.closePath();
              context.fillStrokeShape(shape);
            }}
          />
          {children.map((childId) => {
            const childNode = document.nodes[childId];
            return childNode ? renderNode(childNode) : null;
          })}
        </React.Fragment>
      );
    }

    return null;
  };

  const getCursorClass = () => {
    if (isSpaceDown) return 'cursor-grabbing';
    if (activeTool === 'hand') return 'cursor-grab';
    if (activeTool === 'pencil' || activeTool === 'pen') return 'cursor-crosshair';
    if (activeTool === 'text') return 'cursor-text';
    if (activeTool === 'scale') return 'cursor-nwse-resize';
    if (isCreationTool) return 'cursor-crosshair';
    if (isCommentMode) return 'cursor-copy';
    return 'cursor-default';
  };

  return (
    <div
      ref={containerRef}
      className={`flex-1 h-full overflow-hidden relative canvas-grid ${getCursorClass()}`}
    >
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        x={pan.x}
        y={pan.y}
        scaleX={zoom}
        scaleY={zoom}
        draggable={isPanningTool}
        onDragMove={(e) => {
          if (e.target !== stageRef.current) return;
          setPan({ x: e.target.x(), y: e.target.y() });
        }}
        onDragEnd={(e) => {
          if (e.target !== stageRef.current) return;
          setPan({ x: Math.round(e.target.x()), y: Math.round(e.target.y()) });
        }}
        onWheel={handleWheel}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onDblClick={() => {
          if (activeTool === 'pen') finishPenPath();
        }}
        onDblTap={() => {
          if (activeTool === 'pen') finishPenPath();
        }}
        onContextMenu={(e) => {
          if (e.target !== stageRef.current) return;
          e.evt.preventDefault();
          const rect = containerRef.current?.getBoundingClientRect();
          setCanvasMenu({
            x: e.evt.clientX - (rect?.left || 0),
            y: e.evt.clientY - (rect?.top || 0),
            nodeId: null,
          });
        }}
      >
        <Layer>
          {/*
          {nodeIds.map((id) => {
            const n = document.nodes[id];
            return n ? renderNode(n) : null;
          })}
          */}
          {nodeIds
            .filter((id) => {
              const n = document.nodes[id];
              return !n?.parent || !document.nodes[n.parent];
            })
            .map((id) => {
              const n = document.nodes[id];
              return n ? renderNode(n) : null;
            })}
          {renderCreationPreview()}
          <Transformer
            ref={transformerRef}
            anchorSize={8}
            anchorStroke="#3b82f6"
            anchorFill="#ffffff"
            borderStroke="#3b82f6"
            onTransformEnd={handleTransformerEnd}
          />
        </Layer>
      </Stage>

      {Object.values(collaborators).map((collab) => {
        if (!collab.cursor) return null;
        const screenX = collab.cursor.x * zoom + pan.x;
        const screenY = collab.cursor.y * zoom + pan.y;
        return (
          <div
            key={collab.id}
            style={{ transform: `translate(${screenX}px, ${screenY}px)`, pointerEvents: 'none' }}
            className="absolute top-0 left-0 transition-transform duration-75 z-20 flex items-start gap-1"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill={collab.color}
              stroke="white"
              strokeWidth="1.5"
            >
              <polygon points="3,3 21,9 12,12 9,21" />
            </svg>
            <span
              style={{ backgroundColor: collab.color }}
              className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-white whitespace-nowrap shadow"
            >
              {collab.name}
            </span>
          </div>
        );
      })}

      {/* Interactive Anchored Comments Overlay */}
      {comments
        .filter((c) => !c.resolved)
        .map((comment) => {
          const screenX = comment.position.x * zoom + pan.x;
          const screenY = comment.position.y * zoom + pan.y;
          const isSelectedComment = activeCommentId === comment.id;

          return (
            <div
              key={comment.id}
              style={{ transform: `translate(${screenX}px, ${screenY}px)` }}
              className="absolute top-0 left-0 z-30 transition-transform"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveCommentId(isSelectedComment ? null : comment.id);
                }}
                style={{ backgroundColor: comment.authorColor }}
                className="w-6 h-6 rounded-full flex items-center justify-center text-white shadow-lg ring-2 ring-[#18181b] hover:scale-110 transition-transform cursor-pointer"
                title={`${comment.authorName}: ${comment.content}`}
              >
                <span className="text-[10px] font-bold">💬</span>
              </button>

              {isSelectedComment && (
                <div className="absolute top-7 left-0 w-64 bg-[#1c1c20] border border-zinc-700/80 rounded-xl p-3 shadow-2xl text-xs flex flex-col gap-2 z-40">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-[11px]">
                      {comment.authorName}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        resolveComment(comment.id);
                        setActiveCommentId(null);
                      }}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                      Resolve
                    </button>
                  </div>
                  <p className="text-zinc-200 text-xs leading-relaxed">{comment.content}</p>
                  <span className="text-[9px] text-zinc-500">
                    {new Date(comment.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          );
        })}

      {canvasMenu && (
        <>
          <div className="absolute inset-0 z-30" onClick={() => setCanvasMenu(null)} onContextMenu={(e) => e.preventDefault()} />
          <div
            style={{ top: Math.min(canvasMenu.y, Math.max(0, dimensions.height - 300)), left: Math.min(canvasMenu.x, Math.max(0, dimensions.width - 210)) }}
            className="absolute z-40 w-52 bg-[#1f1f23] border border-[#2e2e33] rounded-lg shadow-2xl py-1 text-xs text-zinc-200"
          >
            {canvasMenu.nodeId ? (
              <>
                <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-zinc-500 truncate">
                  {document.nodes[canvasMenu.nodeId]?.name || 'Layer'}
                </div>
                <button
                  onClick={() => {
                    copySelected();
                    setCanvasMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
                >
                  <span>Copy</span>
                  <span className="text-[10px] text-zinc-400">Ctrl+C</span>
                </button>
                <button
                  onClick={() => {
                    duplicateSelected();
                    setCanvasMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
                >
                  <span>Duplicate</span>
                  <span className="text-[10px] text-zinc-400">Ctrl+D</span>
                </button>
                <div className="h-px bg-[#2e2e33] my-1" />
                <button
                  onClick={() => {
                    groupSelected();
                    setCanvasMenu(null);
                  }}
                  disabled={selectedIds.length < 2}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <span>Group selection</span>
                  <span className="text-[10px] text-zinc-400">Ctrl+G</span>
                </button>
                <button
                  onClick={() => {
                    ungroupSelected();
                    setCanvasMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
                >
                  <span>Ungroup</span>
                  <span className="text-[10px] text-zinc-400">Ctrl+Shift+G</span>
                </button>
                <div className="h-px bg-[#2e2e33] my-1" />
                <button
                  onClick={() => {
                    moveLayer(canvasMenu.nodeId as string, 'bring-to-front');
                    setCanvasMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white"
                >
                  Bring to front
                </button>
                <button
                  onClick={() => {
                    moveLayer(canvasMenu.nodeId as string, 'send-to-back');
                    setCanvasMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white"
                >
                  Send to back
                </button>
                <div className="h-px bg-[#2e2e33] my-1" />
                <button
                  onClick={() => {
                    deleteSelected();
                    setCanvasMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-rose-600 hover:text-white text-rose-400 flex items-center justify-between"
                >
                  <span>Delete</span>
                  <span className="text-[10px]">Del</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    pasteClipboard();
                    setCanvasMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
                >
                  <span>Paste</span>
                  <span className="text-[10px] text-zinc-400">Ctrl+V</span>
                </button>
                <button
                  onClick={() => {
                    const page = document.pages[activePageId];
                    setSelectedIds(page ? [...page.children] : []);
                    setCanvasMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
                >
                  <span>Select all</span>
                  <span className="text-[10px] text-zinc-400">Ctrl+A</span>
                </button>
                <div className="h-px bg-[#2e2e33] my-1" />
                <button
                  onClick={() => {
                    setActiveTool('select');
                    setSelectedIds([]);
                    setCanvasMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white"
                >
                  Deselect
                </button>
                <button
                  onClick={() => {
                    zoomToFit();
                    setCanvasMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
                >
                  <span>Zoom to fit</span>
                  <span className="text-[10px] text-zinc-400">Shift+1</span>
                </button>
              </>
            )}
          </div>
        </>
      )}

      {isCommentMode && !pendingComment && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-full bg-[#0d99ff] text-white text-[11px] font-medium shadow-lg pointer-events-none">
          Click anywhere on the canvas to drop a comment
        </div>
      )}

      {pendingComment && (
        <div
          style={{
            position: 'absolute',
            left: `${pendingComment.x * zoom + pan.x}px`,
            top: `${pendingComment.y * zoom + pan.y}px`,
          }}
          className="z-40 flex flex-col gap-1.5 w-60 p-2 rounded-xl bg-[#1c1c20] border border-zinc-700/80 shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              New comment
            </span>
            <button
              onClick={() => {
                setPendingComment(null);
                setPendingCommentText('');
              }}
              className="text-[10px] text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
          <input
            autoFocus
            value={pendingCommentText}
            onChange={(e) => setPendingCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitComment();
              } else if (e.key === 'Escape') {
                setPendingComment(null);
                setPendingCommentText('');
              }
            }}
            placeholder="Add a comment and press Enter"
            className="bg-[#121214] border border-zinc-700 rounded px-2 py-1 text-[11px] text-white outline-none focus:border-blue-500"
          />
          <button
            onClick={commitComment}
            className="self-end text-[11px] px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium"
          >
            Post
          </button>
        </div>
      )}

      {editingTextId && document.nodes[editingTextId] && (
        <textarea
          autoFocus
          value={(document.nodes[editingTextId] as any).content || ''}
          onChange={(e) => updateNode(editingTextId, { content: e.target.value } as any)}
          onBlur={() => setEditingTextId(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
              setEditingTextId(null);
            }
          }}
          style={{
            position: 'absolute',
            left: `${document.nodes[editingTextId].transform.x * zoom + pan.x}px`,
            top: `${document.nodes[editingTextId].transform.y * zoom + pan.y}px`,
            width: `${Math.max(40, document.nodes[editingTextId].transform.width * zoom + 8)}px`,
            height: `${Math.max(20, document.nodes[editingTextId].transform.height * zoom + 4)}px`,
            fontSize: `${((document.nodes[editingTextId] as any).fontSize || 16) * zoom}px`,
            fontFamily: (document.nodes[editingTextId] as any).fontFamily || 'Inter',
            fontWeight: (document.nodes[editingTextId] as any).fontWeight || 500,
            fontStyle: 'normal',
            textAlign: (document.nodes[editingTextId] as any).textAlign || 'left',
            letterSpacing: `${((document.nodes[editingTextId] as any).letterSpacing || 0) * zoom}px`,
            color: document.nodes[editingTextId].fills.find((f) => f.visible !== false)?.color || '#ffffff',
            background: 'rgba(24, 24, 27, 0.9)',
            outline: '1.5px solid #3b82f6',
            borderRadius: '2px',
            padding: '0px 2px',
            margin: '0px',
            resize: 'none',
            overflow: 'hidden',
            lineHeight: (document.nodes[editingTextId] as any).lineHeight ?? 1.25,
            zIndex: 50,
          }}
        />
      )}
    </div>
  );
};
