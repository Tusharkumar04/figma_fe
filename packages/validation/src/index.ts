import { z } from 'zod';

export const PointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const TransformSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number().optional().default(0),
});

export const FillSchema = z.object({
  id: z.string(),
  type: z.enum(['solid', 'linear-gradient', 'radial-gradient', 'image']),
  color: z.string().optional(),
  opacity: z.number().optional().default(1),
  visible: z.boolean().optional().default(true),
  imageUrl: z.string().optional(),
});

export const StrokeSchema = z.object({
  id: z.string(),
  color: z.string(),
  width: z.number().default(1),
  align: z.enum(['inside', 'center', 'outside']).optional().default('center'),
  opacity: z.number().optional().default(1),
  visible: z.boolean().optional().default(true),
});

export const EffectSchema = z.object({
  id: z.string(),
  type: z.enum(['drop-shadow', 'inner-shadow', 'layer-blur', 'background-blur']),
  color: z.string().optional(),
  offset: PointSchema.optional(),
  radius: z.number().optional().default(4),
  spread: z.number().optional().default(0),
  visible: z.boolean().optional().default(true),
});

export const BaseNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['page', 'frame', 'group', 'rect', 'ellipse', 'line', 'text', 'image', 'component', 'instance']),
  parent: z.string().nullable().optional(),
  children: z.array(z.string()).optional(),
  visible: z.boolean().default(true),
  locked: z.boolean().default(false),
  opacity: z.number().default(1),
  blendMode: z.string().optional(),
  transform: TransformSchema,
  fills: z.array(FillSchema).default([]),
  strokes: z.array(StrokeSchema).default([]),
  effects: z.array(EffectSchema).default([]),
  cornerRadius: z.union([z.number(), z.array(z.number())]).optional(),
  // Text node specific
  content: z.string().optional(),
  fontFamily: z.string().optional(),
  fontSize: z.number().optional(),
  fontWeight: z.union([z.number(), z.string()]).optional(),
  textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
  // Image node specific
  src: z.string().optional(),
  assetId: z.string().optional(),
  // Frame node specific
  clipContent: z.boolean().optional(),
});

export const PageSchema = z.object({
  id: z.string(),
  name: z.string(),
  children: z.array(z.string()),
  background: z.string().default('#1e1e1e'),
});

export const DocumentModelSchema = z.object({
  id: z.string(),
  schemaVersion: z.number().default(1),
  title: z.string().default('Untitled Design'),
  pages: z.record(z.string(), PageSchema),
  activePageId: z.string(),
  nodes: z.record(z.string(), BaseNodeSchema),
  // updatedAt: z.string(),
  updatedAt: z.string(),
});

export const RegisterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
