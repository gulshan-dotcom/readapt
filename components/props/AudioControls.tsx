import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  Animated,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import Slider from "@react-native-community/slider";
import Svg, { Path } from "react-native-svg";
import { useGlobalAudio } from "../../hooks/useGlobalAudio";
import { navigationRef } from "../nav/MainNavigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const colors = {
  bg: "rgba(15, 12, 25, 0.92)",
  accent: "#01796F",
  accentSoft: "#D0F2EE",
  accentDark: "#004D46",
  text: "#ffffff",
  textMuted: "#9ca3af",
  border: "rgba(255,255,255,0.08)",
  glow: "rgba(1, 121, 111, 0.45)",
};

const TAB_ROUTES = ["Home", "Downloads", "Profile"];

export default function AudioControls() {
  const { status, player, currentTrack, togglePlay, seekTo } = useGlobalAudio();
  const [trackWidth, setTrackWidth] = useState(0);
  const insets = useSafeAreaInsets();
  const [currentScreen, setCurrentScreen] = useState("");

  useEffect(() => {
    if (!navigationRef.isReady()) {
      return;
    }

    const updateRoute = () => {
      const route = navigationRef.getCurrentRoute();
      setCurrentScreen(route?.name ?? "");
    };

    updateRoute();

    const unsubscribe = navigationRef.addListener?.("state", updateRoute);

    return unsubscribe;
  }, []);

  const isTabScreen = TAB_ROUTES.includes(currentScreen);

  // ─── Animated Values ───────────────────────────────────────
  // Native Driver (Transform & Opacity)
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pressGlowAnim = useRef(new Animated.Value(0)).current;
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0); // seconds, while dragging
  const seekToSec = useCallback(
    (sec: number) => {
      if (!status?.isLoaded || !status.duration || status.duration <= 0) return;
      const clamped = Math.max(0, Math.min(sec, status.duration));
      player.seekTo(clamped);
    },
    [status.isLoaded, status.duration, player]
  );

  // Pure Native Driver Gesture Animation (Eliminates JS Bridge Bottlenecks)
  const animateIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        friction: 5,
        tension: 140,
        useNativeDriver: true,
      }),
      Animated.timing(pressGlowAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(pressGlowAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const seekRelative = (delta: number) => {
    if (!status?.isLoaded || !status.duration) return;
    const next = Math.max(
      0,
      Math.min(status.duration, status.currentTime + delta),
    );
    seekTo(next);
  };

  const formatTime = (sec = 0) => {
    if (isNaN(sec) || sec < 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (!currentTrack || currentScreen === "Splash") {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          bottom: isTabScreen ? insets.bottom + 75 : insets.bottom + 5,
          transform: [{ scale: scaleAnim }],
        },
      ]}>
      {/* Animated press overlay using native driver opacity */}
      <Animated.View
        style={[
          styles.glowOverlay,
          {
            opacity: pressGlowAnim,
          },
        ]}
      />
      <Pressable
        onPress={() => {
          if (!currentTrack || !navigationRef.isReady()) return;
          (navigationRef as any).navigate("AudioRdr", { bookId: currentTrack._id });
        }}>
        <View style={styles.innerContent}>
          {/* Left cover image */}
          <View style={styles.coverWrap}>
            <Image source={{ uri: currentTrack.cover }} style={styles.cover} />
            <View style={styles.coverGlow} />
          </View>

          {/* Controls cluster */}
          <View style={styles.controls}>
            {/* -10s */}
            <Pressable
              onPress={() => seekRelative(-10)}
              onPressIn={animateIn}
              onPressOut={animateOut}
              style={({ pressed }) => [
                styles.seekBtn,
                pressed && styles.seekBtnActive,
              ]}>
              <Svg width={18} height={18} viewBox="0 0 24 24">
                <Path
                  d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"
                  fill={colors.accentSoft}
                />
              </Svg>
            </Pressable>

            {/* Progress bar */}
            <View style={styles.progressSection}>
              <View
                style={styles.progressTrack}>
                <View style={styles.progressBg} />
                <Slider
                  style={styles.progressFillContainer}
                  minimumValue={0}
                  maximumValue={status.duration > 0 ? status.duration : 1}
                  value={status?.currentTime}
                  minimumTrackTintColor="#007AFF"
                  maximumTrackTintColor="#ffffff71"
                  thumbTintColor="#007AFF"
                  onSlidingStart={() => {
                    setIsSeeking(true);
                    setSeekValue(status?.currentTime);
                  }}
                  onValueChange={(value) => {
                    setSeekValue(value);
                  }}
                  onSlidingComplete={(value) => {
                    setIsSeeking(false);
                    seekToSec(value);
                  }}
                  disabled={!status?.isLoaded || !status.duration || status.duration <= 0}
                />
              </View>

              <View style={styles.timeRow}>
                <Text style={styles.timeText}>
                  {formatTime(status?.currentTime)}
                </Text>
                <Text style={styles.timeText}>
                  {formatTime(status?.duration)}
                </Text>
              </View>
            </View>

            {/* +10s */}
            <Pressable
              onPress={() => seekRelative(10)}
              onPressIn={animateIn}
              onPressOut={animateOut}
              style={({ pressed }) => [
                styles.seekBtn,
                pressed && styles.seekBtnActive,
              ]}>
              <Svg width={18} height={18} viewBox="0 0 24 24">
                <Path
                  d="M13 6v12l8.5-6L13 6zM4 18l8.5-6L4 6v12z"
                  fill={colors.accentSoft}
                />
              </Svg>
            </Pressable>
          </View>

          {/* Play / Pause toggle */}
          <Pressable
            onPress={togglePlay}
            onPressIn={animateIn}
            onPressOut={animateOut}
            style={styles.playWrap}>
            <View
              style={[
                styles.playCircle,
                status?.playing && styles.playCircleActive,
              ]}>
              {status?.playing ? (
                <Svg width={22} height={22} viewBox="0 0 24 24">
                  <Path
                    d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"
                    fill={colors.accentDark}
                  />
                </Svg>
              ) : (
                <Svg width={22} height={22} viewBox="0 0 24 24">
                  <Path d="M8 5v14l11-7z" fill={colors.accentDark} />
                </Svg>
              )}
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.bg,
    // bottom: 92,
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: colors.glow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    overflow: "hidden",
  },
  loadingWrapper: {
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(1, 97, 121, 0.15)",
    borderColor: "rgba(1, 121, 91, 0.65)",
    borderWidth: 1.5,
    borderRadius: 28,
  },
  innerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  coverWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    overflow: "hidden",
  },
  cover: {
    width: "100%",
    height: "100%",
  },
  coverGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(1,121,111,0.18)",
  },
  controls: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 8,
  },
  seekBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  seekBtnActive: {
    backgroundColor: "rgba(1,121,111,0.25)",
  },
  seekLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.accentSoft,
  },
  progressSection: {
    flex: 1,
  },
  progressTrack: {
    height: 24,
    justifyContent: "center",
    position: "relative",
  },
  progressBg: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  progressFillContainer: {
    position: "absolute",
    left: 0,
    height: 4,
    overflow: "hidden",
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  timeText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textMuted,
  },
  playWrap: {
    marginLeft: 4,
  },
  playCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  playCircleActive: {
    backgroundColor: "#B9D7D4",
  },
});
