import { createContext, useContext, useEffect, useState } from "react";
import { isMobileBuild } from "@/lib/platform";
// import { StatusBar, Style } from '@capacitor/status-bar';
// import { Capacitor } from '@capacitor/core';

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

// Determine default theme based on build target
// Mobile builds default to dark theme, web builds default to light theme
const platformDefaultTheme: Theme = isMobileBuild() ? "dark" : "light";

const initialState: ThemeProviderState = {
  theme: platformDefaultTheme,
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = platformDefaultTheme,
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    // let actualTheme = theme;

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      // actualTheme = systemTheme;
      return;
    }

    root.classList.add(theme);
    // else {
    
    // // Update status bar style on mobile
    // if (Capacitor.isNativePlatform()) {
    //   StatusBar.setStyle({
    //     style: actualTheme === "dark" ? Style.Dark : Style.Light
    //   }).catch(err => console.error('Failed to set status bar style:', err));
    
    // }
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider
      {...props}
      value={value}
    >
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
