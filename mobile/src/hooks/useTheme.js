import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_KEY = "pickem-poker:theme";

const lightColors = {
  background: "#f5f5f0",
  surface: "#ffffff",
  text: "#1a1611",
  textMuted: "#8a8578",
  border: "#d9d5cd",
  accent: "#2d7a4f",
  accentBg: "rgba(45, 122, 79, 0.1)",
  suitRed: "#c0392b",
  suitBlack: "#1a1611",
  error: "#c0392b",
  winner: "#2d7a4f",
  loser: "#c0392b",
};

const darkColors = {
  background: "#1a1611",
  surface: "#2a2520",
  text: "#e8e4dc",
  textMuted: "#8a8578",
  border: "#3d3830",
  accent: "#5cb87a",
  accentBg: "rgba(92, 184, 122, 0.12)",
  suitRed: "#e74c3c",
  suitBlack: "#e8e4dc",
  error: "#e74c3c",
  winner: "#5cb87a",
  loser: "#e74c3c",
};

const ThemeContext = createContext({
  isDark: false,
  colors: lightColors,
  toggle: () => {},
});

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === "dark");

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((stored) => {
      if (stored === "dark") setIsDark(true);
      else if (stored === "light") setIsDark(false);
    });
  }, []);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(THEME_KEY, next ? "dark" : "light");
      return next;
    });
  }, []);

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
