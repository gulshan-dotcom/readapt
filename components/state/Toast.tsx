import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useToast } from "../../hooks/useToast";
import pallete from "../../lib/Colors";
import Svg, { Line } from "react-native-svg";

const Toast = () => {
  const { toast, hideToast } = useToast();

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (!toast?.title) return;

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: 200,
          easing: Easing.bezier(0, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          easing: Easing.bezier(0, 0, 0.2, 1),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [toast]);

  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 10,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      hideToast?.();
    });
  };

  if (!toast?.title) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        {
          opacity,
          transform: [{ scale }, { translateY }],
        },
      ]}>
      <View style={styles.toast}>
        <Text style={styles.text}>{toast.title}</Text>

        <Pressable
          onPress={dismissToast}
          android_ripple={{
            color: "rgba(255,255,255,0.12)",
            radius: 18,
            borderless: true,
          }}
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.closePressed,
          ]}>
          <Svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={pallete.textgray}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round">
            <Line x1="18" y1="6" x2="6" y2="18"></Line>
            <Line x1="6" y1="6" x2="18" y2="18"></Line>
          </Svg>
        </Pressable>
      </View>
    </Animated.View>
  );
};

export default Toast;

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 92,
    zIndex: 9999,
  },

  toast: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    backgroundColor: "#1c1b1f",

    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },

  text: {
    flex: 1,
    paddingRight: 14,

    color: "#e6e1e5",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
  },

  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,

    justifyContent: "center",
    alignItems: "center",
  },

  closePressed: {
    backgroundColor: "rgba(255,255,255,0.1)",
    transform: [{ scale: 0.92 }],
  },
});
