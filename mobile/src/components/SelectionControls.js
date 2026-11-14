import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SUITS, SUIT_KEYS, RANKS, cardId } from "../lib/deck";
import { useTheme } from "../hooks/useTheme";

const GRID_COLUMNS = Math.ceil(RANKS.length / 2);
const RANK_ROWS = [RANKS.slice(0, GRID_COLUMNS), RANKS.slice(GRID_COLUMNS)];
const SUIT_LABELS = { S: "♠", H: "♥", C: "♣", D: "♦" };

function PillButton({ label, labelColor, onPress, active, disabled, colors, grid }) {
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
        grid && styles.pillGrid,
      ]}
    >
      <Text style={[
        styles.pillText,
        { color: colors.text },
        active && { color: colors.accent },
        labelColor && { color: labelColor },
        grid && styles.pillTextGrid,
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function GridRow({ children }) {
  const cells = Array.isArray(children) ? children : [children];
  return (
    <View style={styles.pills}>
      {cells.map((cell) => (
        <View key={cell.key} style={styles.gridCell}>{cell}</View>
      ))}
      {Array.from({ length: GRID_COLUMNS - cells.length }, (_, i) => (
        <View key={`empty-${i}`} style={styles.gridCell} />
      ))}
    </View>
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
  const { colors, suitColor } = useTheme();

  const isSuitFullySelected = (suitKey) => {
    const suitCards = remaining.filter(c => c.suitKey === suitKey);
    return suitCards.length > 0 && suitCards.every(c => selection.has(cardId(c)));
  };

  const isRankFullySelected = (rank) => {
    const rankCards = remaining.filter(c => c.rank === rank);
    return rankCards.length > 0 && rankCards.every(c => selection.has(cardId(c)));
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted }]}>Suits</Text>
      <View style={styles.grid}>
        <GridRow>
          {SUIT_KEYS.map((sk) => (
            <PillButton
              key={sk}
              label={SUIT_LABELS[sk]}
              labelColor={suitColor(sk)}
              onPress={() => onSelectSuit(sk)}
              active={isSuitFullySelected(sk)}
              disabled={disabled}
              colors={colors}
              grid
            />
          ))}
        </GridRow>
      </View>

      <Text style={[styles.label, { color: colors.textMuted, marginTop: 8 }]}>Ranks</Text>
      <View style={styles.grid}>
        {RANK_ROWS.map((row, rowIndex) => (
          <GridRow key={rowIndex}>
            {row.map((rank) => (
              <PillButton
                key={rank}
                label={rank}
                onPress={() => onSelectRank(rank)}
                active={isRankFullySelected(rank)}
                disabled={disabled}
                colors={colors}
                grid
              />
            ))}
          </GridRow>
        ))}
      </View>

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
  pillGrid: {
    minHeight: 44,
    paddingHorizontal: 0,
    paddingVertical: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: {
    fontSize: 14,
    fontWeight: "500",
  },
  pillTextGrid: {
    fontSize: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  grid: {
    gap: 6,
    marginBottom: 4,
  },
  gridCell: {
    flex: 1,
  },
  disabled: {
    opacity: 0.4,
  },
});
