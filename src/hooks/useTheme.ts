import React from 'react';
import { ThemeContextType } from '@/types/ThemeContextType';

const ThemeContext = React.createContext<ThemeContextType>({
  theme: 'light',
  systemTheme: 'light',
  actualTheme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
  isDark: false,
  isLight: true,
  isSystem: false
});

const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if(!context){
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export {
  ThemeContext,
  useTheme
}