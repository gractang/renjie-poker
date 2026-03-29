import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { isRedSuit } from "../lib/deck";
import { useTheme } from "../hooks/useTheme";

export default function Card({ card, selected = false, disabled = false, dimmed = false, onPress }) {
  const { colors } = useTheme();
  const red = isRedSuit(card);
  const suitColor = red ? colors.suitRed : colors.suitBlack;

  const cardStyle = [
    styles.card,
    { backgroundColor: colors.surface, borderColor: colors.border },
    selected && { borderColor: colors.accent, backgroundColor: colors.accentBg },
    dimmed && styles.dimmed,
  ];

  const content = (
    <View style={cardStyle}>
      <Text style={[styles.rank, { color: suitColor }]}>{card.rank}</Text>
      <Text style={[styles.suit, { color: suitColor }]}>{card.suit}</Text>
    </View>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity onPress={() => onPress(card)} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    width: 44,
    height: 60,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
    marginBottom: 4,
  },
  rank: {
    fontSize: 16,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  suit: {
    fontSize: 11,
    opacity: 0.7,
    marginTop: -2,
  },
  dimmed: {
    opacity: 0.35,
  },
});
