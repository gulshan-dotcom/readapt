import React, { useRef } from "react";
import {
  Image,
  Text,
  View,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../nav/MainNavigation";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import pallete, { assetPallete } from "../../lib/Colors"; // ← Import palette
const width = Dimensions.get("window").width;

type Props = {
  id: string;
  cover: string;
  title: string;
  readtill: string;
  total: string;
  type: string;
  author: string;
  icon?: React.ReactNode;
  learWidth?: number;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Contentprogress = ({
  id,
  cover,
  title,
  readtill,
  total,
  type,
  author,
  learWidth,
  icon,
}: Props) => {
  const navigation = useNavigation<NavigationProp>();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePress = () => {
    navigation.navigate("ReadBook", { bookId: id });
  };

  const progressPercentage =
    total && readtill ? (parseFloat(readtill) / parseFloat(total)) * 100 : 20;

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={styles.listItem}>
      <Animated.View
        style={[styles.container, { width: learWidth ? learWidth : width / 100 * 80 ,  transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.itemContent}>
          {/* Thumbnail */}
          <View style={styles.thumbWrapper}>
            <Image source={{ uri: cover }} style={styles.listThumb} />

            <View
              style={[
                styles.thumbBadge,
                {
                  backgroundColor:
                    type === "pdf" ? assetPallete[0] : assetPallete[1],
                },
              ]}>
              <Text style={styles.badgeText}>
                {type === "pdf" ? "BOOK" : "AUDIO"}
              </Text>
            </View>
          </View>

          {/* Info */}
          <View style={styles.listInfo}>
            <Text style={styles.listTitle} numberOfLines={2}>
              {title}
            </Text>
            <Text style={styles.listAuthor} numberOfLines={1}>
              {author}
            </Text>

            <View style={styles.progressTextContainer}>
              <Text style={styles.progressRead}>{readtill}</Text>
              <Text style={styles.progressTotal}>
                {" / "}
                {total} {type === "pdf" ? "pages" : "min"}
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercentage}%`,
                    backgroundColor:
                      type === "pdf" ? assetPallete[0] : assetPallete[1],
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Chevron */}
        
        <Svg
          width={20}
          height={20}
          viewBox="0 0 16 16"
          fill={pallete.textwhite}>
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.853333333333333 7.6466666666666665a0.5 0.5 0 0 1 0 0.7066666666666667l-5 5a0.5 0.5 0 0 1 -0.7066666666666667 -0.7066666666666667L9.793333333333333 8 5.1466666666666665 3.3533333333333335a0.5 0.5 0 0 1 0.7066666666666667 -0.7066666666666667l5 5Z"
          />
        </Svg>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  listItem: {
    marginBottom: 12,
  },

  container: {
    backgroundColor: pallete.bgcard,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
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
    position: "relative",
    width: 60,
    height: 60,
    flexShrink: 0,
  },

  listThumb: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    resizeMode: "cover",
  },

  thumbBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: pallete.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },

  badgeText: {
    fontSize: 8,
    fontWeight: "700",
    color: pallete.textwhite,
    textTransform: "uppercase",
  },

  listInfo: {
    flex: 1,
  },

  listTitle: {
    fontFamily: "Playfair Display",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    color: pallete.textwhite,
  },

  listAuthor: {
    fontSize: 10,
    color: pallete.textgray,
    marginBottom: 6,
  },

  progressTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  progressRead: {
    fontSize: 10,
    color: pallete.textwhite,
    fontWeight: "700",
  },

  progressTotal: {
    fontSize: 10,
    color: pallete.textgray,
    fontWeight: "500",
  },

  progressTrack: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: pallete.accent,
    borderRadius: 3,
  },
});

export default Contentprogress;