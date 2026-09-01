import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, FlatList } from "react-native";
import Svg, { Line } from "react-native-svg";
import { IChapter } from "../../types/Chapter";
import PopButton from "./PopButton";
import { useUser } from "../../hooks/useUser";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../nav/MainNavigation";
import { useToast } from "../../hooks/useToast";
import useAuth from "../../hooks/useAuth";
import { api } from "../../lib/api";
import NextChapterCardSkelly from "./NextChapterSkelly";
import { assetPallete } from "../../lib/Colors";
import { ISeriesContent } from "../../types/Series";

const colors = {
  bgMain: "#090314",
  bgCard: "rgba(20, 20, 20, 0.6)",
  accent: "#01796F",
  ctlBg: "#D0F2EE",
  ctlIcon: "#004D46",
  textGray: "#9ca3af",
  textWhite: "#ffffff",
  surfaceVariant: "rgba(255, 255, 255, 0.08)",
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const NextChapter = ({ book, onOpen }: { book: IChapter, onOpen : (book : IChapter) => void }) => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useUser();
  const { showToast } = useToast();
  const [accessToken] = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [nextChapters, setNextChapters] = useState<IChapter[] | null>(null);

  const renderContentCard = ({ item }: { item: IChapter }) => {
    return (
      <PopButton
        styles={styles.queueItem}
        scale={0.95}
        onPress={() => {
          if ((user?.subscription?.plan ?? 0) >= item.for) {
            if (item.type === "pdf") {
              navigation.navigate("ReadBook", {
                bookId: item._id,
              });
            } else {
              onOpen(item)
            }
          } else {
            showToast({
              title: "Upgrade your subscription to access this book.",
            });
          }
        }}>
        <View style={styles.queueWrapper}>
          <View style={styles.queueThumbContainer}>
            <Image
              source={{
                uri: item.cover,
              }}
              style={styles.queueThumb}
            />
            <View
              style={[
                styles.queueCardBadge,
                {
                  backgroundColor:
                    book.type === "pdf" ? assetPallete[0] : assetPallete[1],
                },
              ]}>
              <Text style={styles.badgeText}>
                {book.type === "pdf" ? "BOOK" : "AUDIO"}
              </Text>
            </View>
          </View>
          <View style={styles.queueInfo}>
            <Text style={styles.queueTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.queueAuthor}>{item.author}</Text>
            <Text style={styles.pages}>
              {item.total} {item.type === "pdf" ? "pages" : "min"}
            </Text>
          </View>
        </View>
        <View style={styles.dragIcon}>
          <Svg
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="2">
            <Line x1="4" y1="9" x2="20" y2="9" />
            <Line x1="4" y1="15" x2="20" y2="15" />
          </Svg>
        </View>
      </PopButton>
    );
  };

  useEffect(() => {
    if (!user || !accessToken) return;
    console.log("fetching series? ", book.series)
    const fetchChapter = async () => {
      console.log("fetching chapters for category: ", book.category)
      try {
        const chapters = await api.get(
          `/chapter/by-category/${book.category._id}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        setNextChapters(chapters.data.data.chapters);
      } catch (error) {
        console.error("Error fetching chapters data in NextChpaters:", error);
        showToast({ title: "Error" });
      } finally {
        setIsLoading(false);
      }
    };
    const getSeries = async () => {
      try {
        const data = await api.get(`/series/${user.joinedSeries}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const chapters : ISeriesContent[] = data.data.data.chapters
        const next = chapters.filter(item => item.contentModel === "Chapter").map(item => item.content) || null
        setNextChapters(next);
      } catch (error) {
        console.error("Error fetching series data in NextChpaters:", error);
        showToast({ title: "Error" });
      }
    };

    if (book.series) {
      getSeries();
    } else {
      fetchChapter();
    }
  }, [accessToken, book, accessToken]);

  return (
    <View>
      {isLoading ? (
        <FlatList
          data={[1, 2, 3, 4]}
          keyExtractor={(item) => item + ""}
          renderItem={() => <NextChapterCardSkelly />}
          numColumns={1}
          scrollEnabled={false}
          contentContainerStyle={{
            paddingHorizontal: 24,
            gap: 12,
          }}
        />
      ) : (
        <FlatList
          data={nextChapters}
          keyExtractor={(item) => item._id}
          renderItem={renderContentCard}
          numColumns={1}
          scrollEnabled={false}
          contentContainerStyle={{
            paddingHorizontal: 24,
            gap: 12,
          }}
        />
      )}
    </View>
  );
};

export default NextChapter;

const styles = StyleSheet.create({
  queueItem: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  queueWrapper: {
    flexDirection: "row",
    alignItems: "center",
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
  badgeText: {
    fontSize: 8,
    fontWeight: "600",
    color: "#fff",
    textTransform: "uppercase",
  },
  queueInfo: {
    flex: 1,
  },
  queueTitle: {
    fontFamily: "Playfair Display",
    fontSize: 15,
    fontWeight: "600",
    color: colors.textWhite,
    marginBottom: 2,
  },
  queueAuthor: {
    fontSize: 11,
    color: colors.textGray,
    marginBottom: 4,
  },
  pages: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  dragIcon: {
    paddingLeft: 8,
  },
});
