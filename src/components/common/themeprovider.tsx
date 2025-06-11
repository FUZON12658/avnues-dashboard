'use client';
import React from 'react';
import { ThemeContextType } from '@/types/ThemeContextType';
import { ThemeContext } from '@/hooks/useTheme';
import { ThemeType } from '@/types/ThemeContextType';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeType;
}

export const ThemeProvider : React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'system',
}) => {
  const [theme, setTheme] = React.useState<ThemeType>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      // Only use saved theme if it's valid
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        return savedTheme as ThemeType;
      }
    }
    return defaultTheme;
  });
  const [systemTheme, setSystemTheme] = React.useState<'light'|'dark'>('light');

  const toggleTheme = () => {
    switch (theme) {
      case 'light':
        setTheme('dark');
        break;
      case 'dark':
        setTheme('light');
        break;
      default:
        setTheme('light');
        break;
    }
  };
  const setSpecificTheme = (newTheme: ThemeType): void => {
    setTheme(newTheme);
  };

  const actualTheme = theme === 'system' ? systemTheme : theme as 'light'|'dark';

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

      const handler = (e: MediaQueryListEvent) =>
        setSystemTheme(e.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', handler);

      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

// Fixed useEffect with proper type handling
React.useEffect(() => {
  if (typeof window !== 'undefined') {
    // Only proceed if theme is defined
    if (theme) {
      localStorage.setItem('theme', theme);
      
      // Update document class for global styling
      const root = window.document.documentElement;
      root.classList.remove('dark-theme', 'light-theme', 'system-theme');
     root.classList.add(`${actualTheme}-theme`);
      
      // Add system class if using system theme
      if (theme === 'system') {
        root.classList.add('system');
      }
    }
  }
}, [theme, actualTheme]);

const value: ThemeContextType = {
  theme: theme, // TypeScript now knows this is definitely a ThemeType
  systemTheme: systemTheme,
  actualTheme: actualTheme,
  toggleTheme: toggleTheme,
  setTheme: setSpecificTheme,
  isDark: actualTheme === 'dark',
  isLight: actualTheme === 'light',
  isSystem: theme === 'system'
};

return (
  <ThemeContext.Provider value={value}>
    <div className={`theme-${actualTheme}`}>
      {children}
    </div>
  </ThemeContext.Provider>
);
};
