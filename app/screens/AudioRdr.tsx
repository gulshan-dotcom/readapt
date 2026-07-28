import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  Animated,
  Dimensions,
  StatusBar,
  Modal,
} from "react-native";
import Svg, { Path, Line, Circle, Polyline } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import pallete from "../../lib/Colors";
import useAuth from "../../hooks/useAuth";
import { IChapter } from "../../types/Chapter";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Colors matching the HTML exactly
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

type Props = {
  route: {
    params: {
      bookId: string;
    };
  };
  navigation: any;
};

const AudioPlayerScreen = ({ route }: Props) => {
  const readtill = "40";
  const total = "60";
  const progress =
    total && readtill ? (parseFloat(readtill) / parseFloat(total)) * 100 : 20;
  const navigation = useNavigation();
  const [accessToken] = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [speed, setSpeed] = useState("1.0x");

  const [book, setBook] = useState<IChapter | null>();
  const [isLoading, setIsLoading] = useState(true);

  const chapterId = route.params.bookId;

  useEffect(() => {
    const fetchChapter = async () => {
      setBook({
        title: "listen to me",
        comments: 544,
        likes: 333,
        _id: "something34444",
        type: "audio",
        author: "admin",
        media: "google.com",
        for: 1,
        isTrending: true,
        cover:
          "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=600",
        category: "dark",
        total: 340,
        isDownloadable: false,
        toc: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      // const chapter = await api.get(`/chapter/${chapterId}`, {
      //   headers: {
      //     Authorization: `Bearer ${accessToken}`,
      //   },
      // });

      // console.log(chapter.status, "fatch status")

      // setBook(chapter.data.data);
      setIsLoading(false);
    };
    fetchChapter();
  }, [accessToken]);

  const playScale = useRef(new Animated.Value(1)).current;

  const handlePlayPressIn = () => {
    Animated.spring(playScale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 30,
    }).start();
  };

  const handlePlayPressOut = () => {
    Animated.spring(playScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
    }).start();
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  // ─── Progress Bar Component ───────────────────────────────────
  const ProgressBar = ({ dark = false }: { dark?: boolean }) => (
    <View style={styles.timelineContainer}>
      <View style={styles.progressBarWrapper}>
        <View style={styles.progressBgLine} />
        <View style={[styles.progressFillLine, { width: `${progress}%` }]} />
        <View style={[styles.progressHandleNode, { left: `${progress}%` }]} />
      </View>
      <View style={styles.timelineTimeRow}>
        <Text style={styles.timeText}>
          {Math.floor(parseFloat(readtill) / 60) +
            ":" +
            (parseFloat(readtill) % 60)}
        </Text>
        <Text style={styles.timeText}>{total}</Text>
      </View>
    </View>
  );

  // ─── Playback Buttons ────────────────────────────────────────
  const PlaybackButtons = () => (
    <View style={styles.playbackButtonsRow}>
      <Pressable
        style={[
          styles.mediaBtn,
          styles.circleSkipBtn,
          styles.backwardDisabled,
        ]}>
        <Svg width={20} height={20} viewBox="0 0 24 24">
          <Path
            d="M6 19h2V5H6v14zm3.5-7L18 19V5l-8.5 7z"
            fill="rgba(156,163,175,0.3)"
          />
        </Svg>
      </Pressable>

      <Pressable
        onPressIn={handlePlayPressIn}
        onPressOut={handlePlayPressOut}
        onPress={togglePlay}>
        <Animated.View
          style={[
            styles.mediaBtn,
            styles.mainPlayBtn,
            { transform: [{ scale: playScale }] },
          ]}>
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path
              d={
                isPlaying ? "M6 19h4V5H6v14zm8-14v14h4V5h-4z" : "M8 5v14l11-7z"
              }
              fill={colors.ctlIcon}
            />
          </Svg>
          <Text style={styles.playBtnText}>{isPlaying ? "Pause" : "Play"}</Text>
        </Animated.View>
      </Pressable>

      <Pressable style={[styles.mediaBtn, styles.circleSkipBtn]}>
        <Svg width={20} height={20} viewBox="0 0 24 24">
          <Path d="M5 4v16l11-8L5 4zm11 1h2v14h-2V5z" fill={colors.ctlIcon} />
        </Svg>
      </Pressable>
    </View>
  );

  // ─── Control Icon Button ─────────────────────────────────────
  const ControlItem = ({
    children,
    onPress,
  }: {
    children: React.ReactNode;
    onPress?: () => void;
  }) => (
    <Pressable style={styles.controlItem} onPress={onPress}>
      {children}
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* ── Player Container ─────────────────────────────────── */}
        <View style={styles.playerContainer}>
          {/* Cover + Overlay Controls */}
          <Pressable onPress={() => setShowFullscreen(true)}>
            <View style={styles.audioImg}>
              <Image source={{ uri: book?.cover }} style={styles.coverImage} />

              <View style={styles.mediaControlsOverlay}>
                <ProgressBar />
                <PlaybackButtons />
              </View>
            </View>
          </Pressable>

          {/* Book Details */}
          <View style={styles.bookDetails}>
            <Text style={styles.bookTitle}>{book?.title}</Text>

            <View style={styles.row}>
              <Text style={styles.bookAuthor}>by {book?.author}</Text>
              <View style={styles.divider} />
              <Text style={styles.statItem}>{book?.likes}</Text>
              <View style={styles.divider} />
              <Text style={styles.statItem}>{book?.comments}</Text>
            </View>

            {/* Control Stats Bar */}
            <View style={styles.controlStatsBar}>
              <View style={styles.leftControlsGroup}>
                <ControlItem>
                  <Svg
                    width={20}
                    height={20}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={colors.textGray}
                    strokeWidth="2">
                    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </Svg>
                </ControlItem>
                <ControlItem>
                  <Svg
                    width={20}
                    height={20}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={colors.textGray}
                    strokeWidth="2">
                    <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </Svg>
                </ControlItem>
                <ControlItem>
                  <Svg
                    width={20}
                    height={20}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={colors.textGray}
                    strokeWidth="2">
                    <Circle cx="18" cy="5" r="3" />
                    <Circle cx="6" cy="12" r="3" />
                    <Circle cx="18" cy="19" r="3" />
                    <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </Svg>
                </ControlItem>
                <ControlItem>
                  <Svg
                    width={20}
                    height={20}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={colors.textGray}
                    strokeWidth="2">
                    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <Polyline points="7 10 12 15 17 10" />
                    <Line x1="12" y1="15" x2="12" y2="3" />
                  </Svg>
                </ControlItem>
              </View>

              <ControlItem>
                <Svg
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={colors.textGray}
                  strokeWidth="2">
                  <Circle cx="12" cy="12" r="10" />
                  <Line x1="12" y1="16" x2="12" y2="12" />
                  <Line x1="12" y1="8" x2="12.01" y2="8" />
                </Svg>
              </ControlItem>
            </View>

            {/* Test Knowledge Button */}
            <Pressable style={styles.goBtn}>
              <Svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2.5">
                <Path d="M9 11l3 3L22 4" />
                <Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </Svg>
              <Text style={styles.goBtnText}>Test Your Knowledge</Text>
            </Pressable>
          </View>
        </View>

        {/* ── Next Chapters ────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Next Chapters</Text>
          </View>

          <View style={styles.chapterQueue}>
            {/* Queue Item 1 */}
            <View style={styles.queueItem}>
              <View style={styles.queueWrapper}>
                <View style={styles.queueThumbContainer}>
                  <Image
                    source={{
                      uri: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400",
                    }}
                    style={styles.queueThumb}
                  />
                  <View
                    style={[
                      styles.queueCardBadge,
                      { backgroundColor: colors.accent },
                    ]}>
                    <Text style={styles.badgeText}>Book</Text>
                  </View>
                </View>
                <View style={styles.queueInfo}>
                  <Text style={styles.queueTitle} numberOfLines={1}>
                    CH-2 How to be Mature
                  </Text>
                  <Text style={styles.queueAuthor}>Naveen hada</Text>
                  <Text style={styles.pages}>4 pages</Text>
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
            </View>

            {/* Queue Item 2 */}
            <View style={styles.queueItem}>
              <View style={styles.queueWrapper}>
                <View style={styles.queueThumbContainer}>
                  <Image
                    source={{
                      uri: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400",
                    }}
                    style={styles.queueThumb}
                  />
                  <View
                    style={[
                      styles.queueCardBadge,
                      { backgroundColor: "#60a5fa" },
                    ]}>
                    <Text style={styles.badgeText}>Audio</Text>
                  </View>
                </View>
                <View style={styles.queueInfo}>
                  <Text style={styles.queueTitle} numberOfLines={1}>
                    CH-3 How to be mature
                  </Text>
                  <Text style={styles.queueAuthor}>Naveen hada</Text>
                  <Text style={styles.pages}>30:45</Text>
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
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Fullscreen Overlay ─────────────────────────────────── */}
      <Modal visible={showFullscreen} animationType="fade" statusBarTranslucent>
        <View style={styles.fullscreenOverlay}>
          <Pressable
            style={styles.fsCloseTrigger}
            onPress={() => setShowFullscreen(false)}>
            <Svg
              width={22}
              height={24}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.5">
              <Line x1="18" y1="6" x2="6" y2="18" />
              <Line x1="6" y1="6" x2="18" y2="18" />
            </Svg>
          </Pressable>

          <Pressable
            style={styles.fsTocTrigger}
            onPress={() => setShowToc(true)}>
            <Svg
              width={24}
              height={24}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2">
              <Line x1="8" y1="6" x2="21" y2="6" />
              <Line x1="8" y1="12" x2="21" y2="12" />
              <Line x1="8" y1="18" x2="21" y2="18" />
              <Circle cx="3" cy="6" r="1" fill="#fff" />
              <Path d="M3 10 v4" stroke="#fff" />
              <Circle cx="3" cy="18" r="1" fill="#fff" />
            </Svg>
          </Pressable>

          <View style={styles.fullscreenImage}>
            <Image source={{ uri: book?.cover }} style={styles.fsCoverImg} />
          </View>

          <View style={styles.fullscreenControls}>
            <ProgressBar />
            <PlaybackButtons />

            <View style={styles.fsUtilitiesRow}>
              <Pressable
                style={styles.speedBtn}
                onPress={() => setSpeed(speed === "1.0x" ? "1.5x" : "1.0x")}>
                <Text style={styles.speedBtnText}>{speed}</Text>
              </Pressable>

              <Pressable
                style={styles.lyricsBtn}
                onPress={() => {
                  setShowFullscreen(false);
                  setShowLyrics(true);
                }}>
                <Svg
                  width={24}
                  height={24}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={colors.textGray}
                  strokeWidth="2">
                  <Line x1="4" y1="6" x2="20" y2="6" />
                  <Line x1="4" y1="12" x2="20" y2="12" />
                  <Line x1="4" y1="18" x2="14" y2="18" />
                </Svg>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Lyrics Panel ───────────────────────────────────────── */}
      <Modal visible={showLyrics} animationType="slide" statusBarTranslucent>
        <View style={styles.lyricsPanelSheet}>
          <Pressable
            style={styles.fsCloseTrigger}
            onPress={() => setShowLyrics(false)}>
            <Svg
              width={22}
              height={24}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.5">
              <Line x1="18" y1="6" x2="6" y2="18" />
              <Line x1="6" y1="6" x2="18" y2="18" />
            </Svg>
          </Pressable>

          <ScrollView
            style={styles.lyricsScroll}
            showsVerticalScrollIndicator={false}>
            {[
              "You let your feet run wild, time has come as we all oh go down",
              "Oh, 'cause they will run you down, down till you fall",
              "They will run you down, down till you go",
              "Yeah, so you can't crawl no more",
              "Say way down we go, ooh",
              "Yeah, so you can't crawl no more",
              "and way down we go oh oh oh",
            ].map((line, i) => (
              <Text
                key={i}
                style={[styles.lyricsLine, i === 1 && styles.lyricsLineActive]}>
                {line}
              </Text>
            ))}
          </ScrollView>

          <View style={styles.fullscreenControls}>
            <ProgressBar />
            <PlaybackButtons />
            <View style={styles.fsUtilitiesRow}>
              <Pressable style={styles.speedBtn}>
                <Text style={styles.speedBtnText}>{speed}</Text>
              </Pressable>
              <Pressable
                style={styles.lyricsBtn}
                onPress={() => setShowLyrics(false)}>
                <Svg
                  width={22}
                  height={22}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={colors.textGray}
                  strokeWidth="2.5">
                  <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </Svg>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showToc} transparent animationType="fade">
        <Pressable
          style={styles.tocBackdrop}
          onPress={() => setShowToc(false)}
        />
        <View style={styles.tocSideSheet}>
          <Text style={styles.tocHeader}>TABLE OF CONTENTS</Text>
          <View style={styles.tocChipsList}>
            {[
              { name: "Introduction", duration: "03:14" },
              { name: "The Ego Illusion", duration: "3:18" },
              { name: "Social Conditioning", duration: "4:22" },
              { name: "Emotional Discipline", duration: "5:01" },
            ].map((ch, i) => (
              <Pressable key={i} style={styles.tocChipCard}>
                <Text style={styles.chipChapterName}>{ch.name}</Text>
                <Text style={styles.chipDurationIndex}>{ch.duration}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgMain,
    paddingTop: 95,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  // Player
  playerContainer: {
    padding: 16,
    paddingHorizontal: 24,
    gap: 16,
  },
  audioImg: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#12121c",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  coverImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  mediaControlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    padding: 20,
    // Gradient simulation
    backgroundColor: "rgba(5, 3, 10, 0.75)",
  },

  // Timeline
  timelineContainer: {
    width: "100%",
    marginBottom: 14,
  },
  progressBarWrapper: {
    height: 20,
    justifyContent: "center",
  },
  progressBgLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
  },
  progressFillLine: {
    position: "absolute",
    left: 0,
    height: 4,
    backgroundColor: colors.ctlBg,
    borderRadius: 2,
  },
  progressHandleNode: {
    position: "absolute",
    width: 4,
    height: 14,
    backgroundColor: colors.ctlBg,
    borderRadius: 2,
    marginLeft: -2,
  },
  timelineTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textGray,
  },

  // Playback Buttons
  playbackButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    height: 60,
  },
  mediaBtn: {
    backgroundColor: colors.ctlBg,
    alignItems: "center",
    justifyContent: "center",
  },
  circleSkipBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  backwardDisabled: {
    backgroundColor: "rgba(156, 163, 175, 0.1)",
  },
  mainPlayBtn: {
    width: 130,
    height: 52,
    borderRadius: 26,
    flexDirection: "row",
    gap: 8,
  },
  playBtnText: {
    fontWeight: "700",
    fontSize: 15,
    color: colors.ctlIcon,
  },

  // Book Details
  bookDetails: {
    marginTop: 4,
  },
  bookTitle: {
    fontFamily: "Playfair Display",
    fontSize: 22,
    fontWeight: "600",
    color: colors.textWhite,
    marginBottom: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  bookAuthor: {
    fontSize: 13,
    color: colors.textGray,
  },
  divider: {
    width: 3,
    height: 3,
    backgroundColor: colors.textGray,
    borderRadius: 50,
    opacity: 0.4,
  },
  statItem: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.accent,
  },

  // Control Stats Bar
  controlStatsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 20,
  },
  leftControlsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  controlItem: {
    padding: 4,
  },

  // Go Button
  goBtn: {
    width: "100%",
    padding: 16,
    backgroundColor: colors.accent,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 4,
  },
  goBtnText: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // Section
  section: {
    marginBottom: 40,
  },
  sectionHeader: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    color: "#e5e7eb",
  },

  // Chapter Queue
  chapterQueue: {
    paddingHorizontal: 24,
    gap: 12,
  },
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

  // Fullscreen
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  fsCloseTrigger: {
    position: "absolute",
    top: 50,
    left: 24,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 50,
    padding: 10,
    zIndex: 10,
  },
  fsTocTrigger: {
    position: "absolute",
    top: 50,
    right: 24,
    backgroundColor: "rgba(5,5,5,0.9)",
    borderRadius: 50,
    padding: 10,
    zIndex: 10,
  },
  fullscreenImage: {
    width: "100%",
    maxWidth: 320,
    aspectRatio: 1,
    alignSelf: "center",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 20,
  },
  fsCoverImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  fullscreenControls: {
    width: "100%",
    marginTop: "auto",
    paddingBottom: 10,
  },
  fsUtilitiesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    marginTop: 20,
  },
  speedBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    minWidth: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  speedBtnText: {
    color: colors.textGray,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  lyricsBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  // Lyrics
  lyricsPanelSheet: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  lyricsScroll: {
    flex: 1,
    paddingTop: 10,
  },
  lyricsLine: {
    fontSize: 24,
    fontWeight: "700",
    color: "rgba(255,255,255,0.25)",
    lineHeight: 34,
    marginBottom: 28,
  },
  lyricsLineActive: {
    color: "#ffffff",
  },

  // TOC
  tocBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  tocSideSheet: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: "75%",
    maxWidth: 320,
    backgroundColor: "rgba(15,15,15,0.98)",
    padding: 24,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.1)",
  },
  tocHeader: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.accent,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    marginBottom: 20,
  },
  tocChipsList: {
    gap: 10,
  },
  tocChipCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chipChapterName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#e5e7eb",
  },
  chipDurationIndex: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.accent,
    backgroundColor: "rgba(1,121,111,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
});

export default AudioPlayerScreen;
