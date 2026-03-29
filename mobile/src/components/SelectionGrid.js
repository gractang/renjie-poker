import { StyleSheet, View } from "react-native";
import { SUITS, SUIT_KEYS, RANKS, cardId } from "../lib/deck";
import Card from "./Card";

export default function SelectionGrid({ remainingIds, selection, disabled, onToggle }) {
  return (
    <View style={styles.grid}>
      {SUIT_KEYS.map((suitKey, si) =>
        RANKS.map((rank) => {
          const id = `${rank}${suitKey}`;
          const isRemaining = remainingIds.has(id);
          const isSelected = selection.has(id);
          const card = { rank, suit: SUITS[si], suitKey, rVal: RANKS.indexOf(rank) + 2 };

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
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
