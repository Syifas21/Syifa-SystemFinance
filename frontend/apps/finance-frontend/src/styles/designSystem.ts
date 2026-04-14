/**
 * Unified Design System for Finance Application
 * Applied to both Finance (Admin) and CEO (Executive) interfaces
 */

// ============================================
// COLOR PALETTE
// ============================================

export const COLORS = {
  // Primary Brand Colors
  primary: {
    DEFAULT: '#0B2447', // Deep Navy - Primary brand color
    light: '#1e3a5f',
    lighter: '#3b5a7f',
    lightest: '#eef2f9',
  },

  // Secondary Colors
  secondary: {
    DEFAULT: '#3B82F6', // Vibrant Blue - Actions
    light: '#60a5fa',
    lighter: '#93c5fd',
    lightest: '#dbeafe',
  },

  // Success Color
  success: {
    DEFAULT: '#10b981', // Emerald Green
    light: '#6ee7b7',
    lighter: '#d1fae5',
    dark: '#047857',
  },

  // Warning Color
  warning: {
    DEFAULT: '#f59e0b', // Amber
    light: '#fcd34d',
    lighter: '#fef3c7',
    dark: '#d97706',
  },

  // Error Color
  error: {
    DEFAULT: '#ef4444', // Red
    light: '#f87171',
    lighter: '#fee2e2',
    dark: '#dc2626',
  },

  // Info Color
  info: {
    DEFAULT: '#0ea5e9', // Sky Blue
    light: '#38bdf8',
    lighter: '#e0f2fe',
    dark: '#0284c7',
  },

  // Neutral Colors
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Semantic Colors
  text: {
    primary: '#0f172a', // Dark text for primary content
    secondary: '#6b7280', // Muted text
    tertiary: '#9ca3af', // Light muted
    inverse: '#ffffff', // White text on dark backgrounds
  },

  // Background Colors
  bg: {
    primary: '#f8faff', // Light blue background
    secondary: '#ffffff', // White
    tertiary: '#f3f4f6', // Gray background
    overlay: 'rgba(0, 0, 0, 0.5)', // Dark overlay
  },

  // Border Colors
  border: {
    light: 'rgba(15, 23, 42, 0.04)',
    DEFAULT: '#e5e7eb',
    dark: '#d1d5db',
  },

  // Status Colors
  status: {
    active: '#10b981',
    pending: '#f59e0b',
    inactive: '#9ca3af',
    error: '#ef4444',
  },
};

// ============================================
// TYPOGRAPHY SYSTEM
// ============================================

export const TYPOGRAPHY = {
  fontFamily: {
    base: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif",
    mono: "'Fira Code', 'Courier New', monospace",
  },

  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
  },

  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
};

// ============================================
// SPACING SYSTEM
// ============================================

export const SPACING = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  '2xl': '3rem', // 48px
  '3xl': '4rem', // 64px
};

// ============================================
// COMPONENT SIZES
// ============================================

export const SIZES = {
  // Button sizes
  button: {
    xs: {
      padding: '0.375rem 0.75rem',
      fontSize: '0.75rem',
      height: '1.75rem',
    },
    sm: {
      padding: '0.5rem 1rem',
      fontSize: '0.875rem',
      height: '2rem',
    },
    md: {
      padding: '0.625rem 1.25rem',
      fontSize: '1rem',
      height: '2.5rem',
    },
    lg: {
      padding: '0.75rem 1.5rem',
      fontSize: '1.125rem',
      height: '3rem',
    },
    xl: {
      padding: '1rem 2rem',
      fontSize: '1.25rem',
      height: '3.5rem',
    },
  },

  // Input sizes
  input: {
    sm: {
      padding: '0.5rem 0.75rem',
      fontSize: '0.875rem',
      height: '2rem',
    },
    md: {
      padding: '0.625rem 1rem',
      fontSize: '1rem',
      height: '2.5rem',
    },
    lg: {
      padding: '0.75rem 1.25rem',
      fontSize: '1.125rem',
      height: '3rem',
    },
  },
};

// ============================================
// SHADOW SYSTEM (3 levels only)
// ============================================

export const SHADOWS = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
};

// ============================================
// BORDER RADIUS
// ============================================

export const BORDER_RADIUS = {
  none: '0',
  sm: '0.25rem',
  base: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  full: '9999px',
};

// ============================================
// TRANSITIONS
// ============================================

export const TRANSITIONS = {
  fast: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
};

// ============================================
// COMPONENT PRESETS
// ============================================

export const COMPONENT_PRESETS = {
  // Card presets
  card: {
    default: {
      padding: '1.5rem', // 24px
      borderRadius: '0.75rem', // 12px
      backgroundColor: COLORS.bg.secondary,
      border: `1px solid ${COLORS.border.light}`,
      boxShadow: SHADOWS.sm,
    },
    elevated: {
      padding: '1.5rem',
      borderRadius: '0.75rem',
      backgroundColor: COLORS.bg.secondary,
      border: 'none',
      boxShadow: SHADOWS.md,
    },
    bordered: {
      padding: '1.5rem',
      borderRadius: '0.75rem',
      backgroundColor: COLORS.bg.primary,
      border: `2px solid ${COLORS.border.DEFAULT}`,
      boxShadow: SHADOWS.none,
    },
  },

  // Button presets
  button: {
    primary: {
      backgroundColor: COLORS.primary.DEFAULT,
      color: COLORS.text.inverse,
      borderRadius: BORDER_RADIUS.md,
      fontWeight: TYPOGRAPHY.fontWeight.semibold,
      transition: TRANSITIONS.fast,
      border: 'none',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: COLORS.primary.light,
      },
      '&:active': {
        backgroundColor: COLORS.primary.lighter,
      },
      '&:disabled': {
        backgroundColor: COLORS.neutral[300],
        cursor: 'not-allowed',
        opacity: 0.6,
      },
    },

    secondary: {
      backgroundColor: COLORS.secondary.DEFAULT,
      color: COLORS.text.inverse,
      borderRadius: BORDER_RADIUS.md,
      fontWeight: TYPOGRAPHY.fontWeight.semibold,
      transition: TRANSITIONS.fast,
      border: 'none',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: COLORS.secondary.light,
      },
      '&:disabled': {
        backgroundColor: COLORS.neutral[300],
        cursor: 'not-allowed',
        opacity: 0.6,
      },
    },

    success: {
      backgroundColor: COLORS.success.DEFAULT,
      color: COLORS.text.inverse,
      borderRadius: BORDER_RADIUS.md,
      fontWeight: TYPOGRAPHY.fontWeight.semibold,
      transition: TRANSITIONS.fast,
      border: 'none',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: COLORS.success.dark,
      },
    },

    outline: {
      backgroundColor: 'transparent',
      color: COLORS.primary.DEFAULT,
      borderRadius: BORDER_RADIUS.md,
      fontWeight: TYPOGRAPHY.fontWeight.semibold,
      transition: TRANSITIONS.fast,
      border: `2px solid ${COLORS.primary.DEFAULT}`,
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: COLORS.primary.lightest,
      },
    },

    danger: {
      backgroundColor: COLORS.error.DEFAULT,
      color: COLORS.text.inverse,
      borderRadius: BORDER_RADIUS.md,
      fontWeight: TYPOGRAPHY.fontWeight.semibold,
      transition: TRANSITIONS.fast,
      border: 'none',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: COLORS.error.dark,
      },
    },
  },

  // Input presets
  input: {
    default: {
      width: '100%',
      padding: '0.625rem 1rem',
      borderRadius: BORDER_RADIUS.md,
      border: `1px solid ${COLORS.border.DEFAULT}`,
      fontSize: TYPOGRAPHY.fontSize.base,
      fontFamily: TYPOGRAPHY.fontFamily.base,
      transition: TRANSITIONS.fast,
      '&:focus': {
        outline: 'none',
        borderColor: COLORS.secondary.DEFAULT,
        boxShadow: `0 0 0 3px ${COLORS.secondary.lightest}`,
      },
      '&:disabled': {
        backgroundColor: COLORS.neutral[100],
        cursor: 'not-allowed',
        opacity: 0.6,
      },
    },
  },

  // Badge presets
  badge: {
    success: {
      backgroundColor: COLORS.success.lighter,
      color: COLORS.success.dark,
      padding: '0.25rem 0.75rem',
      borderRadius: BORDER_RADIUS.full,
      fontSize: TYPOGRAPHY.fontSize.xs,
      fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
    warning: {
      backgroundColor: COLORS.warning.lighter,
      color: COLORS.warning.dark,
      padding: '0.25rem 0.75rem',
      borderRadius: BORDER_RADIUS.full,
      fontSize: TYPOGRAPHY.fontSize.xs,
      fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
    error: {
      backgroundColor: COLORS.error.lighter,
      color: COLORS.error.dark,
      padding: '0.25rem 0.75rem',
      borderRadius: BORDER_RADIUS.full,
      fontSize: TYPOGRAPHY.fontSize.xs,
      fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
    info: {
      backgroundColor: COLORS.info.lighter,
      color: COLORS.info.dark,
      padding: '0.25rem 0.75rem',
      borderRadius: BORDER_RADIUS.full,
      fontSize: TYPOGRAPHY.fontSize.xs,
      fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
  },
};

// ============================================
// THEME VARIANTS
// ============================================

export const THEME_VARIANTS = {
  finance: {
    // Finance/Admin theme - Professional Blue
    primary: COLORS.primary.DEFAULT, // #0B2447 - Deep Navy
    secondary: COLORS.secondary.DEFAULT, // #3B82F6 - Vibrant Blue
    accent: COLORS.info.DEFAULT, // #0ea5e9 - Sky Blue
    statusBar: COLORS.primary.DEFAULT,
    headerBg: COLORS.primary.DEFAULT,
    headerText: COLORS.text.inverse,
    sidebarBg: COLORS.primary.light,
    sidebarActive: COLORS.secondary.DEFAULT,
  },

  ceo: {
    // CEO/Executive theme - Same as Finance (CONSISTENT)
    primary: COLORS.primary.DEFAULT, // #0B2447 - Deep Navy (NOT brown!)
    secondary: COLORS.secondary.DEFAULT, // #3B82F6 - Vibrant Blue
    accent: COLORS.success.DEFAULT, // #10b981 - Emerald (for executive summaries)
    statusBar: COLORS.primary.DEFAULT,
    headerBg: COLORS.primary.DEFAULT,
    headerText: COLORS.text.inverse,
    sidebarBg: COLORS.primary.light,
    sidebarActive: COLORS.success.DEFAULT,
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const designSystem = {
  colors: COLORS,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  sizes: SIZES,
  shadows: SHADOWS,
  borderRadius: BORDER_RADIUS,
  transitions: TRANSITIONS,
  components: COMPONENT_PRESETS,
  themes: THEME_VARIANTS,

  // Helper to get color value
  getColor: (path: string, defaultValue = '#000000') => {
    const keys = path.split('.');
    let value: any = COLORS;
    for (const key of keys) {
      value = value?.[key];
    }
    return value || defaultValue;
  },

  // Helper to get spacing value
  getSpacing: (size: keyof typeof SPACING) => SPACING[size],

  // Helper to format currency
  formatCurrency: (amount: number, compact = false) => {
    if (compact) {
      if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)}M`;
      if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}Jt`;
      if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
      return amount.toFixed(0);
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },
};

export default designSystem;
