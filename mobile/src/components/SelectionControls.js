import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SUITS, SUIT_KEYS, RANKS, cardId } from "../lib/deck";
import { useTheme } from "../hooks/useTheme";

function PillButton({ label, onPress, active, disabled, colors, small }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.pill,
        { borderColor: colors.border, backgroundColor: colors.surface },
        active && { borderColor: colors.accent, backgroundColor: colors.accentBg },
        disabled && styles.disabled,
        small && styles.pillSmall,
      ]}
    >
      <Text style={[
        styles.pillText,
        { color: colors.text },
        active && { color: colors.accent },
        small && styles.pillTextSmall,
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function SelectionControls({
  remaining,
  selection,
  disabled,
  onSelectSuit,
  onSelectRank,
  onSelectAll,
  onClearSelection,
}) {
  const { colors } = useTheme();

  const isSuitFullySelected = (suitKey) => {
    const suitCards = remaining.filter(c => c.suitKey === suitKey);
    return suitCards.length > 0 && suitCards.every(c => selection.has(cardId(c)));
  };

  const isRankFullySelected = (rank) => {
    const rankCards = remaining.filter(c => c.rank === rank);
    return rankCards.length > 0 && rankCards.every(c => selection.has(cardId(c)));
  };

  const suitLabels = { S: "♠", H: "♥", C: "♣", D: "♦" };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Suits</Text>
        <View style={styles.pills}>
          {SUIT_KEYS.map((sk) => (
            <PillButton
              key={sk}
              label={suitLabels[sk]}
              onPress={() => onSelectSuit(sk)}
              active={isSuitFullySelected(sk)}
              disabled={disabled}
              colors={colors}
            />
          ))}
        </View>
      </View>

      <Text style={[styles.label, { color: colors.textMuted, marginTop: 8 }]}>Ranks</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rankScroll}>
        <View style={styles.pills}>
          {RANKS.map((rank) => (
            <PillButton
              key={rank}
              label={rank}
              onPress={() => onSelectRank(rank)}
              active={isRankFullySelected(rank)}
              disabled={disabled}
              colors={colors}
              small
            />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.row, { marginTop: 8 }]}>
        <PillButton
          label="Select all"
          onPress={onSelectAll}
          disabled={disabled}
          colors={colors}
        />
        <PillButton
          label="Clear"
          onPress={onClearSelection}
          disabled={disabled || selection.size === 0}
          colors={colors}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pills: {
    flexDirection: "row",
    gap: 6,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  pillSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillText: {
    fontSize: 14,
    fontWeight: "500",
  },
  pillTextSmall: {
    fontSize: 13,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  rankScroll: {
    marginBottom: 4,
  },
  disabled: {
    opacity: 0.4,
  },
});
