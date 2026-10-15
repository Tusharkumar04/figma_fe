import React, { useRef, useEffect, useState } from 'react';
// import { Stage, Layer, Rect, Circle, Text, Group, Transformer } from 'react-konva';
// import { Stage, Layer, Rect, Circle, Text, Group, Transformer, Star, RegularPolygon, Line } from 'react-konva';
// import { Stage, Layer, Rect, Circle, Text, Group, Transformer, Star, RegularPolygon, Line, Shape } from 'react-konva';
import { Stage, Layer, Rect, Circle, Text, Group, Transformer, Star, RegularPolygon, Line, Shape, Image as KonvaImage } from 'react-konva';
import { useEditorStore } from '../../store/editorStore';
import { SceneNode, NodeType, Point } from '@figma-app/shared-types';
import { measureTextBounds } from '@figma-app/document-model';
import Konva from 'konva';

const KonvaImageNode: React.FC<{
  node: SceneNode;
  commonProps: any;
  strokeProp?: string;
  strokeWidthProp?: number;
  cornerRadius?: number;
}> = ({ node, commonProps, strokeProp, strokeWidthProp, cornerRadius = 0 }) => {
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const imgUrl =
    (node as any).src ||
    (node as any).imageUrl ||
    node.fills?.find((f: any) => f.type === 'image' && (f as any).imageUrl)?.imageUrl;

  useEffect(() => {
    if (!imgUrl) return;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imgUrl;
    img.onload = () => setImageObj(img);
  }, [imgUrl]);

  if (!imageObj) {
    return (
      <Rect
        key={node.id}
        {...commonProps}
        width={node.transform.width}
        height={node.transform.height}
        fill="#1e293b"
        stroke={strokeProp || '#3b82f6'}
        strokeWidth={strokeWidthProp || 1}
        cornerRadius={cornerRadius}
      />
    );
  }

  return (
    <KonvaImage
      key={node.id}
      {...commonProps}
      image={imageObj}
      width={node.transform.width}
      height={node.transform.height}
      stroke={strokeProp}
      strokeWidth={strokeWidthProp}
      cornerRadius={cornerRadius}
    />
  );
};

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
    updateNode,
    batchUpdateNodes,
    addNode,
    collaborators,
    comments,
    resolveComment,
  } = useEditorStore();

  // const isCreationTool = ['frame', 'rect', 'ellipse', 'text', 'star', 'polygon', 'line'].includes(activeTool);
  const isCreationTool = ['frame', 'rect', 'ellipse', 'text', 'star', 'polygon', 'line', 'textOnPath'].includes(activeTool);

  // const activePage = document.pages[activePageId];
  const activePage = document?.pages ? document.pages[activePageId] : undefined;
  const nodeIds = activePage ? activePage.children : [];

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    const stage = stageRef.current;
    const tr = transformerRef.current;
    const selectedNodes = selectedIds
      .filter((id) => {
        const node = document.nodes[id];
        return node && isNodeEffectivelyVisible(node);
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

        updates.push({
          id,
          newProps: { transform: newTransform },
          prevProps: { transform: { ...docNode.transform } },
        });

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

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool === 'hand') return;

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
    if (!isDrawing || !drawStart) return;
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;
    const canvasX = (pointer.x - pan.x) / zoom;
    const canvasY = (pointer.y - pan.y) / zoom;
    setDrawCurrent({ x: canvasX, y: canvasY });
  };

  const handleStageMouseUp = () => {
    if (!isDrawing || !drawStart || !drawCurrent) return;

    if (activeTool === 'select') {
      const x1 = Math.min(drawStart.x, drawCurrent.x);
      const y1 = Math.min(drawStart.y, drawCurrent.y);
      const x2 = Math.max(drawStart.x, drawCurrent.x);
      const y2 = Math.max(drawStart.y, drawCurrent.y);
      const width = x2 - x1;
      const height = y2 - y1;

      if (width > 4 || height > 4) {
        const hits: string[] = [];
        nodeIds.forEach((id) => {
          const n = document.nodes[id];
          if (!n) return;
          const nx1 = n.transform.x;
          const ny1 = n.transform.y;
          const nx2 = nx1 + n.transform.width;
          const ny2 = ny1 + n.transform.height;
          if (nx1 < x2 && nx2 > x1 && ny1 < y2 && ny2 > y1) {
            hits.push(id);
          }
        });
        if (hits.length > 0) {
          setSelectedIds(hits);
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
      } else if (activeTool === 'textOnPath') {
        width = 180;
        height = 180;
      } else {
        width = 120;
        height = 120;
      }
    } else if (activeTool === 'text') {
      const textContent = 'Type something...';
      const bounds = measureTextBounds(textContent, 20, 'Inter');
      width = bounds.width;
      height = bounds.height;
    } else if (activeTool === 'textOnPath') {
      const size = Math.max(120, Math.min(width, height));
      width = size;
      height = size;
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

    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
  };

  const renderCreationPreview = () => {
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

    if (activeTool === 'textOnPath') {
      const size = Math.max(width, height);
      return (
        <Circle
          x={x + size / 2}
          y={y + size / 2}
          radius={size / 2}
          fill="rgba(59, 130, 246, 0.1)"
          stroke="#0d99ff"
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
    const fillProp = node.fills.find((f) => f.visible !== false)?.color || 'transparent';
    const strokeObj = node.strokes.find((s) => s.visible !== false);
    const strokeProp = strokeObj?.color;
    const strokeWidthProp = strokeObj?.width;

    const activeEffects = Array.isArray(node.effects) ? node.effects.filter((e) => e.visible !== false) : [];
    const shadowEffect = activeEffects.find((e) => e.type === 'drop-shadow' || e.type === 'inner-shadow');
    const shadowProps = shadowEffect
      ? {
          shadowColor: shadowEffect.color || 'rgba(0, 0, 0, 0.35)',
          shadowBlur: shadowEffect.radius !== undefined ? shadowEffect.radius : 10,
          shadowOffset: shadowEffect.offset || { x: 0, y: 4 },
          shadowOpacity: 1,
          shadowEnabled: true,
        }
      : {
          shadowBlur: node.type === 'rect' ? 8 : 0,
          shadowOpacity: node.type === 'rect' ? 0.08 : 0,
          shadowEnabled: node.type === 'rect',
        };

    const commonProps = {
      id: node.id,
      x: node.transform.x,
      y: node.transform.y,
      ...shadowProps,
      draggable: !isLocked && activeTool === 'select',
      onClick: (e: any) => {
        if (isCreationTool) return;
        e.cancelBubble = true;
        const targetId = (e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey)
          ? node.id
          : getTopGroupOrSelf(node.id, document.nodes);
        if (e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey) toggleSelectId(targetId);
        else setSelectedIds([targetId]);
      },
      onDblClick: (e: any) => {
        if (isCreationTool) return;
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

    const imgFill = (node as any).src || (node as any).imageUrl || node.fills?.find((f: any) => f.type === 'image' && (f as any).imageUrl);

    if (node.type === 'image' || (node.type === 'rect' && imgFill)) {
      return (
        <KonvaImageNode
          key={node.id}
          node={node}
          commonProps={commonProps}
          strokeProp={strokeProp}
          strokeWidthProp={strokeWidthProp}
          cornerRadius={typeof node.cornerRadius === 'number' ? node.cornerRadius : 0}
        />
      );
    }

    if (node.type === 'rect') {
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
          // shadowBlur={12}
          // shadowOpacity={0.15}
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
      return (
        <Line
          key={node.id}
          {...commonProps}
          points={[0, 0, node.transform.width, node.transform.height || 0]}
          stroke={strokeProp || fillProp || '#3b82f6'}
          strokeWidth={strokeWidthProp || 2}
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
          fill={fillProp}
          width={node.transform.width}
          onDblClick={(e) => {
            e.cancelBubble = true;
            setEditingTextId(node.id);
          }}
        />
      );
    }

    if (node.type === 'textOnPath') {
      const isSelected = selectedIds.includes(node.id);
      return (
        <Shape
          key={node.id}
          {...commonProps}
          width={node.transform.width}
          height={node.transform.height}
          onDblClick={(e) => {
            e.cancelBubble = true;
            setEditingTextId(node.id);
          }}
          hitFunc={(context: any, shape: any) => {
            const width = node.transform.width;
            const height = node.transform.height;
            const cx = width / 2;
            const cy = height / 2;
            const baseRadius = (node as any).radius || Math.min(width, height) / 2 - 16;
            const outerRadius = baseRadius + ((node as any).fontSize || 18) + 12;
            context.beginPath();
            context.arc(cx, cy, outerRadius, 0, Math.PI * 2);
            context.fillShape(shape);
          }}
          sceneFunc={(context: any, shape: any) => {
            const text = (node as any).content !== undefined ? (node as any).content : 'Type curved text...';
            const fontSize = (node as any).fontSize || 18;
            const fontFamily = (node as any).fontFamily || 'Inter';
            const fontWeight = (node as any).fontWeight || 500;
            const width = node.transform.width;
            const height = node.transform.height;
            const cx = width / 2;
            const cy = height / 2;
            const baseRadius = (node as any).radius || Math.min(width, height) / 2 - 16;
            const innerRadius = (node as any).innerRadius || Math.max(10, baseRadius - fontSize - 8);
            const outerRadius = baseRadius + fontSize / 2 + 6;
            const arcAngle = (node as any).arcAngle || 270;
            const startAngleDeg = (node as any).startAngle !== undefined ? (node as any).startAngle : -225;

            const startAngleRad = (startAngleDeg * Math.PI) / 180;
            const sweepRad = (arcAngle * Math.PI) / 180;
            const endAngleRad = startAngleRad + sweepRad;

            if (text.length > 0) {
              context.save();
              context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
              context.fillStyle = fillProp && fillProp !== 'transparent' ? fillProp : '#000000';
              context.textAlign = 'center';
              context.textBaseline = 'middle';

              const chars = text.split('');
              const charWidths = chars.map((ch: string) => Math.max(4, context.measureText(ch).width));
              const totalTextWidth = charWidths.reduce((a: number, b: number) => a + b, 0);
              const arcLength = sweepRad * baseRadius;

              if (totalTextWidth >= arcLength) {
                const stepAngle = sweepRad / chars.length;
                chars.forEach((ch: string, i: number) => {
                  const charAngle = startAngleRad + (i + 0.5) * stepAngle;
                  context.save();
                  const px = cx + baseRadius * Math.cos(charAngle);
                  const py = cy + baseRadius * Math.sin(charAngle);
                  context.translate(px, py);
                  context.rotate(charAngle + Math.PI / 2);
                  context.fillText(ch, 0, 0);
                  context.restore();
                });
              } else {
                const charSpacing = (arcLength - totalTextWidth) / Math.max(1, chars.length);
                let currentPos = charSpacing / 2;
                chars.forEach((ch: string, i: number) => {
                  const w = charWidths[i];
                  const midPos = currentPos + w / 2;
                  const charAngle = startAngleRad + (midPos / arcLength) * sweepRad;
                  context.save();
                  const px = cx + baseRadius * Math.cos(charAngle);
                  const py = cy + baseRadius * Math.sin(charAngle);
                  context.translate(px, py);
                  context.rotate(charAngle + Math.PI / 2);
                  context.fillText(ch, 0, 0);
                  context.restore();
                  currentPos += w + charSpacing;
                });
              }
              context.restore();
            }

            if (isSelected) {
              context.save();
              context.strokeStyle = '#0d99ff';
              context.lineWidth = 1.5;

              context.beginPath();
              context.arc(cx, cy, outerRadius, startAngleRad, endAngleRad, false);
              context.stroke();

              context.beginPath();
              context.moveTo(cx + outerRadius * Math.cos(endAngleRad), cy + outerRadius * Math.sin(endAngleRad));
              context.lineTo(cx + innerRadius * Math.cos(endAngleRad), cy + innerRadius * Math.sin(endAngleRad));
              context.stroke();

              context.beginPath();
              context.arc(cx, cy, innerRadius, endAngleRad, startAngleRad, true);
              context.stroke();

              context.beginPath();
              context.moveTo(cx + innerRadius * Math.cos(startAngleRad), cy + innerRadius * Math.sin(startAngleRad));
              context.lineTo(cx + outerRadius * Math.cos(startAngleRad), cy + outerRadius * Math.sin(startAngleRad));
              context.stroke();

              context.beginPath();
              context.setLineDash([4, 4]);
              context.arc(cx, cy, baseRadius, endAngleRad, startAngleRad, false);
              context.stroke();
              context.setLineDash([]);

              const handleX = cx + baseRadius * Math.cos(-Math.PI / 2);
              const handleY = cy + baseRadius * Math.sin(-Math.PI / 2);
              context.beginPath();
              context.arc(handleX, handleY, 4, 0, Math.PI * 2);
              context.fillStyle = '#ffffff';
              context.fill();
              context.strokeStyle = '#0d99ff';
              context.lineWidth = 1.5;
              context.stroke();

              context.restore();
            }

            context.fillStrokeShape(shape);
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
      const isRootFrame = !node.parent || !document.nodes[node.parent];
      const children = getChildrenOf(node.id, document.nodes);
      return (
        <React.Fragment key={node.id}>
          {isRootFrame && (
            <Text
              id={`header_${node.id}`}
              x={node.transform.x}
              y={node.transform.y - 18}
              text={node.name}
              fontSize={11}
              fill="#94a3b8"
              fontFamily="Inter"
            />
          )}
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
              if (isCreationTool) return;
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
    if (activeTool === 'hand') return 'cursor-grab';
    if (isCreationTool) return 'cursor-crosshair';
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
        draggable={activeTool === 'hand'}
        onWheel={handleWheel}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
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
            color: document.nodes[editingTextId].fills.find((f) => f.visible !== false)?.color || '#ffffff',
            background: 'rgba(24, 24, 27, 0.9)',
            outline: '1.5px solid #3b82f6',
            borderRadius: '2px',
            padding: '0px 2px',
            margin: '0px',
            resize: 'none',
            overflow: 'hidden',
            lineHeight: 1.25,
            zIndex: 50,
          }}
        />
      )}
    </div>
  );
};
