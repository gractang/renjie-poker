import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../hooks/useTheme";

export default function RulesModal({ visible, onClose }) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.textMuted }]}>HOW TO PLAY</Text>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { borderColor: colors.border }]}>
            <Text style={[styles.closeBtnText, { color: colors.text }]}>close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyInner}>
          <Text style={[styles.text, { color: colors.text }]}>
            <Text style={styles.bold}>Goal:</Text> Build the best 5-card poker hand.
          </Text>

          <View style={styles.steps}>
            <Text style={[styles.step, { color: colors.text }]}>
              1. You start with an empty hand and a full shuffled deck.
            </Text>
            <Text style={[styles.step, { color: colors.text }]}>
              2. On each turn, choose a subset of ranks/suits from the remaining deck, then tap deal.
            </Text>
            <Text style={[styles.step, { color: colors.text }]}>
              3. Cards are dealt from the deck until a card in your subset appears:
            </Text>
            <Text style={[styles.substep, { color: colors.textMuted }]}>
              {"\u2022"} You take that matching card.
            </Text>
            <Text style={[styles.substep, { color: colors.textMuted }]}>
              {"\u2022"} The dealer takes every other card dealt.
            </Text>
            <Text style={[styles.step, { color: colors.text }]}>
              4. Repeat until you have 5 cards.
            </Text>
            <Text style={[styles.step, { color: colors.text }]}>
              5. <Text style={styles.bold}>Showdown:</Text> Dealer uses their best five; you use yours. Dealer wins ties and must have at least 8 cards.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: "monospace",
  },
  closeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  closeBtnText: {
    fontSize: 12,
    fontWeight: "500",
  },
  body: {
    flex: 1,
  },
  bodyInner: {
    padding: 16,
    paddingBottom: 40,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  bold: {
    fontWeight: "700",
  },
  steps: {
    gap: 8,
  },
  step: {
    fontSize: 14,
    lineHeight: 22,
  },
  substep: {
    fontSize: 14,
    lineHeight: 22,
    paddingLeft: 24,
  },
});
