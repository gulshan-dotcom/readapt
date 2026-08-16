import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import pallete from '../../lib/Colors';
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from '../../components/nav/MainNavigation';
import useAuth from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

const SplashScreen = ({ route, navigation }: Props) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.86)).current;
  const accentOpacity = useRef(new Animated.Value(0)).current;

  const [accessToken, isLoggedIn, isLoading] = useAuth();

  useEffect(() => {
    if (!isLoading) {
      console.log("first reload")
      if (!isLoggedIn) {
        navigation.replace("Login");
      } else {

        navigation.replace("Tabs");
      }
    }
  }, [isLoading, isLoggedIn]);

  useEffect(() => {
    // Minimal entrance animation
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(accentOpacity, {
        toValue: 1,
        duration: 900,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={pallete.bgmain || '#090314'} />

      {/* Soft accent glow behind logo */}
      <Animated.View
        style={[
          styles.glow,
          { opacity: accentOpacity },
        ]}
      />

      <Animated.View
        style={[
          styles.logoWrap,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <Image
          source={require('../../assets/splash-icon.png')} // adjust path to your assets folder
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: pallete.bgmain || '#090314',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: width * 0.3,
    backgroundColor: pallete.accent || '#01796F',
    opacity: 0.12,
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.38,
    height: width * 0.38,
  },
});

export default SplashScreen;