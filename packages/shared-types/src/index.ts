export type ID = string;

export type ToolType =
  | 'select'
  | 'hand'
  | 'scale'
  | 'frame'
  | 'rect'
  | 'ellipse'
  | 'line'
  | 'text'
  | 'image'
  | 'star'
  | 'polygon'
  | 'pencil'
  | 'pen'
  | 'textOnPath';

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number; // degrees
}

export type FillType = 'solid' | 'linear-gradient' | 'radial-gradient' | 'image';

export interface SolidColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface GradientStop {
  offset: number;
  color: string;
}

export interface Fill {
  id: string;
  type: FillType;
  color?: string; // hex or rgba
  opacity?: number;
  visible?: boolean;
  gradientStops?: GradientStop[];
  gradientTransform?: number[];
  imageUrl?: string;
}

export interface Stroke {
  id: string;
  color: string;
  width: number;
  align?: 'inside' | 'center' | 'outside';
  opacity?: number;
  visible?: boolean;
  dashPattern?: number[];
}

// export interface Effect {
//   id: string;
//   type: 'drop-shadow' | 'inner-shadow' | 'layer-blur' | 'background-blur';
//   color?: string;
//   offset?: Point;
//   radius?: number;
//   spread?: number;
//   visible?: boolean;
// }
export interface Effect {
  id: string;
  type:
    | 'drop-shadow'
    | 'inner-shadow'
    | 'layer-blur'
    | 'background-blur'
    | 'noise'
    | 'texture'
    | 'glass'
    | 'shader'
    | string;
  color?: string;
  offset?: Point;
  radius?: number;
  spread?: number;
  visible?: boolean;
}

// export type NodeType = 'page' | 'frame' | 'group' | 'rect' | 'ellipse' | 'line' | 'text' | 'image' | 'component' | 'instance' | 'star' | 'polygon';
export type NodeType = 'page' | 'frame' | 'group' | 'rect' | 'ellipse' | 'line' | 'text' | 'image' | 'component' | 'instance' | 'star' | 'polygon' | 'textOnPath';

export interface BaseNode {
  id: ID;
  name: string;
  type: NodeType;
  parent?: ID | null;
  children?: ID[]; // child IDs in z-order
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode?: string;
  transform: Transform;
  fills: Fill[];
  strokes: Stroke[];
  effects: Effect[];
  cornerRadius?: number | number[]; // [tl, tr, br, bl]
}

// Vector/path extras used by the line, pencil, and pen tools
export interface BaseNode {
  points?: number[]; // polyline vertices relative to transform origin
  arrow?: boolean; // renders an arrowhead at the end of a line
}

export interface FrameNode extends BaseNode {
  type: 'frame';
  clipContent: boolean;
  layoutMode?: 'none' | 'horizontal' | 'vertical';
  padding?: { top: number; right: number; bottom: number; left: number };
  itemSpacing?: number;
}

// export interface ShapeNode extends BaseNode {
//   type: 'rect' | 'ellipse' | 'line';
// }
export interface ShapeNode extends BaseNode {
  type: 'rect' | 'ellipse' | 'line' | 'star' | 'polygon';
  numPoints?: number;
  innerRadius?: number;
  sides?: number;
}

export interface TextNode extends BaseNode {
  type: 'text' | 'textOnPath';
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number | string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  letterSpacing?: number;
  lineHeight?: number;
  radius?: number;
  innerRadius?: number;
  arcAngle?: number;
  startAngle?: number;
  isCurved?: boolean;
}

export interface ImageNode extends BaseNode {
  type: 'image';
  assetId?: string;
  src: string;
}

export type SceneNode = FrameNode | ShapeNode | TextNode | ImageNode | BaseNode;

export interface Page {
  id: ID;
  name: string;
  children: ID[];
  background: string;
}

export interface DocumentModel {
  id: ID;
  schemaVersion: number;
  title: string;
  pages: Record<ID, Page>;
  activePageId: ID;
  nodes: Record<ID, SceneNode>;
  createdAt: string;
  updatedAt: string;
}

export interface UserPresence {
  userId: ID;
  userName: string;
  userAvatar?: string;
  cursor?: Point | null;
  activePageId?: ID;
  selectedIds?: ID[];
  lastActive: number;
}

export type UserRole = 'owner' | 'editor' | 'viewer';

export interface User {
  id: ID;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

export interface AuthSession {
  user: User;
  token: string;
}

export interface Project {
  id: ID;
  title: string;
  ownerId: ID;
  documentIds: ID[];
  createdAt: string;
  // updatedAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Comment {
  id: ID;
  documentId: ID;
  pageId: ID;
  authorId: ID;
  authorName: string;
  authorColor: string;
  position: Point;
  content: string;
  resolved: boolean;
  createdAt: string;
}

export interface DocumentPermission {
  documentId: ID;
  userId: ID;
  role: UserRole;
}
