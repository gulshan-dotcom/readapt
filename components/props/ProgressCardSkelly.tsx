import React from "react";
import { View, StyleSheet } from "react-native";
import { createShimmerPlaceholder } from "react-native-shimmer-placeholder";
import { LinearGradient } from 'expo-linear-gradient';
import pallete from "../../lib/Colors";

const Shimmer = createShimmerPlaceholder(LinearGradient);

// Common shimmer colors matching your other skeleton card
const SHIMMER_COLORS = ["#191525", "#221e2e", "#191525"];

export default function ContentProgressSkelly() {
  return (
    <View style={styles.listItem}>
      <View style={styles.container}>
        <View style={styles.itemContent}>
          
          <View style={styles.thumbWrapper}>
            <Shimmer
              shimmerColors={SHIMMER_COLORS}
              style={styles.listThumb}
            />
          </View>

          {/* Info Skeleton */}
          <View style={styles.listInfo}>
            {/* Title */}
            <Shimmer
              shimmerColors={SHIMMER_COLORS}
              style={styles.listTitle}
            />
            {/* Author */}
            <Shimmer
              shimmerColors={SHIMMER_COLORS}
              style={styles.listAuthor}
            />
            {/* Pages / Progress text */}
            <Shimmer
              shimmerColors={SHIMMER_COLORS}
              style={styles.progressText}
            />
            {/* Progress Track */}
            <View style={styles.progressTrack}>
              <Shimmer
                shimmerColors={SHIMMER_COLORS}
                style={styles.progressFill}
              />
            </View>
          </View>

        </View>

        {/* Chevron Placeholder */}
        <Shimmer
          shimmerColors={SHIMMER_COLORS}
          style={styles.chevron}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  listItem: {
    marginBottom: 12,
  },

  container: {
    backgroundColor: pallete.bgcard,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)", // Matching the subtle skeleton border
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 16,
  },

  thumbWrapper: {
    width: 60,
    height: 60,
    flexShrink: 0,
  },

  listThumb: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },

  listInfo: {
    flex: 1,
  },

  listTitle: {
    width: "80%",
    height: 16,
    borderRadius: 4,
    marginBottom: 6,
  },

  listAuthor: {
    width: "45%",
    height: 11,
    borderRadius: 4,
    marginBottom: 8,
  },

  progressText: {
    width: "30%",
    height: 11,
    borderRadius: 4,
    marginBottom: 8,
  },

  progressTrack: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 3,
    overflow: "hidden",
    width: "100%",
  },

  progressFill: {
    height: "100%",
    width: "35%", // Visual indicator that it's a progress skeleton loading up
    borderRadius: 3,
  },

  chevron: {
    width: 14,
    height: 14,
    borderRadius: 4,
    marginLeft: 8,
  },
});