import React from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import Svg, { Path } from "react-native-svg";
import pallete from "../../lib/Colors";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "./MainNavigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const TopNav = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <View style={[{ ...styles.navbar }, { paddingTop: insets.top, 
    height: 70 +insets.top, }]}>
      <View>
        <Text style={styles.brandName}>Naveen Kattar</Text>
        <Text style={styles.welcomeBack}>Welcome Back!</Text>
      </View>

      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => navigation.navigate("Subscription")}>
        <Animated.View
          style={[
            styles.subscriptionIcon,
            { transform: [{ scale: scaleAnim }] },
          ]}>
          <LinearGradient
            colors={["#01796F", "#00A36C", "#50C878"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.subscriptionIcon}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="#0B0B0B">
              <Path
                d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5Z"
                stroke="#0B0B0B"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M5 20H19"
                stroke="#0B0B0B"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "rgba(5,5,5,0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    zIndex: 100,
  },
  brandName: {
    fontWeight: "700",
    fontSize: 18,
    color: pallete.textwhite,
  },
  welcomeBack: {
    fontSize: 10,
    color: pallete.textgray,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "500",
  },
  subscriptionIcon: {
    width: 38,
    height: 38,
    backgroundColor: "linear-gradient(135deg, #01796F, #00A36C)",
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00A36C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
});

export default TopNav;
