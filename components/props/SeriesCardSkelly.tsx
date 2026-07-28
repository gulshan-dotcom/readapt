import React from "react";
import { View, StyleSheet } from "react-native";
import { createShimmerPlaceholder } from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";
import pallete from "../../lib/Colors";

const Shimmer = createShimmerPlaceholder(LinearGradient);

export default function SeriesCardSkelly() {
  return (
    <View style={styles.card}>
      {/* Stack Layers */}
      <View style={styles.stack1} />
      <View style={styles.stack2} />

      {/* Banner */}
      <Shimmer
       shimmerColors={["#191525", "#221e2e", "#191525"]} 
        style={styles.banner}
      />

      {/* Title */}
      <Shimmer
       shimmerColors={["#191525", "#221e2e", "#191525"]} 
        style={styles.title}
      />

      {/* Meta */}
      <Shimmer
       shimmerColors={["#191525", "#221e2e", "#191525"]} 
        style={styles.meta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 290,
    paddingTop: 16,
    marginRight: 20,
  },

  stack1: {
    position: "absolute",
    top: 4,
    left: "8%",
    width: "84%",
    height: 18,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: "#262033",
  },

  stack2: {
    position: "absolute",
    top: 10,
    left: "5%",
    width: "90%",
    height: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: "#1D1828",
  },

  banner: {
    height: 160,
    width: (160 / 9) * 16,
    borderRadius: 16,
  },

  title: {
    marginTop: 16,
    width: "70%",
    height: 17,
    borderRadius: 6,
  },

  meta: {
    marginTop: 8,
    width: "45%",
    height: 13,
    borderRadius: 6,
  },
});
