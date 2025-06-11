export type ThemeType = 'light' | 'dark' | 'system';
export type ThemeContextType = {
  theme: ThemeType; // This ensures theme is strictly one of the three allowed values
  systemTheme: 'light' | 'dark';
  actualTheme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
  isDark: boolean;
  isLight: boolean;
  isSystem: boolean;
};