import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View, useColorScheme } from "react-native";
import * as SplashScreen from "expo-splash-screen";

// Must match the expo-splash-screen config in app.json so the native splash hands off seamlessly.
const MARK_SIZE = 200;
const LIGHT = { background: "#f5f5f0", text: "#1a1611", muted: "#8a8578" };
const DARK = { background: "#1a1611", text: "#e8e4dc", muted: "#8a8578" };

const SUITS = [
  { glyph: "♠", red: false },
  { glyph: "♥", red: true },
  { glyph: "♣", red: false },
  { glyph: "♦", red: true },
];
const MIN_VISIBLE_MS = 900;
const FADE_OUT_MS = 320;

function SuitLoader({ palette }) {
  const pulses = useRef(SUITS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.stagger(
        140,
        pulses.map((value) =>
          Animated.sequence([
            Animated.timing(value, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(value, { toValue: 0, duration: 380, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          ]),
        ),
      ),
    );
    loop.start();
    return () => loop.stop();
  }, [pulses]);

  return (
    <View style={styles.loader}>
      {SUITS.map((suit, index) => (
        <Animated.Text
          key={suit.glyph}
          style={[
            styles.suit,
            {
              color: suit.red ? "#c0392b" : palette.text,
              opacity: pulses[index].interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }),
              transform: [{ translateY: pulses[index].interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }],
            },
          ]}
        >
          {suit.glyph}
        </Animated.Text>
      ))}
    </View>
  );
}

export default function LoadingScreen({ ready }) {
  const palette = useColorScheme() === "dark" ? DARK : LIGHT;
  const [mounted, setMounted] = useState(true);
  const [minElapsed, setMinElapsed] = useState(false);
  const intro = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), MIN_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, []);

  const handleLayout = () => {
    SplashScreen.hideAsync().catch(() => {});
    Animated.timing(intro, {
      toValue: 1,
      duration: 420,
      delay: 80,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (!ready || !minElapsed) return;
    Animated.timing(exit, {
      toValue: 1,
      duration: FADE_OUT_MS,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [ready, minElapsed, exit]);

  if (!mounted) return null;

  return (
    <Animated.View
      onLayout={handleLayout}
      pointerEvents={ready && minElapsed ? "none" : "auto"}
      style={[
        StyleSheet.absoluteFill,
        styles.container,
        { backgroundColor: palette.background, opacity: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
      ]}
    >
      <Animated.Image
        source={require("../../assets/splash-mark.png")}
        style={[
          styles.mark,
          { transform: [{ scale: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] },
        ]}
      />
      <Animated.View
        style={[
          styles.footer,
          {
            opacity: intro,
            transform: [{ translateY: intro.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          },
        ]}
      >
        <Text style={[styles.wordmark, { color: palette.text }]}>pick'em poker</Text>
        <SuitLoader palette={palette} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", zIndex: 100 },
  mark: { width: MARK_SIZE, height: MARK_SIZE },
  // Positioned below the centered mark so the mark itself stays exactly where the native splash drew it.
  footer: { position: "absolute", top: "50%", marginTop: MARK_SIZE / 2 + 12, alignItems: "center", gap: 14 },
  wordmark: { fontSize: 24, fontWeight: "500", letterSpacing: -0.5 },
  loader: { flexDirection: "row", gap: 14 },
  suit: { fontSize: 18 },
});
