export const Colors = {
  light: {
    // Cream and beige palette
    background: '#FFFDD0', // Light cream
    surface: '#F5F5DC', // Beige
    surfaceSecondary: '#F0E68C', // Light khaki
    primary: '#DDA520', // Goldenrod
    secondary: '#D2B48C', // Tan
    accent: '#CD853F', // Peru
    
    // Text colors
    text: '#2F2F2F', // Dark gray
    textSecondary: '#6B6B6B', // Medium gray
    textMuted: '#9B9B9B', // Light gray
    
    // UI elements
    border: '#E8E2D4', // Light beige border
    shadow: '#00000015', // Very light shadow
    white: '#FFFFFF',
    
    // Status colors
    success: '#8FBC8F', // Dark sea green
    warning: '#F4A460', // Sandy brown
    error: '#CD5C5C', // Indian red
    
    // Interactive colors
    like: '#FF6B6B', // Coral red
    save: '#4ECDC4', // Turquoise
  },
  dark: {
    // Dark mode with warm tones
    background: '#1A1A1A',
    surface: '#252525',
    surfaceSecondary: '#303030',
    primary: '#DDA520',
    secondary: '#D2B48C',
    accent: '#CD853F',
    
    text: '#FFFFFF',
    textSecondary: '#CCCCCC',
    textMuted: '#999999',
    
    border: '#404040',
    shadow: '#00000040',
    white: '#FFFFFF',
    
    success: '#8FBC8F',
    warning: '#F4A460',
    error: '#CD5C5C',
    
    like: '#FF6B6B',
    save: '#4ECDC4',
  },
} as const;