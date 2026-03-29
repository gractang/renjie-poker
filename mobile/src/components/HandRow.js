import { StyleSheet, View } from "react-native";
import Card from "./Card";
import { cardId } from "../lib/deck";
import { useTheme } from "../hooks/useTheme";

const EMPTY_SLOTS = 5;

function EmptySlot({ colors }) {
  return (
    <View style={[styles.emptySlot, { borderColor: colors.border }]} />
  );
}

export default function HandRow({ cards, maxSlots = EMPTY_SLOTS, highlightIds }) {
  const { colors } = useTheme();
  const highlightSet = highlightIds ? new Set(highlightIds.map(cardId)) : null;
  const emptyCount = Math.max(0, maxSlots - cards.length);

  return (
    <View style={styles.row}>
      {cards.map((c) => {
        const highlighted = highlightSet ? highlightSet.has(cardId(c)) : true;
        return (
          <Card key={cardId(c)} card={c} dimmed={!highlighted} />
        );
      })}
      {emptyCount > 0 && Array.from({ length: emptyCount }, (_, i) => (
        <EmptySlot key={`empty-${i}`} colors={colors} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  emptySlot: {
    width: 44,
    height: 60,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: "dashed",
    marginRight: 4,
    marginBottom: 4,
  },
});
