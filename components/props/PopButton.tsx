import React, { ReactNode, useState } from "react";
import { Pressable, Animated, ViewStyle, StyleProp } from "react-native";

const PopButton = ({
  children,
  styles,
  activeStyles,
  onPress,
  scale = 0.97,
}: {
  children: ReactNode;
  styles?: StyleProp<ViewStyle>;
  activeStyles?: StyleProp<ViewStyle>;
  onPress?: () => void;
  scale?: number;
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: scale,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}>
      <Animated.View
        style={[styles,
          isPressed && activeStyles ,
          { transform: [{ scale: scaleAnim }] },
        ]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

export default PopButton;
