import React from "react";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";
import Svg, { Path } from "react-native-svg";
import pallete, { assetPallete } from "../../lib/Colors";
import { IChapter } from "../../types/Chapter";
import PopButton from "./PopButton";

import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../nav/MainNavigation";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useUser } from "../../hooks/useUser";
import { useToast } from "../../hooks/useToast";
import { IUser } from "../../types/User";

const { width } = Dimensions.get("window");

const CARD_GAP = 15;
const SIDE_PADDING = 25;

const CARD_WIDTH =  (width - SIDE_PADDING * 2 - CARD_GAP) / 2;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ContentCard = ({ book }: { book: IChapter }) => {
  const navigation = useNavigation<NavigationProp>();
  const { showToast } = useToast();
  const { user }: { user: IUser | null } = useUser();

  return (
    <PopButton
      styles={styles.bookCard}
      scale={0.95}
      onPress={() => {
        if ((user?.subscription?.plan ?? 0) >= book.for) {
          if (book.type === "pdf"){

            navigation.navigate("ReadBook", {
              bookId: book._id,
            });
          }else {
            
            navigation.navigate("AudioRdr", {
              bookId: book._id,
            });
          }
        } else {
          showToast({
            title: "Upgrade your subscription to access this book.",
          });
        }
      }}>
      {/* Book Cover */}
      <View style={styles.bookCoverWrap}>
        <Image
          source={{ uri: book.cover.it || "https://media.istockphoto.com/id/910535064/photo/education-concept-close-up-view-of-old-burning-candle-with-shabby-old-book-on-table-background.jpg?s=612x612&w=0&k=20&c=PqgSXdubvVAgGHC_NsRwGKVswJhK61uHN5msh5IzaJs=" }}
          style={styles.bookCover}
        />

        <View style={[styles.cardBadge,{backgroundColor: book.type === "pdf" ? assetPallete[0] : assetPallete[1]}]}>
          <Text style={styles.badgeText}>
            {book.type === "pdf" ? "BOOK" : "AUDIO"}
          </Text>
        </View>
      </View>

      {/* Info */}
      <Text style={styles.bookTitle} numberOfLines={2}>
        {book.title || "let's lose hope."}
      </Text>

      <Text style={styles.bookAuthor}>{book.author || "Bulle Shah"}</Text>

      {/* Stats */}
      <View style={styles.bookStats}>
        <View style={styles.statItem}>
          <Svg
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            stroke={pallete.textgray}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </Svg>
          <Text style={styles.statText}>{book.likes}</Text>
        </View>

        <View style={styles.statItem}>
          <Svg
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            stroke={pallete.textgray}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </Svg>
          <Text style={styles.statText}>{book.comments.length}</Text>
        </View>
      </View>
    </PopButton>
  );
};

const styles = StyleSheet.create({
  bookCard: {
    width: CARD_WIDTH,
    backgroundColor: pallete.bgcard,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#ffffff15",
    marginBottom: 16,
  },

  bookCoverWrap: {
    position: "relative",
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },

  bookCover: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    backgroundColor: '#ffffff15'
  },

  cardBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: pallete.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
  },

  badgeText: {
    color: pallete.textwhite,
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },

  bookTitle: {
    fontFamily: "Playfair Display",
    fontSize: 16,
    fontWeight: "600",
    color: pallete.textwhite,
    lineHeight: 22,
    minHeight: 50,
    marginBottom: 6,
  },

  bookAuthor: {
    fontSize: 12,
    color: pallete.textgray,
    marginBottom: 14,
    minHeight: 18,
  },

  bookStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: "auto",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },

  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  statText: {
    fontSize: 12,
    color: pallete.textgray,
  },
});

export default ContentCard;
