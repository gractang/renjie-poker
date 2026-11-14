import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_KEY = "pickem-poker:theme";
const FOUR_COLOR_KEY = "pickem-poker:four-color";

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
  suitBlue: "#1f5fbf",
  suitGreen: "#1e8a3c",
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
  suitBlue: "#5b9cf0",
  suitGreen: "#4cc46a",
  error: "#e74c3c",
  winner: "#5cb87a",
  loser: "#e74c3c",
};

function suitColorFor(suitKey, colors, fourColor) {
  if (suitKey === "H") return colors.suitRed;
  if (suitKey === "D") return fourColor ? colors.suitBlue : colors.suitRed;
  if (suitKey === "C") return fourColor ? colors.suitGreen : colors.suitBlack;
  return colors.suitBlack;
}

const ThemeContext = createContext({
  ready: false,
  isDark: false,
  colors: lightColors,
  toggle: () => {},
  fourColor: false,
  toggleFourColor: () => {},
  suitColor: (suitKey) => suitColorFor(suitKey, lightColors, false),
});

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === "dark");
  const [fourColor, setFourColor] = useState(false);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(THEME_KEY), AsyncStorage.getItem(FOUR_COLOR_KEY)])
      .then(([storedTheme, storedFourColor]) => {
        if (storedTheme === "dark") setIsDark(true);
        else if (storedTheme === "light") setIsDark(false);
        setFourColor(storedFourColor === "on");
      })
      .finally(() => setReady(true));
  }, []);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(THEME_KEY, next ? "dark" : "light");
      return next;
    });
  }, []);

  const toggleFourColor = useCallback(() => {
    setFourColor((prev) => {
      const next = !prev;
      AsyncStorage.setItem(FOUR_COLOR_KEY, next ? "on" : "off");
      return next;
    });
  }, []);

  const colors = isDark ? darkColors : lightColors;
  const suitColor = useCallback(
    (suitKey) => suitColorFor(suitKey, colors, fourColor),
    [colors, fourColor],
  );

  return (
    <ThemeContext.Provider value={{ ready, isDark, colors, toggle, fourColor, toggleFourColor, suitColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
