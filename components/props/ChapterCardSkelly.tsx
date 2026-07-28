import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { createShimmerPlaceholder } from "react-native-shimmer-placeholder";
import { LinearGradient } from 'expo-linear-gradient';
import pallete from "../../lib/Colors";

const Shimmer = createShimmerPlaceholder(LinearGradient);

const CARD_WIDTH = (Dimensions.get("window").width - 64) / 2;

export default function ChapterCardSkelly() {
  return (
    <View style={styles.card}>
      <Shimmer
        shimmerColors={["#191525", "#221e2e", "#191525"]} 
        style={styles.cover}
      />

      <Shimmer
        shimmerColors={["#191525", "#221e2e", "#191525"]} 
        style={styles.title}
      />

      <Shimmer
        shimmerColors={["#191525", "#221e2e", "#191525"]} 
        style={styles.subtitle}
      />

      <View style={styles.stats}>
        <Shimmer
          shimmerColors={["#191525", "#221e2e", "#191525"]} 
          style={styles.stat}
        />
        <Shimmer
          shimmerColors={["#191525", "#221e2e", "#191525"]} 
          style={styles.stat}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: pallete.bgcard,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    marginBottom: 16,
  },

  cover: {
    width: CARD_WIDTH  * 0.80,
    height: CARD_WIDTH  * 0.80,
    borderRadius: 14,
  },

  title: {
    marginTop: 14,
    width: "90%",
    height: 22,
    borderRadius: 6,
  },

  subtitle: {
    marginTop: 8,
    width: "60%",
    height: 13,
    borderRadius: 6,
  },

  stats: {
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,.08)",

    flexDirection: "row",
    justifyContent: "space-between",
  },

  stat: {
    width: 55,
    height: 14,
    borderRadius: 6,
  },
});
