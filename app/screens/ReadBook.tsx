import { ParamListBase, RouteProp } from "@react-navigation/native";

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Svg, { Path, Line, parse, Circle, Polyline } from "react-native-svg";
import pallete from "../../lib/Colors";
import ContentCard from "../../components/props/ContentCard";
import { api } from "../../lib/api";
import useAuth from "../../hooks/useAuth";
import { IChapter } from "../../types/Chapter";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { IRecentRead } from "../../types/Storage";
import PopButton from "../../components/props/PopButton";
import { useToast } from "../../hooks/useToast";
import { useUser } from "../../hooks/useUser";
import CommentsDrawer from "../../components/props/Comments";
import { SubscriptionPlan } from "../../enums";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

const MORPH_DISTANCE = 100;
const CONTAINER_PADDING_TOP = 75;

const SCROLLVIEW_MARGIN_TOP = 20;

const PLAYER_CONTAINER_PADDING = 16;

const PDF_FRAME_MARGIN_TOP = 12;

const CARD_WIDTH = SCREEN_WIDTH - PLAYER_CONTAINER_PADDING * 2;

const CARD_HEIGHT = CARD_WIDTH * (5 / 4); // aspectRatio 4/5

const CARD_TOP =
  SCROLLVIEW_MARGIN_TOP + PLAYER_CONTAINER_PADDING + PDF_FRAME_MARGIN_TOP + 60;

const CARD_LEFT = PLAYER_CONTAINER_PADDING;

const CARD_RADIUS = 12;

const SCALE_X = CARD_WIDTH / SCREEN_WIDTH;
const SCALE_Y = CARD_HEIGHT / SCREEN_HEIGHT;

// Center offsets for scale transforms (since default transform-origin in RN is center)
const INITIAL_CENTER_X = SCREEN_WIDTH / 2;
const INITIAL_CENTER_Y = SCREEN_HEIGHT / 2;

const TARGET_CENTER_X = CARD_LEFT + CARD_WIDTH / 2;
const TARGET_CENTER_Y = CARD_TOP + CARD_HEIGHT / 2;

const TRANSLATE_X = TARGET_CENTER_X - INITIAL_CENTER_X;
const TRANSLATE_Y = TARGET_CENTER_Y - INITIAL_CENTER_Y;

type Props = {
  route: {
    params: {
      bookId: string;
    };
  };
  navigation: any;
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

const BookReaderScreen = ({ route, navigation }: Props) => {
  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [accessToken] = useAuth();
  const [book, setBook] = useState<BookPopulated | null>();
  const [isLoading, setIsLoading] = useState(true);
  const [lastOpenPage, setLastOpenPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const { showToast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const { user, reload } = useUser();
  const [showComments, setShowComments] = useState(false);

  const chapterId = route.params.bookId;

  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const fetchChapter = async () => {
    const chapter = await api.get(`/chapter/${chapterId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // console.log(chapter.status, "fatch status")

    setBook(chapter.data.data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchChapter();
  }, [accessToken]);

  // NOTE: useNativeDriver must stay false here. The morph animation drives
  // borderRadius alongside transform/opacity on the same Animated.Value, and
  // borderRadius cannot run on the native (UI) thread. Mixing a native-driven
  // transform with a JS-driven borderRadius on the same interpolation is what
  // caused the desync/stutter — keeping everything on one thread fixes it.
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (e: any) => {
        const y = e.nativeEvent.contentOffset.y;
        if (y >= MORPH_DISTANCE && !isLocked) {
          setIsLocked(true);
        } else if (y < MORPH_DISTANCE && isLocked) {
          setIsLocked(false);
        }
      },
    },
  );

  // Scroll-snap: once the user lets go, don't allow the scroll position to
  // rest between the "fullscreen" (y=0) and "card" (y=MORPH_DISTANCE) states.
  // Snap to whichever end is closer, with spring physics for a natural feel.
  const snapToNearestState = (e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    if (y > 0 && y < MORPH_DISTANCE) {
      const target = y < MORPH_DISTANCE / 2 ? 0 : MORPH_DISTANCE;
      const springDriver = new Animated.Value(y);
      const listenerId = springDriver.addListener(({ value }) => {
        scrollRef.current?.scrollTo({ y: value, animated: false });
      });
      Animated.spring(springDriver, {
        toValue: target,
        useNativeDriver: false,
        bounciness: 10,
        speed: 14,
      }).start(() => {
        springDriver.removeListener(listenerId);
      });
    }
  };

  const openToc = () => setIsTocOpen(true);
  const closeToc = () => setIsTocOpen(false);

  // Pan Gesture for TOC drag (optional enhancement)
  const tocPan = Gesture.Pan().onEnd((e) => {
    if (e.translationX < -100) closeToc();
  });

  // Smooth 0 -> 1 progress driver
  const progress = scrollY.interpolate({
    inputRange: [0, MORPH_DISTANCE],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  // Crossfade between the fullscreen overlay and the in-flow card. Tightened to
  // the very end of the range so it reads as an instant hand-off/replication
  // once the overlay's geometry matches the card exactly, not a visible dissolve.
  const overlayOpacity = progress.interpolate({
    inputRange: [0, 0.98, 1],
    outputRange: [1, 1, 0],
    extrapolate: "clamp",
  });

  const cardOpacity = progress.interpolate({
    inputRange: [0, 0.98, 1],
    outputRange: [0, 0, 1],
    extrapolate: "clamp",
  });

  // Animate the overlay's border in alongside its radius so that by the time
  // it lands, it is pixel-identical to the real pdfFrame underneath it —
  // same border width/color, same radius — which is what makes the hand-off
  // invisible instead of needing a fade to mask a mismatch.
  const overlayBorderWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const scaleX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, SCALE_X],
  });

  const scaleY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, SCALE_Y],
  });

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TRANSLATE_X],
  });

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TRANSLATE_Y],
  });

  const borderRadius = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, CARD_RADIUS],
  });

  useEffect(() => {
    if (chapterId) return;
    const getRecentRead = async () => {
      const readChapters = await AsyncStorage.getItem("recentReads");
      if (!readChapters) return;
      const recentReads: IRecentRead[] = JSON.parse(readChapters);
      const lastOpen = recentReads.filter(
        (recentRead) => recentRead.content._id === chapterId,
      )[0].readtill;
      setLastOpenPage(parseInt(lastOpen));
      setCurrentPage(parseInt(lastOpen));
    };
    getRecentRead();
  }, [chapterId]);

  const updateRecentReads = async () => {
    if (currentPage > 1 && book) {
      let oldRecentReads = await AsyncStorage.getItem("recentReads");
      if (!oldRecentReads) oldRecentReads = "[]";
      const recentReads: IRecentRead[] = JSON.parse(oldRecentReads);

      // Filter out the existing entry if it's already there
      const newRecentReads = recentReads.filter(
        (item) => item.content._id !== chapterId,
      );

      // Push the new record with the current date/time
      newRecentReads.push({
        content: {
          ...book,
          comments: Array.isArray(book.comments) ? book.comments.length : 0,
          category: book.category?.name || book.category?._id || "",
        },
        readtill: currentPage + "",
        total: book?.total + "",
        readAt: new Date().toString(),
      });

      await AsyncStorage.setItem("recentReads", JSON.stringify(newRecentReads));
    }
  };

  const like = async () => {
    setIsLiked(!isLiked);
    try {
      const data = await api.post(
        "/chapter/like",
        {
          chapterId,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
    } catch (error) {
      setIsLiked(!isLiked);
      console.error("Error liking chapter:", error);
    } finally {
      reload();
    }
  };

  const share = async () => {
    const shareUrl = await api.get("/shareurl/like");
    console.log(shareUrl);
  };

  const download = async () => {
    showToast({
      title: "Download will be start Once the developer wrote the code",
    });
  };

  console.log(book, "this is the book")

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        onScrollEndDrag={snapToNearestState}
        onMomentumScrollEnd={snapToNearestState}
        style={styles.scrollView}
        scrollEventThrottle={16}
        scrollEnabled={!isLoading}
        showsVerticalScrollIndicator={false}>
        <View style={styles.falseHeight}></View>

        {/* Main Content */}
        <View style={styles.playerContainer}>
          <Animated.View style={[styles.pdfFrame, { opacity: cardOpacity }]}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=600",
              }}
              style={styles.pdfImage}
            />
          </Animated.View>

          {/* Book Details */}
          <View style={styles.bookDetails}>
            <Text style={styles.bookTitle}>{book?.title}</Text>

            <View style={styles.row}>
              <Text style={styles.bookAuthor}>{book?.author}</Text>
              <View style={styles.divider} />
              <Text style={styles.statItem}>{isLiked ? (book?.likes || 0) + 1 : book?.likes} likes</Text>
              <View style={styles.divider} />
              <Text style={styles.statItem}>
                {book?.comments.length} comments
              </Text>
            </View>

            {/* Controls Bar */}
            <View style={styles.controlStatsBar}>
              <View style={styles.leftControls}>
                <PopButton onPress={like}>
                  <ControlButton
                    icon="heart"
                    strokeWidth={isLiked ? 0 : 2}
                    filled={isLiked ? "#eb4040" : "none"}
                  />
                </PopButton>
                <PopButton onPress={() => setShowComments(true)}>
                  <ControlButton icon="message" />
                </PopButton>
                <PopButton onPress={share}>
                  <ControlButton icon="share" />
                </PopButton>
                <PopButton onPress={download}>
                  <ControlButton icon="download" />
                </PopButton>
              </View>
              <ControlButton icon="info" />
            </View>
          </View>
        </View>

        {/* Next Chapters */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Next Chapters</Text>
          </View>
          <View style={styles.booksGrid}>
            {/* Add your ContentCard components here */}
          </View>
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Next Chapters</Text>
          </View>
          <View style={styles.booksGrid}>
            {/* Add your ContentCard components here */}
          </View>
        </View>
      </Animated.ScrollView>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.morphFrame,
          {
            opacity: overlayOpacity,
            borderRadius,
            borderWidth: overlayBorderWidth,
            borderColor: "rgba(255,255,255,0.08)",
            transform: [{ translateX }, { translateY }, { scaleX }, { scaleY }],
          },
        ]}>
        {isLoading ? (
          <ActivityIndicator color={pallete.accent} />
        ) : (
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=600",
            }}
            style={styles.pdfImage}
          />
        )}
      </Animated.View>

      {isTocOpen && (
        <>
          <TouchableOpacity
            style={styles.tocBackdrop}
            onPress={closeToc}
            activeOpacity={1}
          />
          <Animated.View style={styles.tocSideSheet}>
            <Text style={styles.tocHeader}>TABLE OF CONTENTS</Text>
            <View style={styles.tocList}>
              {[
                "Introduction",
                "The Ego Illusion",
                "Social Conditioning",
                "Emotional Discipline",
              ].map((ch, i) => (
                <View key={i} style={styles.tocChip}>
                  <Text style={styles.chipName}>{ch}</Text>
                  <Text style={styles.chipPage}>
                    P. {String(10 + i * 12).padStart(2, "0")}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </>
      )}
      <CommentsDrawer
        visible={showComments}
        reload={fetchChapter}
        onClose={() => setShowComments(false)}
        chapterId={chapterId}
        initialComments={book?.comments ? book?.comments : []}
        commentsCount={45000}
      />
    </View>
  );
};

const ControlButton = ({
  icon,
  filled = "none",
  strokeWidth = 2,
}: {
  icon: string;
  filled?: string;
  strokeWidth?: number;
}) => (
  <View style={styles.controlItem}>
    <Svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill={filled}
      stroke="#9ca3af"
      strokeWidth={strokeWidth}>
      {icon === "heart" && (
        <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      )}
      {icon === "message" && (
        <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      )}
      {icon === "share" && (
        <>
          <Circle cx="18" cy="5" r="3" />
          <Circle cx="6" cy="12" r="3" />
          <Circle cx="18" cy="19" r="3" />
          <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </>
      )}
      {icon === "download" && (
        <>
          <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <Polyline points="7 10 12 15 17 10" />
          <Line x1="12" y1="15" x2="12" y2="3" />
        </>
      )}
    </Svg>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: pallete.bgmain,
    paddingTop: CONTAINER_PADDING_TOP,
  },
  scrollView: {
    marginTop: SCROLLVIEW_MARGIN_TOP,
  },
  falseHeight: {
    width: SCREEN_WIDTH,
    height: 100,
  },
  navClose: { padding: 8, borderRadius: 50 },
  playerContainer: { padding: PLAYER_CONTAINER_PADDING },
  pdfFrame: {
    width: "100%",
    aspectRatio: 4 / 5,
    backgroundColor: "#12121c",
    borderRadius: 12,
    marginTop: PDF_FRAME_MARGIN_TOP,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  pdfImage: { width: "100%", height: "100%", resizeMode: "cover" },
  // Absolutely-positioned overlay used while morphing from fullscreen -> card.
  morphFrame: {
    position: "absolute",
    backgroundColor: "#12121c",
    overflow: "hidden",
    zIndex: 400,
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  bookDetails: { marginTop: 16 },
  bookTitle: {
    fontFamily: "Playfair Display",
    fontSize: 22,
    fontWeight: "600",
    color: pallete.textwhite,
    marginBottom: 6,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  bookAuthor: { fontSize: 13, color: pallete.textgray },
  divider: {
    width: 4,
    height: 4,
    backgroundColor: pallete.textgray,
    borderRadius: 50,
    opacity: 0.4,
  },
  statItem: { fontSize: 12, fontWeight: "600", color: pallete.accent },
  controlStatsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  leftControls: { flexDirection: "row", gap: 24 },
  controlItem: { padding: 4 },
  section: { marginBottom: 40 },
  sectionHeader: { paddingHorizontal: 24, marginBottom: 12 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    color: "#e5e7eb",
  },
  booksGrid: {
    paddingHorizontal: 24,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },

  // TOC
  tocBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    zIndex: 550,
  },
  tocSideSheet: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: "78%",
    maxWidth: 340,
    backgroundColor: "rgba(15,15,15,0.98)",
    zIndex: 600,
    padding: 24,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.1)",
  },
  tocHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: pallete.accent,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 20,
  },
  tocList: { flex: 1, gap: 12 },
  tocChip: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chipName: { color: "#e5e7eb", fontSize: 14, fontWeight: "500" },
  chipPage: {
    fontSize: 12,
    fontWeight: "700",
    color: pallete.accent,
    backgroundColor: "rgba(1,121,111,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
});

export default BookReaderScreen;
