import { StyleSheet, Text, View } from "react-native";
import { SUITS, SUIT_KEYS, RANKS, cardId, isRedSuit } from "../lib/deck";
import Card from "./Card";
import { useTheme } from "../hooks/useTheme";

function SuitSection({ suitKey, suitIndex, remainingIds, selection, disabled, onToggle }) {
  const { colors } = useTheme();
  const suitSymbol = SUITS[suitIndex];
  const red = isRedSuit({ suitKey });

  const availableCount = RANKS.filter((rank) => {
    const id = `${rank}${suitKey}`;
    return remainingIds.has(id);
  }).length;

  return (
    <View style={[styles.suitSection, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <View style={styles.suitHeader}>
        <Text style={[styles.suitSymbol, { color: red ? colors.suitRed : colors.suitBlack }]}>
          {suitSymbol}
        </Text>
        <Text style={[styles.suitCount, { color: colors.textMuted }]}>
          {availableCount} live
        </Text>
      </View>
      <View style={styles.cardRow}>
        {RANKS.map((rank) => {
          const id = `${rank}${suitKey}`;
          const isRemaining = remainingIds.has(id);
          const isSelected = selection.has(id);
          const card = { rank, suit: suitSymbol, suitKey, rVal: RANKS.indexOf(rank) + 2 };

          return (
            <Card
              key={id}
              card={card}
              selected={isSelected}
              disabled={disabled || !isRemaining}
              dimmed={!isRemaining}
              onPress={isRemaining && !disabled ? onToggle : undefined}
            />
          );
        })}
      </View>
    </View>
  );
}

export default function SelectionGrid({ remainingIds, selection, disabled, onToggle }) {
  return (
    <View style={styles.container}>
      {SUIT_KEYS.map((suitKey, si) => (
        <SuitSection
          key={suitKey}
          suitKey={suitKey}
          suitIndex={si}
          remainingIds={remainingIds}
          selection={selection}
          disabled={disabled}
          onToggle={onToggle}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  suitSection: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 8,
  },
  suitHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  suitSymbol: {
    fontSize: 14,
  },
  suitCount: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: "monospace",
  },
  cardRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
