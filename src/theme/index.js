import useSettingsStore from '../store/settingsStore';

function hexToRgb(value) {
  const input = String(value || '').trim();
  if (!input) {
    return { r: 255, g: 255, b: 255 };
  }

  const rgbMatch = input.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    return {
      r: Number(rgbMatch[1] || 255),
      g: Number(rgbMatch[2] || 255),
      b: Number(rgbMatch[3] || 255),
    };
  }

  const normalized = input.replace('#', '');
  const expanded = normalized.length === 3
    ? normalized.split('').map((value) => `${value}${value}`).join('')
    : normalized;
  const numeric = Number.parseInt(expanded, 16);

  if (Number.isNaN(numeric)) {
    return { r: 255, g: 255, b: 255 };
  }

  return {
    r: (numeric >> 16) & 255,
    g: (numeric >> 8) & 255,
    b: numeric & 255,
  };
}

function alpha(hex, opacity) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${opacity})`;
}

function mix(firstHex, secondHex, ratio = 0.5) {
  const first = hexToRgb(firstHex);
  const second = hexToRgb(secondHex);
  const blend = (start, end) => Math.round(start + (end - start) * ratio);

  return `rgb(${blend(first.r, second.r)},${blend(first.g, second.g)},${blend(first.b, second.b)})`;
}

export const themePresets = {
  dark: {
    id: 'dark',
    label: 'Dark',
    bg: '#000000',
    surface: '#0a0a0a',
    surfaceStrong: '#111111',
    text: '#ffffff',
  },
  amoled: {
    id: 'amoled',
    label: 'AMOLED',
    bg: '#000000',
    surface: '#0a0a0a',
    surfaceStrong: '#121212',
    text: '#ffffff',
  },
  midnight: {
    id: 'midnight',
    label: 'Midnight',
    bg: '#08111d',
    surface: '#111f31',
    surfaceStrong: '#15283f',
    text: '#eef4ff',
  },
  forest: {
    id: 'forest',
    label: 'Forest',
    bg: '#08110b',
    surface: '#122017',
    surfaceStrong: '#183021',
    text: '#f4fff6',
  },
  sunset: {
    id: 'sunset',
    label: 'Sunset',
    bg: '#160b09',
    surface: '#241310',
    surfaceStrong: '#331914',
    text: '#fff5ef',
  },
};

export const accentPresets = {
  white: '#ffffff',
  blue: '#5b8cff',
  purple: '#8c6eff',
  green: '#52d38a',
  orange: '#ff9a52',
  red: '#ff5d6c',
  pink: '#ff73b4',
  teal: '#45c7bd',
};

export const textSizePresets = {
  small: 0.94,
  medium: 1,
  large: 1.08,
};

export function getAppTheme(settings = {}) {
  const baseTheme = themePresets[settings.theme] || themePresets.dark;
  const accent = accentPresets[settings.accent] || accentPresets.white;
  const scale = textSizePresets[settings.textSize] || textSizePresets.medium;
  const accentSurface = mix(baseTheme.surface, accent, 0.16);
  const accentSurfaceStrong = mix(baseTheme.surfaceStrong, accent, 0.22);

  return {
    id: baseTheme.id,
    label: baseTheme.label,
    scale,
    accent,
    accentSoft: alpha(accent, 0.16),
    accentBorder: alpha(accent, 0.32),
    accentMuted: alpha(accent, 0.72),
    accentSurface,
    accentSurfaceStrong,
    bg: baseTheme.bg,
    bgElevated: mix(baseTheme.bg, baseTheme.surface, 0.68),
    text: baseTheme.text,
    text80: alpha(baseTheme.text, 0.8),
    text60: alpha(baseTheme.text, 0.6),
    text45: alpha(baseTheme.text, 0.45),
    text40: alpha(baseTheme.text, 0.4),
    text35: alpha(baseTheme.text, 0.35),
    text30: alpha(baseTheme.text, 0.3),
    text20: alpha(baseTheme.text, 0.2),
    text12: alpha(baseTheme.text, 0.12),
    text08: alpha(baseTheme.text, 0.08),
    text06: alpha(baseTheme.text, 0.06),
    text04: alpha(baseTheme.text, 0.04),
    glass: alpha(accentSurface, 0.18),
    glassStrong: alpha(accentSurfaceStrong, 0.3),
    glassBorder: alpha(baseTheme.text, 0.08),
    glassBorderStrong: alpha(accent, 0.2),
    tabBar: mix(baseTheme.bg, accentSurfaceStrong, 0.15),
    playerBg: mix(baseTheme.bg, accentSurfaceStrong, 0.12),
    onAccent: settings.accent === 'white' ? baseTheme.bg : '#ffffff',
    success: '#52d38a',
    successBg: 'rgba(82,211,138,0.15)',
    error: '#ff6b77',
  };
}

export function useAppTheme() {
  const settings = useSettingsStore((state) => state.settings);
  return getAppTheme(settings);
}

export const colors = getAppTheme();

export const radius = {
  xl: 24,
  lg: 20,
  md: 14,
  sm: 10,
  xs: 8,
  full: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const typography = {
  h1: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  h2: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  h3: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
  h4: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  body: { fontSize: 15, fontWeight: '400' },
  bodyMedium: { fontSize: 15, fontWeight: '500', letterSpacing: -0.2 },
  small: { fontSize: 13, fontWeight: '400' },
  caption: { fontSize: 11, fontWeight: '500' },
  tiny: { fontSize: 10, fontWeight: '500' },
};
