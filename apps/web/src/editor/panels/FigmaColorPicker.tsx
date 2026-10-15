import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Pipette, X, Plus, Eye, Droplet, ChevronDown } from 'lucide-react';

// interface FigmaColorPickerProps {
//   color: string; // hex string, e.g. '#FF0404' or '#000000'
//   opacity?: number; // 0 to 1
//   onChange: (hex: string, opacity: number) => void;
//   onClose: () => void;
//   positionStyle?: React.CSSProperties;
// }
interface FigmaColorPickerProps {
  color: string; // hex string, e.g. '#FF0404' or '#000000'
  opacity?: number; // 0 to 1
  onChange: (hex: string, opacity: number) => void;
  onClose: () => void;
  positionStyle?: React.CSSProperties;
  swatches?: string[];
}

// Color conversion utilities
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 255, g: 4, b: 4 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return { h, s, v };
}

function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  h = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

// export const FigmaColorPicker: React.FC<FigmaColorPickerProps> = ({
//   color,
//   opacity = 1,
//   onChange,
//   onClose,
//   positionStyle,
// }) => {
export const FigmaColorPicker: React.FC<FigmaColorPickerProps> = ({
  color,
  opacity = 1,
  onChange,
  onClose,
  positionStyle,
  swatches,
}) => {
  const initialRgb = hexToRgb(color);
  const initialHsv = rgbToHsv(initialRgb.r, initialRgb.g, initialRgb.b);

  const [activeTab, setActiveTab] = useState<'custom' | 'libraries'>('custom');
  const [fillType, setFillType] = useState<'solid' | 'linear' | 'radial' | 'image'>('solid');
  const [hue, setHue] = useState<number>(initialHsv.h || 0);
  const [saturation, setSaturation] = useState<number>(initialHsv.s);
  const [value, setValue] = useState<number>(initialHsv.v);
  const [currentOpacity, setCurrentOpacity] = useState<number>(opacity);
  const [hexInput, setHexInput] = useState<string>(color.replace('#', '').toUpperCase());

  const satValRef = useRef<HTMLDivElement>(null);
  const hueSliderRef = useRef<HTMLDivElement>(null);
  const alphaSliderRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Compute hex from hsv
  const currentRgb = hsvToRgb(hue, saturation, value);
  const currentHex = rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b);

  const notifyChange = useCallback((hex: string, op: number) => {
    onChange(hex, op);
  }, [onChange]);

  // Handle mousedown & dragging for 2D Saturation / Value Area
  const handleSatValMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const updateFromEvent = (evt: MouseEvent) => {
      if (!satValRef.current) return;
      const rect = satValRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, evt.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, evt.clientY - rect.top));
      const newSat = x / rect.width;
      const newVal = 1 - y / rect.height;
      setSaturation(newSat);
      setValue(newVal);

      const rgb = hsvToRgb(hue, newSat, newVal);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      setHexInput(hex.replace('#', ''));
      notifyChange(hex, currentOpacity);
    };

    updateFromEvent(e.nativeEvent);

    const onMouseMove = (evt: MouseEvent) => updateFromEvent(evt);
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Handle mousedown & dragging for Hue Slider
  const handleHueMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const updateHueFromEvent = (evt: MouseEvent) => {
      if (!hueSliderRef.current) return;
      const rect = hueSliderRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, evt.clientX - rect.left));
      const newHue = (x / rect.width) * 360;
      setHue(newHue);

      const rgb = hsvToRgb(newHue, saturation, value);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      setHexInput(hex.replace('#', ''));
      notifyChange(hex, currentOpacity);
    };

    updateHueFromEvent(e.nativeEvent);

    const onMouseMove = (evt: MouseEvent) => updateHueFromEvent(evt);
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Handle mousedown & dragging for Alpha Slider
  const handleAlphaMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const updateAlphaFromEvent = (evt: MouseEvent) => {
      if (!alphaSliderRef.current) return;
      const rect = alphaSliderRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, evt.clientX - rect.left));
      const newAlpha = Math.max(0, Math.min(1, x / rect.width));
      setCurrentOpacity(newAlpha);
      notifyChange(currentHex, newAlpha);
    };

    updateAlphaFromEvent(e.nativeEvent);

    const onMouseMove = (evt: MouseEvent) => updateAlphaFromEvent(evt);
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Eyedropper API
  const handleEyeDropper = async () => {
    try {
      if ((window as any).EyeDropper) {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          const hex = result.sRGBHex.toUpperCase();
          const rgb = hexToRgb(hex);
          const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
          setHue(hsv.h);
          setSaturation(hsv.s);
          setValue(hsv.v);
          setHexInput(hex.replace('#', ''));
          notifyChange(hex, currentOpacity);
        }
      }
    } catch {
      // User cancelled
    }
  };

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Document swatch list
  // const documentSwatches = ['#FFFFFF', '#000000', '#FF0404', '#0D99FF', '#10B981', '#F59E0B'];
  const documentSwatches = (swatches && swatches.length > 0)
    ? swatches
    : ['#FF0404', '#FFFFFF', '#000000'];

  return (
    <div
      ref={pickerRef}
      style={positionStyle}
      className="fixed z-50 w-64 bg-white rounded-2xl border border-zinc-200 shadow-[0_16px_48px_rgba(0,0,0,0.18),0_4px_12px_rgba(0,0,0,0.08)] select-none text-zinc-800 flex flex-col overflow-hidden"
    >
      {/* 1. Header Tabs: Custom | Libraries */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-100 bg-white">
        <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-2.5 py-1 rounded-md transition-all ${activeTab === 'custom'
                ? 'bg-white text-zinc-900 shadow-sm font-semibold'
                : 'text-zinc-500 hover:text-zinc-800'
              }`}
          >
            Custom
          </button>
          <button
            onClick={() => setActiveTab('libraries')}
            className={`px-2.5 py-1 rounded-md transition-all ${activeTab === 'libraries'
                ? 'bg-white text-zinc-900 shadow-sm font-semibold'
                : 'text-zinc-500 hover:text-zinc-800'
              }`}
          >
            Libraries
          </button>
        </div>
        <div className="flex items-center gap-2 text-zinc-400">
          <button className="hover:text-zinc-700" title="Add to styles">
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button onClick={onClose} className="hover:text-zinc-700" title="Close">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100 text-zinc-500">
        <button
          onClick={() => setFillType('solid')}
          className={`p-1.5 rounded transition-colors ${fillType === 'solid' ? 'bg-zinc-100 text-zinc-900 shadow-xs' : 'hover:bg-zinc-50 hover:text-zinc-700'
            }`}
          title="Solid"
        >
          {/* Solid fill icon: nested square */}
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
            <rect x="2" y="2" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <rect x="5" y="5" width="6" height="6" rx="1" fill="currentColor" />
          </svg>
        </button>
        <button
          onClick={() => setFillType('linear')}
          className={`p-1.5 rounded transition-colors ${fillType === 'linear' ? 'bg-zinc-100 text-zinc-900 shadow-xs' : 'hover:bg-zinc-50 hover:text-zinc-700'
            }`}
          title="Linear gradient"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
            <rect x="2" y="2" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <line x1="4" y1="12" x2="12" y2="4" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
        <button
          onClick={() => setFillType('radial')}
          className="p-1.5 rounded hover:bg-zinc-50 hover:text-zinc-700 transition-colors"
          title="Radial gradient"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="2" width="12" height="12" rx="2" />
            <circle cx="8" cy="8" r="2.5" fill="currentColor" />
          </svg>
        </button>
        <button className="p-1.5 rounded hover:bg-zinc-50 hover:text-zinc-700 transition-colors" title="Image">
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="2" width="12" height="12" rx="2" />
            <circle cx="5.5" cy="5.5" r="1" fill="currentColor" />
            <path d="M2.5 11L6 7.5L10 11.5" />
          </svg>
        </button>
        <button className="p-1.5 rounded hover:bg-zinc-50 hover:text-zinc-700 transition-colors" title="Video">
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="2" width="12" height="12" rx="2" />
            <polygon points="6,5 11,8 6,11" fill="currentColor" />
          </svg>
        </button>
        <button className="p-1.5 rounded hover:bg-zinc-50 hover:text-zinc-700 transition-colors" title="Angular gradient">
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="2" width="12" height="12" rx="2" />
            <path d="M4 11C7 11 9 5 12 5" strokeLinecap="round" />
          </svg>
        </button>
        <button className="p-1.5 rounded hover:bg-zinc-50 hover:text-zinc-700 transition-colors" title="Blend mode">
          <Droplet className="w-3.5 h-3.5" />
        </button>
        <button className="p-1.5 rounded hover:bg-zinc-50 hover:text-zinc-700 transition-colors" title="Visibility">
          <Eye className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3 flex flex-col gap-3">
        {/* 3. 2D Saturation / Value Gradient Canvas Area */}
        <div
          ref={satValRef}
          onMouseDown={handleSatValMouseDown}
          className="w-full h-44 rounded-lg relative overflow-hidden cursor-crosshair select-none shadow-inner border border-zinc-200/40"
          style={{ backgroundColor: `hsl(${hue}, 100%, 50%)` }}
        >
          {/* Horizontal white gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
          {/* Vertical black gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />

          {/* Draggable Circle Handle */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              left: `${saturation * 100}%`,
              top: `${(1 - value) * 100}%`,
            }}
          >
            <div
              className="w-4 h-4 rounded-full border-2 border-white shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
              style={{ backgroundColor: currentHex }}
            />
          </div>
        </div>

        {/* 4. Controls: Eyedropper + Sliders */}
        <div className="flex items-center gap-3">
          {/* Eyedropper Icon */}
          <button
            onClick={handleEyeDropper}
            className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors shrink-0"
            title="Eyedropper"
          >
            <Pipette className="w-4 h-4" />
          </button>

          {/* Sliders Container */}
          <div className="flex-1 flex flex-col gap-2.5">
            {/* Hue Slider */}
            <div
              ref={hueSliderRef}
              onMouseDown={handleHueMouseDown}
              className="h-3 w-full rounded-full relative cursor-pointer select-none"
              style={{
                background:
                  'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
              }}
            >
              <div
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ left: `${(hue / 360) * 100}%` }}
              >
                <div
                  className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-[0_1px_3px_rgba(0,0,0,0.35)]"
                  style={{ backgroundColor: `hsl(${hue}, 100%, 50%)` }}
                />
              </div>
            </div>

            {/* Alpha / Opacity Slider */}
            <div
              ref={alphaSliderRef}
              onMouseDown={handleAlphaMouseDown}
              className="h-3 w-full rounded-full relative cursor-pointer select-none overflow-hidden"
              style={{
                backgroundImage:
                  'repeating-conic-gradient(#e5e7eb 0% 25%, #ffffff 0% 50%) 50% / 8px 8px',
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to right, transparent, ${currentHex})`,
                }}
              />
              <div
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ left: `${currentOpacity * 100}%` }}
              >
                <div
                  className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-[0_1px_3px_rgba(0,0,0,0.35)]"
                  style={{ backgroundColor: currentHex }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 5. Format & Hex / Opacity Row */}
        <div className="flex items-center gap-2">
          {/* Format Dropdown */}
          <div className="relative">
            <button className="flex items-center gap-1 bg-zinc-100 hover:bg-zinc-200/60 px-2 py-1 rounded-md text-xs font-medium text-zinc-700">
              <span>Hex</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>
          </div>

          {/* Hex Value Input */}
          <div className="flex-1 bg-zinc-100/90 hover:bg-zinc-100 focus-within:bg-white focus-within:border-blue-500 border border-transparent rounded-md px-2 py-1">
            <input
              type="text"
              value={hexInput}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setHexInput(val);
                if (/^[0-9A-F]{6}$/i.test(val)) {
                  const rgb = hexToRgb(`#${val}`);
                  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
                  setHue(hsv.h);
                  setSaturation(hsv.s);
                  setValue(hsv.v);
                  notifyChange(`#${val}`, currentOpacity);
                }
              }}
              className="bg-transparent w-full outline-none font-mono text-xs uppercase text-zinc-800 font-medium"
            />
          </div>

          {/* Opacity Input */}
          <div className="w-16 bg-zinc-100/90 hover:bg-zinc-100 focus-within:bg-white focus-within:border-blue-500 border border-transparent rounded-md px-1.5 py-1 flex items-center justify-between">
            <input
              type="number"
              min={0}
              max={100}
              value={Math.round(currentOpacity * 100)}
              onChange={(e) => {
                const op = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) / 100;
                setCurrentOpacity(op);
                notifyChange(currentHex, op);
              }}
              className="bg-transparent w-full outline-none font-mono text-xs text-zinc-800 font-medium text-right pr-0.5"
            />
            <span className="text-zinc-400 text-xs font-mono">%</span>
          </div>
        </div>

        {/* 6. Document Palette / On this page Section */}
        <div className="pt-2 border-t border-zinc-100 flex flex-col gap-2">
          <div className="flex items-center justify-between cursor-pointer text-zinc-600 hover:text-zinc-900">
            <span className="text-xs font-medium">On this page</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {documentSwatches.map((swatchColor, idx) => (
              <button
                key={idx}
                onClick={() => {
                  const rgb = hexToRgb(swatchColor);
                  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
                  setHue(hsv.h);
                  setSaturation(hsv.s);
                  setValue(hsv.v);
                  setHexInput(swatchColor.replace('#', ''));
                  notifyChange(swatchColor, currentOpacity);
                }}
                className="w-5 h-5 rounded border border-zinc-200/80 hover:scale-110 transition-transform shadow-xs cursor-pointer"
                style={{ backgroundColor: swatchColor }}
                title={swatchColor}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
