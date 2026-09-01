import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { createShimmerPlaceholder } from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";
import pallete from "../../lib/Colors";

const Shimmer = createShimmerPlaceholder(LinearGradient);

const CARD_WIDTH = (Dimensions.get("window").width - 64) / 2;

export default function NextChapterSkelly() {
  return (
    <View style={styles.queueItem}>
      <View style={styles.queueWrapper}>
        <View style={styles.queueThumbContainer}>
          <Shimmer
            shimmerColors={["#191525", "#221e2e", "#191525"]}
            style={styles.queueThumb}
          />
        </View>
      <View style={styles.queueInfo}>
        <Shimmer
          shimmerColors={["#191525", "#221e2e", "#191525"]}
          style={styles.queueTitle}
        />
        <Shimmer
          shimmerColors={["#191525", "#221e2e", "#191525"]}
          style={styles.queueAuthor}
        />
        <Shimmer
          shimmerColors={["#191525", "#221e2e", "#191525"]}
          style={styles.pages}
        />
      </View>
      </View>


      <View style={styles.dragIcon}>
        <Shimmer
          shimmerColors={["#191525", "#221e2e", "#191525"]}
          style={styles.bar}
        />
        <Shimmer
          shimmerColors={["#191525", "#221e2e", "#191525"]}
          style={styles.bar}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  queueItem: {
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  queueWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    flex: 1,
  },
  queueThumbContainer: {
    width: 56,
    height: 56,
    position: "relative",
  },
  queueThumb: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    resizeMode: "cover",
  },
  queueCardBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderBottomLeftRadius: 6,
  },
  queueInfo: {
    flex: 1,
  },
  queueTitle: {
    height: 15,
    width: 155,
    marginBottom: 2,
  },
  queueAuthor: {
    height: 11,
    width: 72,
    marginBottom: 4,
  },
  pages: {
    height: 10,
    width: 22,
  },
  dragIcon: {
    paddingLeft: 8,
    height: 14,
    justifyContent: "space-between",
  },
  bar: {
    width: 20,
    height: 5,
    borderRadius: 2
  },
});

