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
import { useNetworkStatus } from "../../hooks/useNetwork";
import { SubscriptionPlan } from "../../enums";

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

type BookPopulated = {
  _id: string;
  title: string;
  details?: string;
  media: string; // URL
  type: "pdf" | "audio";
  for: SubscriptionPlan;
  isTrending: boolean;
  comments: {
    _id: string;
    by: {
      _id: string;
      name?: string;
      username?: string;
      avatar?: string;
    };
    text: string;
    createdAt: string;
  }[];
  cover: string;
  category: {
    _id: string;
    name: string;
    image: string;
    createdAt: Date;
    updatedAt: Date;
  };
  series?: string;
  likes: number;
  author: string;
  total: number;
  isDownloadable: boolean;
  toc: {
    cut: string;
    title: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const NextChapter = ({
  book,
  onOpen,
  viewer,
}: {
  book: BookPopulated;
  onOpen: (book: BookPopulated) => void;
  viewer: "pdf" | "audio";
}) => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useUser();
  const { showToast } = useToast();
  const { accessToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const { isConnected } = useNetworkStatus()
  const [nextChapters, setNextChapters] = useState<BookPopulated[] | null>(null);

  const renderContentCard = ({ item }: { item: BookPopulated }) => {
    return (
      <PopButton
        styles={styles.queueItem}
        scale={0.95}
        onPress={() => {
          if ((user?.subscription?.plan ?? 0) >= item.for) {
            if (item.type === viewer) {
              onOpen(item);
            } else {
              const route = item.type === "audio" ? "AudioRdr" : "ReadBook";
              navigation.navigate(route, {
                bookId: item._id,
              });
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
                    item.type === "pdf" ? assetPallete[0] : assetPallete[1],
                },
              ]}>
              <Text style={styles.badgeText}>
                {item.type === "pdf" ? "BOOK" : "AUDIO"}
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
    const fetchChapter = async () => {
      try {
        const chapters = await api.get(
          `/chapter/by-category/${book.category._id}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        setNextChapters(chapters.data.data.chapters.filter((item: IChapter) => item._id !== book._id));
      } catch (error) {
        console.error("Error fetching chapters data in NextChpaters:", error);
        showToast({ title: "Error" });
      } finally {
        setIsLoading(false);
      }
    };
    const getSeries = async () => {
      if(!book.series) return
      try {
        const chapters: ISeriesContent[] = book.series?.chapters;
        const next =
          chapters
            .filter((item) => item.contentModel === "Chapter" && item.content._id !== book._id)
            .map((item) => item.content) || null;
        setNextChapters(next);
      } catch (error) {
        console.error("Error fetching series data in NextChpaters:", error);
        showToast({ title: "Error" });
      }
      finally {
        setIsLoading(false);
      }
    };

    if (book.series) {
      getSeries();
    } else {
      fetchChapter();
    }
  }, [accessToken, book, isConnected]);

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
    borderColor: "transparent",
    borderWidth: 2,
    borderRadius: 8,
    overflow: "hidden"
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
