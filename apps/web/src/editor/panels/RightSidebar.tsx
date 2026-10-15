import React, { useState, useMemo, useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';
import {
  Sliders,
  Plus,
  Trash2,
  Copy,
  Folder,
  Scissors,
  ClipboardPaste,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignHorizontalSpaceBetween,
  AlignVerticalSpaceBetween,
  Layers,
  Code2,
  Play,
  Check,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Droplet,
  Link2,
  LayoutGrid,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ChevronDown,
  Lock,
  Eye,
  EyeOff,
  Minus,
} from 'lucide-react';
import { AlignmentType, DistributionType } from '@figma-app/editor-commands';
import { measureTextBounds } from '@figma-app/document-model';
import { generateNodeCss } from '../../services/cssGenerator';
import { FigmaColorPicker } from './FigmaColorPicker';
import {
  exportCanvasToRaster,
  exportDocumentToSvg,
  exportDocumentToPdf,
} from '../../services/exportEngine';

// Figma Custom SVG Icons
const AlignLeftIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <rect x="2" y="2" width="1.5" height="12" rx="0.5" />
    <rect x="5.5" y="4" width="7.5" height="3" rx="1" />
    <rect x="5.5" y="9" width="5" height="3" rx="1" />
  </svg>
);

const AlignHCenterIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <rect x="7.25" y="2" width="1.5" height="12" rx="0.5" />
    <rect x="3" y="4" width="10" height="3" rx="1" />
    <rect x="4.5" y="9" width="7" height="3" rx="1" />
  </svg>
);

const AlignRightIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <rect x="12.5" y="2" width="1.5" height="12" rx="0.5" />
    <rect x="3" y="4" width="7.5" height="3" rx="1" />
    <rect x="5.5" y="9" width="5" height="3" rx="1" />
  </svg>
);

const AlignTopIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <rect x="2" y="2" width="12" height="1.5" rx="0.5" />
    <rect x="4" y="5.5" width="3" height="7.5" rx="1" />
    <rect x="9" y="5.5" width="3" height="5" rx="1" />
  </svg>
);

const AlignVCenterIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <rect x="2" y="7.25" width="12" height="1.5" rx="0.5" />
    <rect x="4" y="3" width="3" height="10" rx="1" />
    <rect x="9" y="4.5" width="3" height="7" rx="1" />
  </svg>
);

const AlignBottomIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <rect x="2" y="12.5" width="12" height="1.5" rx="0.5" />
    <rect x="4" y="3" width="3" height="7.5" rx="1" />
    <rect x="9" y="5.5" width="3" height="5" rx="1" />
  </svg>
);

const ComponentIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1.5L10.5 4L8 6.5L5.5 4L8 1.5Z" />
    <path d="M14.5 8L12 10.5L9.5 8L12 5.5L14.5 8Z" />
    <path d="M8 14.5L5.5 12L8 9.5L10.5 12L8 14.5Z" />
    <path d="M1.5 8L4 5.5L6.5 8L4 10.5L1.5 8Z" />
  </svg>
);

const MaskIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="6" />
    <path d="M8 2A6 6 0 0 1 8 14Z" fill="currentColor" stroke="none" />
  </svg>
);

const BooleanIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
    <rect x="2" y="2" width="7.5" height="7.5" rx="1" />
    <rect x="6.5" y="6.5" width="7.5" height="7.5" rx="1" />
  </svg>
);

const VectorEditIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
    <rect x="3" y="3" width="10" height="10" rx="0.5" strokeDasharray="2 2" />
    <rect x="2" y="2" width="2.5" height="2.5" fill="currentColor" stroke="none" />
    <rect x="11.5" y="2" width="2.5" height="2.5" fill="currentColor" stroke="none" />
    <rect x="2" y="11.5" width="2.5" height="2.5" fill="currentColor" stroke="none" />
    <rect x="11.5" y="11.5" width="2.5" height="2.5" fill="currentColor" stroke="none" />
  </svg>
);

const AngleIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2.5 13.5H13.5" strokeLinecap="round" />
    <path d="M3 13L10.5 3.5" strokeLinecap="round" />
    <path d="M7 13.5C7 11.5 8 9.5 9 8.5" strokeLinecap="round" />
  </svg>
);

const ShearDiamondIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <polygon points="8,2 14,8 8,14 2,8" />
  </svg>
);

const ConstrainProportionsIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" />
    <path d="M10 6L6 10M10 6H8M10 6V8M6 10H8M6 10V8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CheckerboardOpacityIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <rect x="2" y="2" width="6" height="6" fill="#71717a" />
    <rect x="8" y="2" width="6" height="6" fill="#e4e4e7" />
    <rect x="2" y="8" width="6" height="6" fill="#e4e4e7" />
    <rect x="8" y="8" width="6" height="6" fill="#71717a" />
    <rect x="2" y="2" width="12" height="12" fill="none" stroke="#71717a" strokeWidth="1" rx="1" />
  </svg>
);

const CornerRadiusIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <rect x="2.5" y="2.5" width="11" height="11" rx="1" strokeDasharray="2 2" />
    <path d="M2.5 7V4C2.5 3.17 3.17 2.5 4 2.5H7" strokeWidth="1.8" />
  </svg>
);

const StylesFourDotsIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <circle cx="5" cy="5" r="1.5" />
    <circle cx="11" cy="5" r="1.5" />
    <circle cx="5" cy="11" r="1.5" />
    <circle cx="11" cy="11" r="1.5" />
  </svg>
);

const LineHeightIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <rect x="2.5" y="2.5" width="11" height="1.5" rx="0.5" />
    <rect x="2.5" y="12" width="11" height="1.5" rx="0.5" />
    <path d="M8 5L6 7H10L8 5Z" />
    <path d="M8 11L6 9H10L8 11Z" />
    <rect x="7.25" y="6.5" width="1.5" height="3" />
  </svg>
);

const TextVerticalSpacingIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M8 2.5V13.5M5.5 5L8 2.5L10.5 5M5.5 11L8 13.5L10.5 11" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TextAlignTopIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M2.5 2.5H13.5" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M8 13.5V6M5.5 8.5L8 6L10.5 8.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TextAlignMiddleIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M2.5 8H13.5" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M8 3V6M5.5 4.5L8 3L10.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 13V10M5.5 11.5L8 13L10.5 11.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TextAlignBottomIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M2.5 13.5H13.5" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M8 2.5V10M5.5 7.5L8 10L10.5 7.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MoreTextDetailsIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <circle cx="3" cy="8" r="1.3" />
    <circle cx="8" cy="8" r="1.3" />
    <circle cx="13" cy="8" r="1.3" />
  </svg>
);

const StrokeWeightIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <rect x="2.5" y="3" width="11" height="1" rx="0.5" />
    <rect x="2.5" y="7" width="11" height="2" rx="0.5" />
    <rect x="2.5" y="12" width="11" height="3" rx="0.5" />
  </svg>
);

const InnerShadowIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor">
    <rect x="2.5" y="2.5" width="11" height="11" rx="2" strokeWidth="1.4" />
    <rect x="4" y="4" width="4.5" height="4.5" rx="1" fill="currentColor" stroke="none" />
  </svg>
);

const DropShadowIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor">
    <path d="M5 11.5H11.5C12.33 11.5 13 10.83 13 10V4.5" strokeWidth="1.3" opacity="0.6" strokeLinecap="round" />
    <rect x="2.5" y="2.5" width="8.5" height="8.5" rx="1.5" strokeWidth="1.4" fill="none" />
  </svg>
);

const LayerBlurIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <circle cx="3.5" cy="3.5" r="1" />
    <circle cx="6.5" cy="3.5" r="1" />
    <circle cx="9.5" cy="3.5" r="1" />
    <circle cx="12.5" cy="3.5" r="1" />
    <circle cx="3.5" cy="6.5" r="1" />
    <circle cx="6.5" cy="6.5" r="1" opacity="0.7" />
    <circle cx="9.5" cy="6.5" r="1" opacity="0.7" />
    <circle cx="12.5" cy="6.5" r="1" />
    <circle cx="3.5" cy="9.5" r="1" />
    <circle cx="6.5" cy="9.5" r="1" opacity="0.7" />
    <circle cx="9.5" cy="9.5" r="1" opacity="0.7" />
    <circle cx="12.5" cy="9.5" r="1" />
    <circle cx="3.5" cy="12.5" r="1" />
    <circle cx="6.5" cy="12.5" r="1" />
    <circle cx="9.5" cy="12.5" r="1" />
    <circle cx="12.5" cy="12.5" r="1" />
  </svg>
);

const BackgroundBlurIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor">
    <rect x="2.5" y="2.5" width="11" height="11" rx="2" strokeWidth="1.3" />
    <line x1="2.5" y1="8" x2="13.5" y2="8" strokeWidth="1.2" />
    <line x1="8" y1="2.5" x2="8" y2="13.5" strokeWidth="1.2" />
  </svg>
);

const NoiseIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <rect x="2.5" y="2.5" width="11" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="5" cy="5" r="0.7" />
    <circle cx="7" cy="6" r="0.6" />
    <circle cx="10" cy="5" r="0.8" />
    <circle cx="6" cy="8" r="0.7" />
    <circle cx="9" cy="8" r="0.6" />
    <circle cx="11" cy="9" r="0.7" />
    <circle cx="5" cy="11" r="0.8" />
    <circle cx="8" cy="11" r="0.6" />
    <circle cx="10" cy="11" r="0.7" />
  </svg>
);

const TextureIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <circle cx="4" cy="4" r="0.9" />
    <circle cx="8" cy="4" r="0.9" />
    <circle cx="12" cy="4" r="0.9" />
    <circle cx="4" cy="8" r="0.9" />
    <circle cx="8" cy="8" r="0.9" />
    <circle cx="12" cy="8" r="0.9" />
    <circle cx="4" cy="12" r="0.9" />
    <circle cx="8" cy="12" r="0.9" />
    <circle cx="12" cy="12" r="0.9" />
  </svg>
);

const GlassIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor">
    <circle cx="8" cy="8" r="5.5" strokeWidth="1.4" />
    <path d="M5.5 5.5C6.3 4.7 7.2 4.3 8.3 4.3" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const ShaderIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M2.5 5.5C4 4 6 7 8 5.5C10 4 12 7 13.5 5.5" />
    <path d="M2.5 8.5C4 7 6 10 8 8.5C10 7 12 10 13.5 8.5" />
    <path d="M2.5 11.5C4 10 6 13 8 11.5C10 10 12 13 13.5 11.5" />
  </svg>
);

interface EffectMenuItem {
  type: string;
  name: string;
  icon: React.FC<{ className?: string }>;
  isBeta?: boolean;
}

const EFFECT_MENU_ITEMS: EffectMenuItem[] = [
  { type: 'inner-shadow', name: 'Inner shadow', icon: InnerShadowIcon },
  { type: 'drop-shadow', name: 'Drop shadow', icon: DropShadowIcon },
  { type: 'layer-blur', name: 'Layer blur', icon: LayerBlurIcon },
  { type: 'background-blur', name: 'Background blur', icon: BackgroundBlurIcon },
  { type: 'noise', name: 'Noise', icon: NoiseIcon },
  { type: 'texture', name: 'Texture', icon: TextureIcon },
  { type: 'glass', name: 'Glass', icon: GlassIcon },
];

const SHADER_MENU_ITEM: EffectMenuItem = {
  type: 'shader',
  name: 'Shader',
  icon: ShaderIcon,
  isBeta: true,
};

export const RightSidebar: React.FC = () => {
  const {
    document,
    selectedIds,
    updateNode,
    deleteSelected,
    duplicateSelected,
    copySelected,
    cutSelected,
    groupSelected,
    alignSelected,
    distributeSelected,
    activeTab,
    setActiveTab,
    setPrototypeMode,
    setActivePrototypeFrameId,
    zoom,
    setZoom,
  } = useEditorStore();

  const [copiedCss, setCopiedCss] = useState(false);
  // const [activeColorPicker, setActiveColorPicker] = useState<{
  //   fillIndex: number;
  //   color: string;
  //   opacity: number;
  //   top: number;
  //   right: number;
  // } | null>(null);
  const [activeColorPicker, setActiveColorPicker] = useState<{
    targetType: 'fill' | 'stroke';
    index: number;
    color: string;
    opacity: number;
    top: number;
    right: number;
  } | null>(null);
  const [showZoomMenu, setShowZoomMenu] = useState(false);

  const documentSwatches = useMemo(() => {
    const set = new Set<string>();
    Object.values(document.nodes).forEach((n) => {
      n.fills?.forEach((f) => {
        if (f.color && f.visible !== false) set.add(f.color.toUpperCase());
      });
      n.strokes?.forEach((s) => {
        if (s.color && s.visible !== false) set.add(s.color.toUpperCase());
      });
    });
    ['#FF0404', '#FFFFFF', '#000000'].forEach((c) => set.add(c));
    return Array.from(set).slice(0, 8);
  }, [document.nodes]);

  const [showEffectsMenu, setShowEffectsMenu] = useState(false);
  const [effectsMenuPosition, setEffectsMenuPosition] = useState<{
    top?: number;
    bottom?: number;
    right: number;
  } | null>(null);
  const [activeEffectDropdownIndex, setActiveEffectDropdownIndex] = useState<number | null>(null);
  const [hoveredEffectType, setHoveredEffectType] = useState<string>('inner-shadow');
  const [showExportRow, setShowExportRow] = useState(true);
  const [exportFormat, setExportFormat] = useState<'PNG' | 'JPG' | 'SVG' | 'PDF'>('PNG');
  const [exportScale, setExportScale] = useState<string>('1x');
  const [showEffectSettingsId, setShowEffectSettingsId] = useState<string | null>(null);

  useEffect(() => {
    if (!showEffectsMenu && activeEffectDropdownIndex === null) return;
    const handleClick = () => {
      setShowEffectsMenu(false);
      setActiveEffectDropdownIndex(null);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [showEffectsMenu, activeEffectDropdownIndex]);

  const isMultiSelection = selectedIds.length > 1;
  const isSingleSelection = selectedIds.length === 1;
  const selectedNode = isSingleSelection ? document.nodes[selectedIds[0]] : null;

  const handleAlign = (alignment: AlignmentType) => {
    alignSelected(alignment);
  };

  const handleDistribute = (distribution: DistributionType) => {
    distributeSelected(distribution);
  };

  const handleCopyCss = (cssText: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(cssText);
      setCopiedCss(true);
      setTimeout(() => setCopiedCss(false), 1500);
    }
  };

  // Render Top Tab Switcher: Design | Prototype | Inspect
  const renderTabSwitcher = () => (
    <div className="flex items-center border-b border-[#27272a] bg-[#141416] text-[11px] font-medium px-2">
      <button
        onClick={() => setActiveTab('design')}
        className={`flex-1 py-2 text-center border-b-2 transition-colors ${
          activeTab === 'design'
            ? 'border-blue-500 text-white font-semibold'
            : 'border-transparent text-zinc-400 hover:text-zinc-200'
        }`}
      >
        Design
      </button>
      <button
        onClick={() => setActiveTab('prototype')}
        className={`flex-1 py-2 text-center border-b-2 transition-colors ${
          activeTab === 'prototype'
            ? 'border-blue-500 text-white font-semibold'
            : 'border-transparent text-zinc-400 hover:text-zinc-200'
        }`}
      >
        Prototype
      </button>
      <button
        onClick={() => setActiveTab('inspect')}
        className={`flex-1 py-2 text-center border-b-2 transition-colors ${
          activeTab === 'inspect'
            ? 'border-blue-500 text-white font-semibold'
            : 'border-transparent text-zinc-400 hover:text-zinc-200'
        }`}
      >
        Inspect
      </button>
    </div>
  );

  // Alignment Toolbar Component
  const renderAlignmentToolbar = () => (
    <div className="p-2 border-b border-[#27272a] bg-[#1a1a1e] flex items-center justify-between gap-1">
      <div className="flex items-center gap-0.5">
        {/* <button
          onClick={() => handleAlign('left')}
          disabled={selectedIds.length < 2}
          title="Align Left"
          className="p-1.5 rounded hover:bg-[#27272a] text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <AlignStartHorizontal className="w-3.5 h-3.5" />
        </button> */}
        <button
          onClick={() => handleAlign('left')}
          disabled={selectedIds.length < 1}
          title="Align Left"
          className="p-1.5 rounded hover:bg-[#27272a] text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <AlignStartHorizontal className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleAlign('center')}
          disabled={selectedIds.length < 1}
          title="Align Horizontal Center"
          className="p-1.5 rounded hover:bg-[#27272a] text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <AlignCenterHorizontal className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleAlign('right')}
          disabled={selectedIds.length < 1}
          title="Align Right"
          className="p-1.5 rounded hover:bg-[#27272a] text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <AlignEndHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-3 w-px bg-zinc-800" />

      <div className="flex items-center gap-0.5">
        <button
          onClick={() => handleAlign('top')}
          disabled={selectedIds.length < 1}
          title="Align Top"
          className="p-1.5 rounded hover:bg-[#27272a] text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <AlignStartVertical className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleAlign('middle')}
          disabled={selectedIds.length < 1}
          title="Align Vertical Middle"
          className="p-1.5 rounded hover:bg-[#27272a] text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <AlignCenterVertical className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleAlign('bottom')}
          disabled={selectedIds.length < 1}
          title="Align Bottom"
          className="p-1.5 rounded hover:bg-[#27272a] text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <AlignEndVertical className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-3 w-px bg-zinc-800" />

      <div className="flex items-center gap-0.5">
        <button
          onClick={() => handleDistribute('horizontal')}
          disabled={selectedIds.length < 3}
          title="Distribute Horizontal Spacing"
          className="p-1.5 rounded hover:bg-[#27272a] text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <AlignHorizontalSpaceBetween className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleDistribute('vertical')}
          disabled={selectedIds.length < 3}
          title="Distribute Vertical Spacing"
          className="p-1.5 rounded hover:bg-[#27272a] text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <AlignVerticalSpaceBetween className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  // Prototype Tab Content
  const renderPrototypeTab = () => {
    const allFrames = Object.values(document.nodes).filter((n) => n.type === 'frame');

    return (
      <div className="p-3 flex flex-col gap-4 text-xs text-zinc-300">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-zinc-200">Prototype Flows</span>
          <button
            onClick={() => {
              if (selectedNode && selectedNode.type === 'frame') {
                setActivePrototypeFrameId(selectedNode.id);
                setPrototypeMode(true);
              } else if (allFrames.length > 0) {
                setActivePrototypeFrameId(allFrames[0].id);
                setPrototypeMode(true);
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium shadow-sm"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Present</span>
          </button>
        </div>

        <div className="p-2.5 rounded-lg bg-[#202024] border border-zinc-800 flex flex-col gap-2">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Flow Starting Point
          </span>
          <select
            value={selectedNode?.type === 'frame' ? selectedNode.id : allFrames[0]?.id || ''}
            onChange={(e) => setActivePrototypeFrameId(e.target.value)}
            className="bg-[#18181b] border border-zinc-700 rounded p-1.5 text-zinc-200 outline-none text-xs"
          >
            {allFrames.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-zinc-500">
            Select the screen where users begin testing interactive flows.
          </p>
        </div>

        {selectedNode && (
          <div className="p-2.5 rounded-lg bg-[#202024] border border-zinc-800 flex flex-col gap-2">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Trigger & Transition
            </span>
            <div className="flex items-center justify-between text-zinc-300 text-[11px]">
              <span>Event</span>
              <span className="font-mono bg-zinc-800 px-1.5 py-0.5 rounded">On Click</span>
            </div>
            <div className="flex items-center justify-between text-zinc-300 text-[11px]">
              <span>Action</span>
              <span className="font-mono bg-zinc-800 px-1.5 py-0.5 rounded">Navigate To</span>
            </div>
            <div className="flex items-center justify-between text-zinc-300 text-[11px]">
              <span>Animation</span>
              <span className="font-mono bg-zinc-800 px-1.5 py-0.5 rounded">Instant (0ms)</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Inspect Tab Content (Developer Handoff)
  const renderInspectTab = () => {
    if (!selectedNode) {
      return (
        <div className="p-4 text-center text-zinc-500 text-xs mt-8">
          Select an element to inspect CSS styles and design measurements.
        </div>
      );
    }

    const { styles, cssString } = generateNodeCss(selectedNode);

    return (
      <div className="p-3 flex flex-col gap-3 text-xs text-zinc-300">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
            <Code2 className="w-4 h-4 text-blue-400" />
            <span>CSS Code</span>
          </span>
          <button
            onClick={() => handleCopyCss(cssString)}
            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-[#27272a] hover:bg-[#323238] text-zinc-200"
          >
            {copiedCss ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <pre className="bg-[#121214] p-2.5 rounded border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto select-text leading-relaxed">
          {cssString}
        </pre>

        <div className="mt-2 flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Computed Values
          </span>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            {Object.entries(styles).map(([prop, val]) => (
              <div key={prop} className="bg-[#202024] p-1.5 rounded border border-zinc-800/80">
                <span className="text-zinc-500 font-mono block">{prop}</span>
                <span className="text-zinc-200 font-medium truncate block">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Original empty selection:
  /*
  if (selectedIds.length === 0) {
    return (
      <aside className="w-72 border-l border-[#27272a] bg-[#18181b] flex flex-col h-full text-xs text-zinc-400 select-none z-10">
        {renderTabSwitcher()}
        {activeTab === 'prototype' ? (
          renderPrototypeTab()
        ) : activeTab === 'inspect' ? (
          renderInspectTab()
        ) : (
          <div className="text-center mt-12 flex flex-col items-center gap-2 p-4">
            <Sliders className="w-8 h-8 text-zinc-600" />
            <p className="font-medium text-zinc-300">No element selected</p>
            <p className="text-[11px] text-zinc-500 max-w-[180px]">
              Select a frame, shape, or text layer to inspect and edit its design properties.
            </p>
          </div>
        )}
      </aside>
    );
  }
  */

  if (selectedIds.length === 0) {
    return (
      <aside className="w-72 border-l border-zinc-200 bg-white flex flex-col h-full text-xs text-zinc-800 select-none z-10 shadow-[-2px_0_8px_rgba(0,0,0,0.02)] relative">
        {/* Top Bar: Avatar | Play | Share */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100 bg-white">
          <div className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 rounded-full bg-[#38383d] text-white flex items-center justify-center font-semibold text-xs shadow-xs">
              T
            </div>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const allFrames = Object.values(document.nodes).filter((n) => n.type === 'frame');
                if (allFrames.length > 0) setActivePrototypeFrameId(allFrames[0].id);
                setPrototypeMode(true);
              }}
              className="flex items-center gap-0.5 p-1 hover:bg-zinc-100 rounded text-zinc-700 transition-colors"
              title="Present Prototype"
            >
              <Play className="w-3.5 h-3.5 fill-current text-zinc-800" />
              <ChevronDown className="w-2.5 h-2.5 text-zinc-400" />
            </button>
            <button
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
              className="px-3 py-1 bg-[#0d99ff] hover:bg-[#0b87e3] text-white rounded-md font-medium text-xs shadow-xs transition-colors"
            >
              Share
            </button>
          </div>
        </div>

        {/* Sub-Tabs: Design | Prototype & Zoom dropdown */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-4 text-xs font-medium">
            <button
              onClick={() => setActiveTab('design')}
              className={`transition-colors relative pb-0.5 ${
                activeTab === 'design'
                  ? 'text-zinc-900 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-700'
              }`}
            >
              Design
            </button>
            <button
              onClick={() => setActiveTab('prototype')}
              className={`transition-colors relative pb-0.5 ${
                activeTab === 'prototype'
                  ? 'text-zinc-900 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-700'
              }`}
            >
              Prototype
            </button>
          </div>
          <div className="flex items-center gap-0.5 text-xs text-zinc-600 font-medium px-1 py-0.5 rounded">
            <span>{Math.round(zoom * 100)}%</span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </div>
        </div>

        {activeTab === 'prototype' ? (
          renderPrototypeTab()
        ) : activeTab === 'inspect' ? (
          renderInspectTab()
        ) : (
          <div className="text-center mt-16 flex flex-col items-center gap-2 p-6">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-1">
              <Sliders className="w-6 h-6" />
            </div>
            <p className="font-semibold text-zinc-800 text-xs">No layer selected</p>
            <p className="text-[11px] text-zinc-400 max-w-[200px] leading-relaxed">
              Select an element on canvas to inspect and edit its position, appearance, and typography properties.
            </p>
          </div>
        )}

        {/* Floating Help Circle Button '?' */}
        <div className="absolute right-3 bottom-3 z-30">
          <button
            className="w-8 h-8 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.12)] border border-zinc-200/80 flex items-center justify-center text-zinc-700 hover:text-zinc-950 hover:scale-105 transition-all text-sm font-medium"
            title="Help and Resources"
          >
            ?
          </button>
        </div>
      </aside>
    );
  }

  if (isMultiSelection) {
    return (
      <aside className="w-72 border-l border-[#27272a] bg-[#18181b] flex flex-col h-full overflow-y-auto text-xs text-zinc-300 select-none z-10">
        {renderTabSwitcher()}
        {activeTab === 'prototype' ? (
          renderPrototypeTab()
        ) : activeTab === 'inspect' ? (
          renderInspectTab()
        ) : (
          <>
            {renderAlignmentToolbar()}
            <div className="p-3 border-b border-[#27272a] flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-zinc-100 text-xs">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>{selectedIds.length} Layers Selected</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={groupSelected}
                  className="p-1 hover:bg-[#27272a] rounded text-zinc-400 hover:text-white"
                  title="Group Selection (Ctrl+G)"
                >
                  <Folder className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={copySelected}
                  className="p-1 hover:bg-[#27272a] rounded text-zinc-400 hover:text-white"
                  title="Copy (Ctrl+C)"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={cutSelected}
                  className="p-1 hover:bg-[#27272a] rounded text-zinc-400 hover:text-white"
                  title="Cut (Ctrl+X)"
                >
                  <Scissors className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={duplicateSelected}
                  className="p-1 hover:bg-[#27272a] rounded text-zinc-400 hover:text-white"
                  title="Duplicate Selection (Ctrl+D)"
                >
                  <Copy className="w-3.5 h-3.5 text-blue-400" />
                </button>
                <button
                  onClick={deleteSelected}
                  className="p-1 hover:bg-[#27272a] rounded text-zinc-400 hover:text-rose-400"
                  title="Delete Selection (Del)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-3 border-b border-[#27272a]/60 flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Alignment & Distribution
              </span>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Use the alignment controls at the top to align edges or distribute spacing evenly across selected layers.
              </p>
            </div>

            <div className="p-3 flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Selected Items
              </span>
              <div className="flex flex-col gap-1 max-h-60 overflow-y-auto pr-1">
                {selectedIds.map((id) => {
                  const node = document.nodes[id];
                  if (!node) return null;
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between px-2 py-1.5 rounded bg-[#202024] border border-zinc-800 text-[11px]"
                    >
                      <span className="truncate text-zinc-200">{node.name}</span>
                      <span className="text-zinc-500 uppercase text-[10px] ml-2 font-mono">
                        {node.type}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </aside>
    );
  }

  if (!selectedNode) return null;

  // const { transform, fills, strokes, type, cornerRadius } = selectedNode;
  const transform = selectedNode.transform || { x: 0, y: 0, width: 100, height: 100, rotation: 0 };
  const fills = Array.isArray(selectedNode.fills) ? selectedNode.fills : [];
  const strokes = Array.isArray(selectedNode.strokes) ? selectedNode.strokes : [];
  const effects = Array.isArray(selectedNode.effects) ? selectedNode.effects : [];
  const type = selectedNode.type;
  const cornerRadius = selectedNode.cornerRadius;

  /*
  return (
    <aside className="w-72 border-l border-[#27272a] bg-[#18181b] flex flex-col h-full overflow-y-auto text-xs text-zinc-300 select-none z-10">
      {renderTabSwitcher()}

      {activeTab === 'prototype' ? (
        renderPrototypeTab()
      ) : activeTab === 'inspect' ? (
        renderInspectTab()
      ) : (
        <>
          {renderAlignmentToolbar()}
          <div className="p-3 border-b border-[#27272a] flex items-center justify-between">
            <span className="font-semibold text-zinc-100 uppercase text-[11px] tracking-wider">
              {type}
            </span>
            <input
              type="text"
              value={selectedNode.name}
              onChange={(e) => updateNode(selectedNode.id, { name: e.target.value })}
              className="bg-transparent hover:bg-[#27272a] focus:bg-[#27272a] px-1.5 py-0.5 rounded text-right outline-none text-zinc-300 focus:text-white"
            />
          </div>

          <div className="p-3 border-b border-[#27272a]/60 flex flex-col gap-2">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Layout & Transform
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center bg-[#202024] rounded border border-zinc-800 px-2 py-1">
                <span className="text-zinc-500 mr-2 font-mono text-[11px]">X</span>
                <input
                  type="number"
                  value={Math.round(transform.x)}
                  onChange={(e) =>
                    updateNode(selectedNode.id, {
                      transform: { ...transform, x: parseFloat(e.target.value) || 0 },
                    })
                  }
                  className="bg-transparent w-full outline-none font-mono text-zinc-200"
                />
              </div>
              <div className="flex items-center bg-[#202024] rounded border border-zinc-800 px-2 py-1">
                <span className="text-zinc-500 mr-2 font-mono text-[11px]">Y</span>
                <input
                  type="number"
                  value={Math.round(transform.y)}
                  onChange={(e) =>
                    updateNode(selectedNode.id, {
                      transform: { ...transform, y: parseFloat(e.target.value) || 0 },
                    })
                  }
                  className="bg-transparent w-full outline-none font-mono text-zinc-200"
                />
              </div>
              <div className="flex items-center bg-[#202024] rounded border border-zinc-800 px-2 py-1">
                <span className="text-zinc-500 mr-2 font-mono text-[11px]">W</span>
                <input
                  type="number"
                  value={Math.round(transform.width)}
                  onChange={(e) =>
                    updateNode(selectedNode.id, {
                      transform: { ...transform, width: Math.max(1, parseFloat(e.target.value) || 1) },
                    })
                  }
                  className="bg-transparent w-full outline-none font-mono text-zinc-200"
                />
              </div>
              <div className="flex items-center bg-[#202024] rounded border border-zinc-800 px-2 py-1">
                <span className="text-zinc-500 mr-2 font-mono text-[11px]">H</span>
                <input
                  type="number"
                  value={Math.round(transform.height)}
                  onChange={(e) =>
                    updateNode(selectedNode.id, {
                      transform: { ...transform, height: Math.max(1, parseFloat(e.target.value) || 1) },
                    })
                  }
                  className="bg-transparent w-full outline-none font-mono text-zinc-200"
                />
              </div>
            </div>

            {(type === 'rect' || type === 'frame') && (
              <div className="flex items-center bg-[#202024] rounded border border-zinc-800 px-2 py-1 mt-1">
                <span className="text-zinc-500 mr-2 text-[11px]">Radius</span>
                <input
                  type="number"
                  value={typeof cornerRadius === 'number' ? cornerRadius : 0}
                  onChange={(e) =>
                    updateNode(selectedNode.id, {
                      cornerRadius: Math.max(0, parseFloat(e.target.value) || 0),
                    })
                  }
                  className="bg-transparent w-full outline-none font-mono text-zinc-200"
                />
              </div>
            )}
          </div>
          ...
        </>
      )}
    </aside>
  );
  */
  // Original RightSidebar return block:
  /*
  return (
    <aside className="w-72 border-l border-zinc-200 bg-white flex flex-col h-full overflow-y-auto text-xs text-zinc-800 select-none z-10 shadow-[-2px_0_8px_rgba(0,0,0,0.02)]">
      ... original JSX ...
    </aside>
  );
  */

  const activeStroke = strokes && strokes.length > 0 ? strokes[0] : null;

  return (
    <aside className="w-72 border-l border-zinc-200 bg-white flex flex-col h-full text-xs text-zinc-800 select-none z-10 shadow-[-2px_0_8px_rgba(0,0,0,0.02)] relative">
      {/* 1. Top Bar: Avatar | Play | Share */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100 bg-white">
        {/* User Profile Avatar with dropdown */}
        <div className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-6 h-6 rounded-full bg-[#38383d] text-white flex items-center justify-center font-semibold text-xs shadow-xs">
            T
          </div>
          <ChevronDown className="w-3 h-3 text-zinc-400" />
        </div>

        {/* Right actions: Present Play button + Blue Share Button */}
        <div className="flex items-center gap-2">
          {/* Play / Prototype button */}
          <button
            onClick={() => {
              const allFrames = Object.values(document.nodes).filter((n) => n.type === 'frame');
              if (selectedNode && selectedNode.type === 'frame') {
                setActivePrototypeFrameId(selectedNode.id);
              } else if (allFrames.length > 0) {
                setActivePrototypeFrameId(allFrames[0].id);
              }
              setPrototypeMode(true);
            }}
            className="flex items-center gap-0.5 p-1 hover:bg-zinc-100 rounded text-zinc-700 transition-colors"
            title="Present Prototype"
          >
            <Play className="w-3.5 h-3.5 fill-current text-zinc-800" />
            <ChevronDown className="w-2.5 h-2.5 text-zinc-400" />
          </button>

          {/* Share Button */}
          <button
            onClick={() => {
              if (typeof navigator !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
            className="px-3 py-1 bg-[#0d99ff] hover:bg-[#0b87e3] text-white rounded-md font-medium text-xs shadow-xs transition-colors"
          >
            Share
          </button>
        </div>
      </div>

      {/* 2. Sub-Tabs: Design | Prototype & Zoom dropdown */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100 bg-white sticky top-0 z-20">
        <div className="flex items-center gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('design')}
            className={`transition-colors relative pb-0.5 ${
              activeTab === 'design'
                ? 'text-zinc-900 font-semibold'
                : 'text-zinc-400 hover:text-zinc-700'
            }`}
          >
            Design
          </button>
          <button
            onClick={() => setActiveTab('prototype')}
            className={`transition-colors relative pb-0.5 ${
              activeTab === 'prototype'
                ? 'text-zinc-900 font-semibold'
                : 'text-zinc-400 hover:text-zinc-700'
            }`}
          >
            Prototype
          </button>
        </div>

        {/* Zoom Selector */}
        <div className="relative">
          <button
            onClick={() => setShowZoomMenu(!showZoomMenu)}
            className="flex items-center gap-0.5 text-xs text-zinc-600 font-medium cursor-pointer hover:text-zinc-900 px-1 py-0.5 rounded hover:bg-zinc-100 transition-colors"
          >
            <span>{Math.round(zoom * 100)}%</span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {showZoomMenu && (
            <div className="absolute right-0 top-7 w-32 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 z-30 flex flex-col text-xs text-zinc-700">
              <button
                onClick={() => {
                  setZoom(0.5);
                  setShowZoomMenu(false);
                }}
                className="px-3 py-1.5 hover:bg-zinc-100 text-left"
              >
                50%
              </button>
              <button
                onClick={() => {
                  setZoom(1);
                  setShowZoomMenu(false);
                }}
                className="px-3 py-1.5 hover:bg-zinc-100 text-left font-medium"
              >
                100%
              </button>
              <button
                onClick={() => {
                  setZoom(2);
                  setShowZoomMenu(false);
                }}
                className="px-3 py-1.5 hover:bg-zinc-100 text-left"
              >
                200%
              </button>
              <div className="h-px bg-zinc-100 my-1" />
              <button
                onClick={() => {
                  setZoom(1);
                  setShowZoomMenu(false);
                }}
                className="px-3 py-1.5 hover:bg-zinc-100 text-left text-zinc-500"
              >
                Zoom to fit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'prototype' ? (
          renderPrototypeTab()
        ) : activeTab === 'inspect' ? (
          renderInspectTab()
        ) : (
          <>
            {/* 3. Node Title Row */}
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-100">
              <span className="font-semibold text-zinc-900 text-xs tracking-tight truncate max-w-[130px]">
                {type === 'textOnPath' ? 'Text on path' : selectedNode.name}
              </span>
              <div className="flex items-center gap-1.5 text-zinc-500">
                <button className="p-1 hover:bg-zinc-100 rounded text-zinc-600 hover:text-zinc-900" title="Copy Link">
                  <Link2 className="w-3.5 h-3.5" />
                </button>
                <button className="p-1 hover:bg-zinc-100 rounded text-zinc-600 hover:text-zinc-900" title="Create Component">
                  <ComponentIcon className="w-3.5 h-3.5" />
                </button>
                <button className="p-1 hover:bg-zinc-100 rounded text-zinc-600 hover:text-zinc-900" title="Use as Mask">
                  <MaskIcon className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center hover:bg-zinc-100 rounded px-0.5 cursor-pointer text-zinc-600 hover:text-zinc-900" title="Boolean Groups">
                  <BooleanIcon className="w-3.5 h-3.5" />
                  <ChevronDown className="w-2.5 h-2.5 text-zinc-400 -ml-0.5" />
                </div>
                <button className="p-1 hover:bg-zinc-100 rounded text-zinc-600 hover:text-zinc-900" title="Edit Vector">
                  <VectorEditIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 4. Position Section */}
            <div className="p-3 border-b border-zinc-100 flex flex-col gap-2.5">
              <span className="text-xs font-semibold text-zinc-900">Position</span>

              {/* Alignment Row */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-zinc-400 font-normal">Alignment</span>
                <div className="flex items-center justify-between bg-zinc-100/90 p-0.5 rounded-lg border border-zinc-200/50">
                  <div className="flex items-center flex-1 justify-around">
                    <button
                      onClick={() => handleAlign('left')}
                      title="Align Left"
                      className="h-7 w-7 flex items-center justify-center rounded hover:bg-white text-zinc-600 hover:text-zinc-900 transition-colors"
                    >
                      <AlignLeftIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleAlign('center')}
                      title="Align Horizontal Center"
                      className="h-7 w-7 flex items-center justify-center rounded hover:bg-white text-zinc-600 hover:text-zinc-900 transition-colors"
                    >
                      <AlignHCenterIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleAlign('right')}
                      title="Align Right"
                      className="h-7 w-7 flex items-center justify-center rounded hover:bg-white text-zinc-600 hover:text-zinc-900 transition-colors"
                    >
                      <AlignRightIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="h-4 w-px bg-zinc-200/80 mx-0.5" />
                  <div className="flex items-center flex-1 justify-around">
                    <button
                      onClick={() => handleAlign('top')}
                      title="Align Top"
                      className="h-7 w-7 flex items-center justify-center rounded hover:bg-white text-zinc-600 hover:text-zinc-900 transition-colors"
                    >
                      <AlignTopIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleAlign('middle')}
                      title="Align Vertical Middle"
                      className="h-7 w-7 flex items-center justify-center rounded hover:bg-white text-zinc-600 hover:text-zinc-900 transition-colors"
                    >
                      <AlignVCenterIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleAlign('bottom')}
                      title="Align Bottom"
                      className="h-7 w-7 flex items-center justify-center rounded hover:bg-white text-zinc-600 hover:text-zinc-900 transition-colors"
                    >
                      <AlignBottomIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Position Row: X and Y */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-zinc-400 font-normal">Position</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center bg-zinc-100/90 rounded-md border border-zinc-200/50 px-2 py-1 hover:bg-zinc-100 focus-within:bg-white focus-within:border-blue-500 transition-colors">
                    <span className="text-zinc-400 mr-2 text-[11px] font-normal">X</span>
                    <input
                      type="number"
                      value={Math.round(transform.x)}
                      onChange={(e) =>
                        updateNode(selectedNode.id, {
                          transform: { ...transform, x: parseFloat(e.target.value) || 0 },
                        })
                      }
                      className="bg-transparent w-full outline-none text-xs text-zinc-800 font-normal"
                    />
                  </div>
                  <div className="flex items-center bg-zinc-100/90 rounded-md border border-zinc-200/50 px-2 py-1 hover:bg-zinc-100 focus-within:bg-white focus-within:border-blue-500 transition-colors">
                    <span className="text-zinc-400 mr-2 text-[11px] font-normal">Y</span>
                    <input
                      type="number"
                      value={Math.round(transform.y)}
                      onChange={(e) =>
                        updateNode(selectedNode.id, {
                          transform: { ...transform, y: parseFloat(e.target.value) || 0 },
                        })
                      }
                      className="bg-transparent w-full outline-none text-xs text-zinc-800 font-normal"
                    />
                  </div>
                </div>
              </div>

              {/* Rotation Row */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-zinc-400 font-normal">Rotation</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-zinc-100/90 rounded-md border border-zinc-200/50 px-2 py-1 flex-1 hover:bg-zinc-100 focus-within:bg-white focus-within:border-blue-500 transition-colors">
                    <span className="text-zinc-400 mr-1.5 flex items-center">
                      <AngleIcon className="w-3.5 h-3.5 text-zinc-400" />
                    </span>
                    <input
                      type="number"
                      value={Math.round(transform.rotation || 0)}
                      onChange={(e) =>
                        updateNode(selectedNode.id, {
                          transform: { ...transform, rotation: parseFloat(e.target.value) || 0 },
                        })
                      }
                      className="bg-transparent w-full outline-none text-xs text-zinc-800"
                    />
                    <span className="text-zinc-400 text-xs">°</span>
                  </div>
                  <div className="flex items-center bg-zinc-100/90 rounded-md border border-zinc-200/50 p-0.5">
                    <button
                      onClick={() =>
                        updateNode(selectedNode.id, {
                          transform: { ...transform, rotation: ((transform.rotation || 0) + 90) % 360 },
                        })
                      }
                      title="Rotate 90°"
                      className="p-1 hover:bg-white rounded text-zinc-600 hover:text-zinc-900 transition-colors"
                    >
                      <ShearDiamondIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        updateNode(selectedNode.id, {
                          transform: { ...transform, rotation: (360 - (transform.rotation || 0)) % 360 },
                        })
                      }
                      title="Flip Horizontal"
                      className="p-1 hover:bg-white rounded text-zinc-600 hover:text-zinc-900 transition-colors"
                    >
                      <FlipHorizontal className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        updateNode(selectedNode.id, {
                          transform: { ...transform, rotation: ((transform.rotation || 0) + 180) % 360 },
                        })
                      }
                      title="Flip Vertical"
                      className="p-1 hover:bg-white rounded text-zinc-600 hover:text-zinc-900 transition-colors"
                    >
                      <FlipVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Layout Section */}
            <div className="p-3 border-b border-zinc-100 flex flex-col gap-2">
              <span className="text-xs font-semibold text-zinc-900">Layout</span>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-zinc-400 font-normal">Dimensions</span>
                <div className="flex items-center gap-2">
                  <div className="grid grid-cols-2 gap-2 flex-1">
                    <div className="flex items-center bg-zinc-100/90 rounded-md border border-zinc-200/50 px-2 py-1 hover:bg-zinc-100 focus-within:bg-white focus-within:border-blue-500 transition-colors">
                      <span className="text-zinc-400 mr-2 text-[11px]">W</span>
                      <input
                        type="number"
                        value={Math.round(transform.width)}
                        onChange={(e) =>
                          updateNode(selectedNode.id, {
                            transform: { ...transform, width: Math.max(1, parseFloat(e.target.value) || 1) },
                          })
                        }
                        className="bg-transparent w-full outline-none text-xs text-zinc-800 font-normal"
                      />
                    </div>
                    <div className="flex items-center bg-zinc-100/90 rounded-md border border-zinc-200/50 px-2 py-1 hover:bg-zinc-100 focus-within:bg-white focus-within:border-blue-500 transition-colors">
                      <span className="text-zinc-400 mr-2 text-[11px]">H</span>
                      <input
                        type="number"
                        value={Math.round(transform.height)}
                        onChange={(e) =>
                          updateNode(selectedNode.id, {
                            transform: { ...transform, height: Math.max(1, parseFloat(e.target.value) || 1) },
                          })
                        }
                        className="bg-transparent w-full outline-none text-xs text-zinc-800 font-normal"
                      />
                    </div>
                  </div>
                  <button
                    className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 border border-zinc-200/50 transition-colors"
                    title="Constrain proportions"
                  >
                    <ConstrainProportionsIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* 6. Appearance Section */}
            <div className="p-3 border-b border-zinc-100 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900">Appearance</span>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <button
                    onClick={() => updateNode(selectedNode.id, { visible: selectedNode.visible === false ? true : false })}
                    className="hover:text-zinc-700 p-0.5"
                    title="Toggle Visibility"
                  >
                    {selectedNode.visible === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button className="hover:text-zinc-700 p-0.5" title="Blend mode">
                    <Droplet className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-zinc-400 font-normal">Opacity</span>
                  <div className="flex items-center bg-zinc-100/90 rounded-md border border-zinc-200/50 px-2 py-1 hover:bg-zinc-100 focus-within:bg-white focus-within:border-blue-500 transition-colors">
                    <CheckerboardOpacityIcon className="w-3.5 h-3.5 text-zinc-400 mr-1.5 shrink-0" />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={Math.round((selectedNode.opacity !== undefined ? selectedNode.opacity : 1) * 100)}
                      onChange={(e) => {
                        const val = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                        updateNode(selectedNode.id, { opacity: val / 100 });
                      }}
                      className="bg-transparent w-full outline-none text-xs text-zinc-800"
                    />
                    <span className="text-zinc-400 text-xs ml-0.5">%</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-zinc-400 font-normal">Corner radius</span>
                  <div className="flex items-center bg-zinc-100/90 rounded-md border border-zinc-200/50 px-2 py-1 hover:bg-zinc-100 focus-within:bg-white focus-within:border-blue-500 transition-colors">
                    <CornerRadiusIcon className="w-3.5 h-3.5 text-zinc-400 mr-1.5 shrink-0" />
                    <input
                      type="number"
                      value={typeof cornerRadius === 'number' ? cornerRadius : 0}
                      onChange={(e) =>
                        updateNode(selectedNode.id, {
                          cornerRadius: Math.max(0, parseFloat(e.target.value) || 0),
                        })
                      }
                      className="bg-transparent w-full outline-none text-xs text-zinc-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 7. Typography Section */}
            <div className="p-3 border-b border-zinc-100 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900">Typography</span>
                <button className="hover:text-zinc-700 text-zinc-400" title="Text Styles">
                  <StylesFourDotsIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Font Family */}
              <div className="relative">
                <select
                  value={(selectedNode as any).fontFamily || 'Inter'}
                  onChange={(e) => updateNode(selectedNode.id, { fontFamily: e.target.value } as any)}
                  className="w-full bg-zinc-100/90 hover:bg-zinc-100 border border-zinc-200/50 rounded-md px-2.5 py-1.5 text-xs text-zinc-800 outline-none appearance-none cursor-pointer pr-6"
                >
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Weight & Size */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <select
                    value={(selectedNode as any).fontWeight || 400}
                    onChange={(e) => updateNode(selectedNode.id, { fontWeight: e.target.value } as any)}
                    className="w-full bg-zinc-100/90 hover:bg-zinc-100 border border-zinc-200/50 rounded-md px-2.5 py-1.5 text-xs text-zinc-800 outline-none appearance-none cursor-pointer pr-6"
                  >
                    <option value="400">Regular</option>
                    <option value="500">Medium</option>
                    <option value="600">Semi Bold</option>
                    <option value="700">Bold</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={(selectedNode as any).fontSize || 24}
                    onChange={(e) => {
                      const newSize = parseFloat(e.target.value) || 24;
                      updateNode(selectedNode.id, { fontSize: newSize } as any);
                    }}
                    className="w-full bg-zinc-100/90 hover:bg-zinc-100 border border-zinc-200/50 rounded-md px-2.5 py-1.5 text-xs text-zinc-800 outline-none appearance-none cursor-pointer pr-6"
                  >
                    {[12, 14, 16, 18, 20, 24, 32, 36, 48, 64, 72].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Line Height & Letter Spacing */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-zinc-400 font-normal">Line height</span>
                  <div className="flex items-center bg-zinc-100/90 rounded-md border border-zinc-200/50 px-2 py-1 hover:bg-zinc-100 focus-within:bg-white focus-within:border-blue-500 transition-colors">
                    <LineHeightIcon className="w-3.5 h-3.5 text-zinc-400 mr-1.5 shrink-0" />
                    <input
                      type="text"
                      defaultValue="Auto"
                      className="bg-transparent w-full outline-none text-xs text-zinc-800"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-zinc-400 font-normal">Letter spacing</span>
                  <div className="flex items-center bg-zinc-100/90 rounded-md border border-zinc-200/50 px-2 py-1 hover:bg-zinc-100 focus-within:bg-white focus-within:border-blue-500 transition-colors">
                    <span className="text-zinc-400 mr-1.5 text-[11px] font-mono">|A|</span>
                    <input
                      type="text"
                      defaultValue="0%"
                      className="bg-transparent w-full outline-none text-xs text-zinc-800"
                    />
                  </div>
                </div>
              </div>

              {/* Alignment Row */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-zinc-400 font-normal">Alignment</span>
                <div className="flex items-center justify-between bg-zinc-100/90 p-0.5 rounded-lg border border-zinc-200/50">
                  <div className="flex items-center flex-1 justify-around">
                    <button
                      onClick={() => updateNode(selectedNode.id, { textAlign: 'left' } as any)}
                      className={`h-7 w-7 flex items-center justify-center rounded transition-colors ${
                        ((selectedNode as any).textAlign || 'left') === 'left' ? 'bg-white shadow-xs text-zinc-900 font-medium' : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                      title="Align Left"
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => updateNode(selectedNode.id, { textAlign: 'center' } as any)}
                      className={`h-7 w-7 flex items-center justify-center rounded transition-colors ${
                        (selectedNode as any).textAlign === 'center' ? 'bg-white shadow-xs text-zinc-900 font-medium' : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                      title="Align Center"
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => updateNode(selectedNode.id, { textAlign: 'right' } as any)}
                      className={`h-7 w-7 flex items-center justify-center rounded transition-colors ${
                        (selectedNode as any).textAlign === 'right' ? 'bg-white shadow-xs text-zinc-900 font-medium' : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                      title="Align Right"
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => updateNode(selectedNode.id, { textAlign: 'justify' } as any)}
                      className={`h-7 w-7 flex items-center justify-center rounded transition-colors ${
                        (selectedNode as any).textAlign === 'justify' ? 'bg-white shadow-xs text-zinc-900 font-medium' : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                      title="Align Justify"
                    >
                      <AlignJustify className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="h-4 w-px bg-zinc-200/80 mx-0.5" />
                  <button className="h-7 w-7 flex items-center justify-center rounded hover:bg-white text-zinc-600 transition-colors" title="Line Spacing">
                    <TextVerticalSpacingIcon className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between bg-zinc-100/90 p-0.5 rounded-lg border border-zinc-200/50 mt-1">
                  <div className="flex items-center flex-1 justify-around">
                    <button className="h-7 w-7 flex items-center justify-center rounded hover:bg-white text-zinc-600 transition-colors" title="Align Top">
                      <TextAlignTopIcon className="w-3.5 h-3.5" />
                    </button>
                    <button className="h-7 w-7 flex items-center justify-center rounded bg-white shadow-xs text-zinc-900 transition-colors" title="Align Middle">
                      <TextAlignMiddleIcon className="w-3.5 h-3.5" />
                    </button>
                    <button className="h-7 w-7 flex items-center justify-center rounded hover:bg-white text-zinc-600 transition-colors" title="Align Bottom">
                      <TextAlignBottomIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="h-4 w-px bg-zinc-200/80 mx-0.5" />
                  <button className="h-7 w-7 flex items-center justify-center rounded hover:bg-white text-zinc-600 transition-colors" title="Text Details">
                    <MoreTextDetailsIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Text on Path parameters */}
              {type === 'textOnPath' && (
                <div className="flex flex-col gap-1.5 pt-2 border-t border-zinc-100">
                  <span className="text-[11px] font-semibold text-zinc-700">Path Parameters</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center bg-zinc-100/90 rounded-md border border-zinc-200/50 px-2 py-1">
                      <span className="text-zinc-400 mr-2 text-[11px]">Radius</span>
                      <input
                        type="number"
                        value={(selectedNode as any).radius || 80}
                        onChange={(e) => {
                          const newRadius = Math.max(20, parseFloat(e.target.value) || 80);
                          updateNode(selectedNode.id, {
                            radius: newRadius,
                            innerRadius: Math.max(10, newRadius - ((selectedNode as any).fontSize || 18) - 10),
                          } as any);
                        }}
                        className="bg-transparent w-full outline-none text-xs text-zinc-800 font-normal"
                      />
                    </div>
                    <div className="flex items-center bg-zinc-100/90 rounded-md border border-zinc-200/50 px-2 py-1">
                      <span className="text-zinc-400 mr-2 text-[11px]">Arc °</span>
                      <input
                        type="number"
                        min={30}
                        max={360}
                        value={(selectedNode as any).arcAngle || 270}
                        onChange={(e) => {
                          const newArc = Math.min(360, Math.max(30, parseFloat(e.target.value) || 270));
                          updateNode(selectedNode.id, { arcAngle: newArc } as any);
                        }}
                        className="bg-transparent w-full outline-none text-xs text-zinc-800 font-normal"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Content Editing */}
              <div className="flex flex-col gap-1 mt-1">
                <span className="text-[11px] text-zinc-400 font-normal">Content</span>
                <textarea
                  value={(selectedNode as any).content || ''}
                  onChange={(e) => updateNode(selectedNode.id, { content: e.target.value } as any)}
                  className="bg-zinc-100/90 border border-zinc-200/50 rounded-md p-2 outline-none text-xs text-zinc-800 resize-none h-14 focus:bg-white focus:border-blue-500 transition-colors"
                  placeholder="Type text content..."
                />
              </div>
            </div>

            {/* 8. Fill Section */}
            <div className="p-3 border-b border-zinc-100 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900">Fill</span>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <button className="hover:text-zinc-700" title="Fill styles">
                    <StylesFourDotsIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      updateNode(selectedNode.id, {
                        fills: [
                          ...fills,
                          { id: `f_${Date.now()}`, type: 'solid', color: '#FF0404', opacity: 1, visible: true },
                        ],
                      })
                    }
                    className="hover:text-zinc-700"
                    title="Add Fill"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {fills.map((fill, index) => {
                const hexColor = (fill.color || '#FF0404').replace('#', '').toUpperCase();
                return (
                  <div
                    className="flex items-center gap-2 bg-zinc-100/90 p-1.5 rounded-md border border-zinc-200/50"
                    key={fill.id || index}
                  >
                    <button
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setActiveColorPicker({
                          targetType: 'fill',
                          index,
                          color: fill.color || '#FF0404',
                          opacity: fill.opacity !== undefined ? fill.opacity : 1,
                          top: Math.max(16, Math.min(window.innerHeight - 440, rect.top - 80)),
                          right: window.innerWidth - rect.left + 8,
                        });
                      }}
                      className="w-4 h-4 rounded-[3px] border border-zinc-300 shadow-xs cursor-pointer hover:scale-105 transition-transform shrink-0"
                      style={{ backgroundColor: fill.color || '#FF0404' }}
                      title="Click to open color picker"
                    />
                    <input
                      type="text"
                      value={hexColor}
                      onChange={(e) => {
                        const n = [...fills];
                        n[index] = { ...fill, color: `#${e.target.value}` };
                        updateNode(selectedNode.id, { fills: n });
                      }}
                      className="bg-transparent font-mono text-xs w-20 outline-none uppercase text-zinc-800 font-medium"
                    />
                    <div className="flex items-center ml-auto text-xs text-zinc-500 font-mono">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={Math.round((fill.opacity !== undefined ? fill.opacity : 1) * 100)}
                        onChange={(e) => {
                          const op = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) / 100;
                          const n = [...fills];
                          n[index] = { ...fill, opacity: op };
                          updateNode(selectedNode.id, { fills: n });
                        }}
                        className="w-8 text-right bg-transparent outline-none font-mono text-xs text-zinc-800"
                      />
                      <span className="text-[10px] ml-0.5 text-zinc-400">%</span>
                    </div>
                    <button
                      onClick={() => {
                        const n = [...fills];
                        n[index] = { ...fill, visible: fill.visible === false ? true : false };
                        updateNode(selectedNode.id, { fills: n });
                      }}
                      className="text-zinc-400 hover:text-zinc-700 p-0.5"
                      title="Toggle visibility"
                    >
                      {fill.visible === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() =>
                        updateNode(selectedNode.id, {
                          fills: fills.filter((_, i) => i !== index),
                        })
                      }
                      className="text-zinc-400 hover:text-zinc-700 p-0.5"
                      title="Remove fill"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* 9. Stroke Section */}
            <div className="p-3 border-b border-zinc-100 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900">Stroke</span>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <button className="hover:text-zinc-700" title="Stroke styles">
                    <StylesFourDotsIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      updateNode(selectedNode.id, {
                        strokes: [
                          ...(strokes || []),
                          { id: `s_${Date.now()}`, color: '#000000', width: 1, align: 'outside', opacity: 1, visible: true },
                        ],
                      })
                    }
                    className="text-zinc-400 hover:text-zinc-700"
                    title="Add Stroke"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {(strokes || []).map((stroke, index) => {
                const hexColor = (stroke.color || '#000000').replace('#', '').toUpperCase();
                const isPickerOpen = activeColorPicker?.targetType === 'stroke' && activeColorPicker.index === index;
                return (
                  <div key={stroke.id || index} className="flex flex-col gap-2">
                    <div
                      className={`flex items-center gap-2 bg-zinc-100/90 p-1.5 rounded-md border transition-colors ${
                        isPickerOpen
                          ? 'border-[#0d99ff] ring-1 ring-[#0d99ff] bg-white'
                          : 'border-zinc-200/50 hover:bg-zinc-100'
                      }`}
                    >
                      <button
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setActiveColorPicker({
                            targetType: 'stroke',
                            index,
                            color: stroke.color || '#000000',
                            opacity: stroke.opacity !== undefined ? stroke.opacity : 1,
                            top: Math.max(16, Math.min(window.innerHeight - 440, rect.top - 80)),
                            right: window.innerWidth - rect.left + 8,
                          });
                        }}
                        className="w-4 h-4 rounded-[3px] border border-zinc-300 shadow-xs cursor-pointer hover:scale-105 transition-transform shrink-0"
                        style={{ backgroundColor: stroke.color || '#000000' }}
                        title="Click to open stroke color picker"
                      />
                      <input
                        type="text"
                        value={hexColor}
                        onChange={(e) => {
                          const n = [...strokes];
                          n[index] = { ...stroke, color: `#${e.target.value}` };
                          updateNode(selectedNode.id, { strokes: n });
                        }}
                        className="bg-transparent font-mono text-xs w-20 outline-none uppercase text-zinc-800 font-medium"
                      />
                      <div className="flex items-center ml-auto text-xs text-zinc-500 font-mono">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={Math.round((stroke.opacity !== undefined ? stroke.opacity : 1) * 100)}
                          onChange={(e) => {
                            const op = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) / 100;
                            const n = [...strokes];
                            n[index] = { ...stroke, opacity: op };
                            updateNode(selectedNode.id, { strokes: n });
                          }}
                          className="w-8 text-right bg-transparent outline-none font-mono text-xs text-zinc-800"
                        />
                        <span className="text-[10px] ml-0.5 text-zinc-400">%</span>
                      </div>
                      <button
                        onClick={() => {
                          const n = [...strokes];
                          n[index] = { ...stroke, visible: stroke.visible === false ? true : false };
                          updateNode(selectedNode.id, { strokes: n });
                        }}
                        className="text-zinc-400 hover:text-zinc-700 p-0.5"
                        title="Toggle visibility"
                      >
                        {stroke.visible === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() =>
                          updateNode(selectedNode.id, {
                            strokes: strokes.filter((_, i) => i !== index),
                          })
                        }
                        className="text-zinc-400 hover:text-zinc-700 p-0.5"
                        title="Remove stroke"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Stroke Position & Weight Controls */}
                    <div className="grid grid-cols-2 gap-2 mt-0.5">
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] text-zinc-400 font-normal">Position</span>
                        <div className="relative">
                          <select
                            value={stroke.align || 'outside'}
                            onChange={(e) => {
                              const n = [...strokes];
                              n[index] = { ...stroke, align: e.target.value as any };
                              updateNode(selectedNode.id, { strokes: n });
                            }}
                            className="w-full bg-zinc-100/90 hover:bg-zinc-100 border border-zinc-200/50 rounded-md px-2.5 py-1 text-xs text-zinc-800 outline-none appearance-none cursor-pointer pr-6"
                          >
                            <option value="outside">Outside</option>
                            <option value="inside">Inside</option>
                            <option value="center">Center</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] text-zinc-400 font-normal">Weight</span>
                        <div className="flex items-center bg-zinc-100/90 rounded-md border border-zinc-200/50 px-2 py-1 hover:bg-zinc-100 focus-within:bg-white focus-within:border-blue-500 transition-colors">
                          <StrokeWeightIcon className="w-3.5 h-3.5 text-zinc-500 mr-2 shrink-0" />
                          <input
                            type="number"
                            min={1}
                            value={stroke.width || 1}
                            onChange={(e) => {
                              const n = [...strokes];
                              n[index] = {
                                ...stroke,
                                width: Math.max(1, parseFloat(e.target.value) || 1),
                              };
                              updateNode(selectedNode.id, { strokes: n });
                            }}
                            className="bg-transparent w-full outline-none text-xs text-zinc-800 font-normal"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 10. Effects Section */}
            <div className="p-3 border-b border-zinc-100 flex flex-col gap-2 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900">Effects</span>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <button className="hover:text-zinc-700" title="Effect styles">
                    <StylesFourDotsIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (showEffectsMenu) {
                        setShowEffectsMenu(false);
                        setEffectsMenuPosition(null);
                      } else {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const openUpwards = rect.bottom + 280 > window.innerHeight;
                        setEffectsMenuPosition({
                          top: openUpwards ? undefined : rect.bottom + 4,
                          bottom: openUpwards ? window.innerHeight - rect.top + 4 : undefined,
                          right: window.innerWidth - rect.right,
                        });
                        setShowEffectsMenu(true);
                        setActiveEffectDropdownIndex(null);
                      }
                    }}
                    className={`p-1 rounded-md transition-colors ${
                      showEffectsMenu
                        ? 'bg-[#e0f2fe] text-[#0d99ff]'
                        : 'hover:text-zinc-700 text-zinc-400'
                    }`}
                    title="Add Effect"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Effects List */}
              {effects.map((effect, index) => {
                const effectItem =
                  EFFECT_MENU_ITEMS.find((item) => item.type === effect.type) ||
                  (effect.type === 'shader' ? SHADER_MENU_ITEM : EFFECT_MENU_ITEMS[1]);
                const EffectIcon = effectItem.icon;
                const isSettingsOpen = showEffectSettingsId === effect.id;

                return (
                  <div key={effect.id || index} className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 bg-zinc-100/90 p-1.5 rounded-md border border-zinc-200/50 hover:bg-zinc-100 transition-colors">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          const openUpwards = rect.bottom + 280 > window.innerHeight;
                          setEffectsMenuPosition({
                            top: openUpwards ? undefined : rect.bottom + 4,
                            bottom: openUpwards ? window.innerHeight - rect.top + 4 : undefined,
                            right: window.innerWidth - rect.right,
                          });
                          setHoveredEffectType(effect.type);
                          setActiveEffectDropdownIndex(activeEffectDropdownIndex === index ? null : index);
                          setShowEffectsMenu(false);
                        }}
                        className="flex items-center gap-1.5 text-xs text-zinc-800 font-medium hover:text-zinc-950 transition-colors flex-1 text-left"
                      >
                        <EffectIcon className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                        <span className="truncate">{effectItem.name}</span>
                        <ChevronDown className="w-3 h-3 text-zinc-400 ml-0.5" />
                      </button>

                      <button
                        onClick={() => setShowEffectSettingsId(isSettingsOpen ? null : effect.id)}
                        className={`p-1 rounded transition-colors ${
                          isSettingsOpen ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-400 hover:text-zinc-700'
                        }`}
                        title="Effect settings"
                      >
                        <Sliders className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => {
                          const n = [...effects];
                          n[index] = { ...effect, visible: effect.visible === false ? true : false };
                          updateNode(selectedNode.id, { effects: n });
                        }}
                        className="text-zinc-400 hover:text-zinc-700 p-0.5"
                        title="Toggle visibility"
                      >
                        {effect.visible === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() =>
                          updateNode(selectedNode.id, {
                            effects: effects.filter((_, i) => i !== index),
                          })
                        }
                        className="text-zinc-400 hover:text-zinc-700 p-0.5"
                        title="Remove effect"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Inline Settings Panel if expanded */}
                    {isSettingsOpen && (
                      <div className="p-2 bg-zinc-50 border border-zinc-200/80 rounded-md flex flex-col gap-2 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center bg-white rounded border border-zinc-200 px-2 py-1">
                            <span className="text-zinc-400 mr-2 text-[11px] font-mono">X</span>
                            <input
                              type="number"
                              value={effect.offset?.x ?? 0}
                              onChange={(e) => {
                                const n = [...effects];
                                n[index] = {
                                  ...effect,
                                  offset: { x: parseFloat(e.target.value) || 0, y: effect.offset?.y ?? 4 },
                                };
                                updateNode(selectedNode.id, { effects: n });
                              }}
                              className="bg-transparent w-full outline-none font-mono text-zinc-800 text-xs"
                            />
                          </div>
                          <div className="flex items-center bg-white rounded border border-zinc-200 px-2 py-1">
                            <span className="text-zinc-400 mr-2 text-[11px] font-mono">Y</span>
                            <input
                              type="number"
                              value={effect.offset?.y ?? 4}
                              onChange={(e) => {
                                const n = [...effects];
                                n[index] = {
                                  ...effect,
                                  offset: { x: effect.offset?.x ?? 0, y: parseFloat(e.target.value) || 0 },
                                };
                                updateNode(selectedNode.id, { effects: n });
                              }}
                              className="bg-transparent w-full outline-none font-mono text-zinc-800 text-xs"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center bg-white rounded border border-zinc-200 px-2 py-1">
                            <span className="text-zinc-400 mr-2 text-[11px]">Blur</span>
                            <input
                              type="number"
                              min={0}
                              value={effect.radius ?? 4}
                              onChange={(e) => {
                                const n = [...effects];
                                n[index] = {
                                  ...effect,
                                  radius: Math.max(0, parseFloat(e.target.value) || 0),
                                };
                                updateNode(selectedNode.id, { effects: n });
                              }}
                              className="bg-transparent w-full outline-none font-mono text-zinc-800 text-xs"
                            />
                          </div>
                          <div className="flex items-center bg-white rounded border border-zinc-200 px-2 py-1">
                            <span className="text-zinc-400 mr-2 text-[11px]">Spread</span>
                            <input
                              type="number"
                              value={effect.spread ?? 0}
                              onChange={(e) => {
                                const n = [...effects];
                                n[index] = {
                                  ...effect,
                                  spread: parseFloat(e.target.value) || 0,
                                };
                                updateNode(selectedNode.id, { effects: n });
                              }}
                              className="bg-transparent w-full outline-none font-mono text-zinc-800 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Effects Floating Dropdown Menu (matching user screenshot) */}
              {(showEffectsMenu || activeEffectDropdownIndex !== null) && effectsMenuPosition && (
                <div
                  className="fixed w-48 bg-[#1e1e1e] border border-zinc-700/80 rounded-xl shadow-2xl p-1.5 text-white z-50 select-none animate-in fade-in zoom-in-95 duration-100"
                  style={{
                    top: effectsMenuPosition.top !== undefined ? `${effectsMenuPosition.top}px` : undefined,
                    bottom: effectsMenuPosition.bottom !== undefined ? `${effectsMenuPosition.bottom}px` : undefined,
                    right: `${effectsMenuPosition.right}px`,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-col gap-0.5">
                    {EFFECT_MENU_ITEMS.map((item) => {
                      const ItemIcon = item.icon;
                      const isSelected = hoveredEffectType === item.type;
                      return (
                        <button
                          key={item.type}
                          onClick={() => {
                            if (activeEffectDropdownIndex !== null) {
                              const n = [...effects];
                              n[activeEffectDropdownIndex] = { ...n[activeEffectDropdownIndex], type: item.type as any };
                              updateNode(selectedNode.id, { effects: n });
                              setActiveEffectDropdownIndex(null);
                            } else {
                              updateNode(selectedNode.id, {
                                effects: [
                                  ...effects,
                                  {
                                    id: `eff_${Date.now()}`,
                                    type: item.type as any,
                                    color: '#00000040',
                                    offset: { x: 0, y: 4 },
                                    radius: 4,
                                    spread: 0,
                                    visible: true,
                                  },
                                ],
                              });
                              setShowEffectsMenu(false);
                            }
                            setHoveredEffectType(item.type);
                          }}
                          onMouseEnter={() => setHoveredEffectType(item.type)}
                          className={`flex items-center gap-2.5 px-2.5 py-1.5 text-xs rounded-lg cursor-pointer transition-colors font-medium text-left w-full ${
                            isSelected
                              ? 'bg-[#0d99ff] text-white'
                              : 'text-zinc-200 hover:bg-zinc-800 hover:text-white'
                          }`}
                        >
                          <ItemIcon className="w-4 h-4 shrink-0" />
                          <span>{item.name}</span>
                        </button>
                      );
                    })}

                    {/* Divider */}
                    <div className="border-t border-zinc-700/60 my-1" />

                    {/* Shader Beta */}
                    <button
                      onClick={() => {
                        if (activeEffectDropdownIndex !== null) {
                          const n = [...effects];
                          n[activeEffectDropdownIndex] = { ...n[activeEffectDropdownIndex], type: 'shader' as any };
                          updateNode(selectedNode.id, { effects: n });
                          setActiveEffectDropdownIndex(null);
                        } else {
                          updateNode(selectedNode.id, {
                            effects: [
                              ...effects,
                              {
                                id: `eff_${Date.now()}`,
                                type: 'shader' as any,
                                color: '#00000040',
                                offset: { x: 0, y: 4 },
                                radius: 4,
                                spread: 0,
                                visible: true,
                              },
                            ],
                          });
                          setShowEffectsMenu(false);
                        }
                        setHoveredEffectType('shader');
                      }}
                      onMouseEnter={() => setHoveredEffectType('shader')}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 text-xs rounded-lg cursor-pointer transition-colors font-medium text-left w-full ${
                        hoveredEffectType === 'shader'
                          ? 'bg-[#0d99ff] text-white'
                          : 'text-zinc-200 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      <ShaderIcon className="w-4 h-4 shrink-0" />
                      <span>Shader</span>
                      <span className="text-[10px] bg-[#383838] text-zinc-300 font-medium px-1.5 py-0.5 rounded ml-auto">
                        Beta
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 11. Export Section */}
            <div className="p-3 border-b border-zinc-100 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900">Export</span>
                <button
                  onClick={() => setShowExportRow(true)}
                  className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md"
                  title="Add Export setting"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {showExportRow && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    {/* Scale dropdown */}
                    <div className="relative w-16">
                      <select
                        value={exportScale}
                        onChange={(e) => setExportScale(e.target.value)}
                        className="w-full bg-zinc-100/90 hover:bg-zinc-100 border border-zinc-200/50 rounded-md px-2 py-1 text-xs text-zinc-800 outline-none appearance-none cursor-pointer pr-5 font-mono"
                      >
                        <option value="0.5x">0.5x</option>
                        <option value="1x">1x</option>
                        <option value="2x">2x</option>
                        <option value="3x">3x</option>
                        <option value="4x">4x</option>
                      </select>
                      <ChevronDown className="w-3 h-3 text-zinc-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Suffix input */}
                    <input
                      type="text"
                      placeholder="Suffix"
                      className="w-16 bg-zinc-100/90 border border-zinc-200/50 rounded-md px-2 py-1 text-xs text-zinc-800 outline-none font-mono"
                    />

                    {/* Format dropdown */}
                    <div className="relative flex-1">
                      <select
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value as any)}
                        className="w-full bg-zinc-100/90 hover:bg-zinc-100 border border-zinc-200/50 rounded-md px-2.5 py-1 text-xs text-zinc-800 outline-none appearance-none cursor-pointer pr-6 font-semibold"
                      >
                        <option value="PNG">PNG</option>
                        <option value="JPG">JPG</option>
                        <option value="SVG">SVG</option>
                        <option value="PDF">PDF</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Remove Export Row */}
                    <button
                      onClick={() => setShowExportRow(false)}
                      className="text-zinc-400 hover:text-zinc-700 p-1"
                      title="Remove export option"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Export Button */}
                  <button
                    onClick={() => {
                      if (exportFormat === 'SVG') {
                        exportDocumentToSvg(document);
                      } else if (exportFormat === 'PDF') {
                        exportDocumentToPdf(selectedNode?.name || document.title);
                      } else {
                        exportCanvasToRaster(exportFormat.toLowerCase() as any, selectedNode?.name || document.title);
                      }
                    }}
                    className="w-full mt-1 py-1.5 px-3 bg-white hover:bg-zinc-50 border border-zinc-300 rounded-md text-xs font-semibold text-zinc-800 shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Export {selectedNode?.name || 'Layer'}</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Floating Help Circle Button '?' */}
      <div className="absolute right-3 bottom-3 z-30">
        <button
          className="w-8 h-8 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.12)] border border-zinc-200/80 flex items-center justify-center text-zinc-700 hover:text-zinc-950 hover:scale-105 transition-all text-sm font-medium"
          title="Help and Resources"
        >
          ?
        </button>
      </div>

      {/* Figma Color Picker Popover */}
      {activeColorPicker && (
        <FigmaColorPicker
          color={activeColorPicker.color}
          opacity={activeColorPicker.opacity}
          swatches={documentSwatches}
          positionStyle={{
            top: `${activeColorPicker.top}px`,
            right: `${activeColorPicker.right}px`,
          }}
          onChange={(newHex, newOpacity) => {
            if (activeColorPicker.targetType === 'fill') {
              const n = [...fills];
              if (n[activeColorPicker.index]) {
                n[activeColorPicker.index] = {
                  ...n[activeColorPicker.index],
                  color: newHex,
                  opacity: newOpacity,
                };
                updateNode(selectedNode.id, { fills: n });
              }
            } else {
              const n = [...strokes];
              if (n[activeColorPicker.index]) {
                n[activeColorPicker.index] = {
                  ...n[activeColorPicker.index],
                  color: newHex,
                  opacity: newOpacity,
                };
                updateNode(selectedNode.id, { strokes: n });
              }
            }
            setActiveColorPicker((prev) => (prev ? { ...prev, color: newHex, opacity: newOpacity } : null));
          }}
          onClose={() => setActiveColorPicker(null)}
        />
      )}
    </aside>
  );
};
