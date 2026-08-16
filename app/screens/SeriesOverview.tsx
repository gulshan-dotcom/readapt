import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  FlatList,
} from "react-native";
import React, { useEffect, useState } from "react";
import Svg, { Path, Circle, Polyline, Line, G } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { ISeries, ISeriesContent } from "../../types/Series";
import { IChapter } from "../../types/Chapter";
import PopButton from "../../components/props/PopButton";
import useAuth from "../../hooks/useAuth";
import { api } from "../../lib/api";
import { useToast } from "../../hooks/useToast";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
// import {runOnJS} from 'react-native-worklets'
import pallete from "../../lib/Colors";
import ContentCard from "../../components/props/ContentCard";
import { useModal } from "../../hooks/useModal";
import { IUser } from "../../types/User";
import { IRecentRead } from "../../types/Storage";
import { useUser } from "../../hooks/useUser";
import Carousel from "react-native-reanimated-carousel";
import QuestionCard from "../../components/props/QuestionCard";
import { IQuestion } from "../../types/Question";
import CommentsDrawer from "../../components/props/Comments";

const SHEET_HEIGHT = 320;

interface DetailsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  data?: {
    chapters?: ISeriesContent[];
    published?: string;
    description?: string;
  };
}

const DetailsPanel = ({ isOpen, onClose, data }: DetailsPanelProps) => {
  const translateY = useSharedValue(SHEET_HEIGHT);

  useEffect(() => {
    if (isOpen) {
      translateY.value = withSpring(0, { damping: 100 });
    } else {
      translateY.value = withTiming(SHEET_HEIGHT);
    }
  }, [isOpen]);

  const handleClose = () => {
    translateY.value = withTiming(SHEET_HEIGHT, {}, () => {
      runOnJS(onClose)();
    });
  };

  const dragGesture = Gesture.Pan()
    .onChange((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 80 || event.velocityY > 500) {
        runOnJS(handleClose)();
      } else {
        translateY.value = withSpring(0, { damping: 105 });
      }
    // ✅ Safely dispatch execution back to the JS thread
    });

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!isOpen) return null;
  type ChapterItem = Extract<ISeriesContent, { contentModel: "Chapter" }>;

  const totalChapters: ChapterItem[] =
    (data?.chapters?.filter(
      (item): item is ChapterItem => item.contentModel === "Chapter",
    ) as ChapterItem[]) ?? [];

  const totalPdfChapters = totalChapters?.filter(
    (item) => item.content.type === "pdf",
  );
  const totalAudioChapters = totalChapters?.filter(
    (item) => item.content.type === "audio",
  );

  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFill}>
      <TouchableOpacity
        style={panelStyles.backdrop}
        activeOpacity={1}
        onPress={handleClose}
      />

      <GestureDetector gesture={dragGesture}>
        <Animated.View style={[panelStyles.detailsPanel, animatedStyles]}>
          <View style={panelStyles.dragHandle} />

          {/* Stats Grid Row */}
          <View style={panelStyles.panelSRow}>
            <TouchableOpacity activeOpacity={0.8} style={panelStyles.pItem}>
              <Text style={panelStyles.pVal}>{totalChapters?.length}</Text>
              <Text style={panelStyles.pLabel}>Chapters</Text>
            </TouchableOpacity>

            <View style={panelStyles.pDivider} />

            <TouchableOpacity activeOpacity={0.8} style={panelStyles.pItem}>
              <Text style={panelStyles.pVal}>{totalPdfChapters?.length}</Text>
              <Text style={panelStyles.pLabel}>PDFs</Text>
            </TouchableOpacity>

            <View style={panelStyles.pDivider} />

            <TouchableOpacity activeOpacity={0.8} style={panelStyles.pItem}>
              <Text style={panelStyles.pVal}>{totalAudioChapters?.length}</Text>
              <Text style={panelStyles.pLabel}>Audios</Text>
            </TouchableOpacity>

            <View style={panelStyles.pDivider} />

            <TouchableOpacity activeOpacity={0.8} style={panelStyles.pItem}>
              <Text style={panelStyles.pVal}>{data?.published}</Text>
              <Text style={panelStyles.pLabel}>Published</Text>
            </TouchableOpacity>
          </View>

          {/* Body Block */}
          <TouchableOpacity activeOpacity={0.9}>
            <Text style={panelStyles.panelDescription}>
              {data?.description ??
                "This comprehensive series covers everything from the fundamentals of equity to advanced technical analysis. Designed for beginners and intermediate traders, this course provides actionable insights into market trends, risk management strategies, and IPO analysis. Join the community to master the art of trading."}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const panelStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  detailsPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: pallete.panelbg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: pallete.paddingside,
    paddingTop: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 20,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
    alignSelf: "center",
    position: "absolute",
    top: 10,
  },
  panelSRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    paddingBottom: 16,
  },
  pItem: {
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  pVal: {
    fontSize: 14,
    fontWeight: "700",
    color: pallete.textwhite,
  },
  pLabel: {
    fontSize: 10,
    color: pallete.textgray,
    textTransform: "uppercase",
  },
  pDivider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  panelDescription: {
    fontSize: 13,
    lineHeight: 20.8,
    color: "#d1d5db",
  },
});

interface SeriesOverviewProps {
  route: {
    params: {
      seriesId?: string;
    };
  };
}

const SeriesOverview = ({ route }: SeriesOverviewProps) => {
  const [accesstoken] = useAuth();
  const { showToast } = useToast();
  const [seriesData, setSeriesData] = useState<ISeries | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { showModal } = useModal();
  const [completeChapters, setCompleteChapters] = useState(0);
  const [accessToken] = useAuth();
  const { user, reload } = useUser();
  const [isJoined, setIsJoined] = useState(
    user?.joinedSeries === route.params?.seriesId,
  );
  const [commentedQueId, setCommentedQueId] = useState("");

  const [showComments, setShowComments] = useState(false);

  const getSeries = async () => {
    if (accesstoken) {
      try {
        const { data } = await api.get(`/series/${route.params?.seriesId}`, {
          headers: {
            Authorization: `Bearer ${accesstoken}`,
          },
        });
        const series: ISeries = data.data;
        setSeriesData(series);
      } catch (error) {
        console.error("Error fetching series data in series overview:", error);
        showToast({ title: "Error" });
      }
    }
  };

  useEffect(() => {
    if (seriesData) return;
    getSeries();
  }, [accesstoken, route.params?.seriesId, showToast]);

  useEffect(() => {
    setIsJoined(user?.joinedSeries === seriesData?._id);
  }, [user?.joinedSeries, seriesData?._id]);

  const seriesTitle = seriesData?.title;
  const joinedCount = seriesData?.joinedBy.length || 0;
  const coverUrl = seriesData?.cover;

  const totalChapters = seriesData?.chapters?.length || 48;
  const ChapterIdsInSeries = seriesData?.chapters?.map(
    (item) => item.content._id,
  );

  useEffect(() => {
    if (!seriesData?.chapters) return;
    const getJoinedSeriesData = async () => {
      const readChapters = await AsyncStorage.getItem("recentReads");
      if (!readChapters) return;
      const recentReads: IRecentRead[] = JSON.parse(readChapters);
      const json: IChapter[] = recentReads.map(
        (recentRead) => recentRead.content,
      );
      const readChaptersInSeries = json.filter((readChapter) =>
        ChapterIdsInSeries?.includes(readChapter._id),
      );
      setCompleteChapters(readChaptersInSeries.length);
    };
    getJoinedSeriesData();
  }, [seriesData?.chapters]);

  const joinSeries = async () => {
    try {
      const data = await api.post(
        "/series/join",
        {
          seriesId: seriesData?._id,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!data.data.success) {
        setIsJoined(false);
        showToast({ title: "something went wrong" });
        return;
      }
      reload();
    } catch (err) {
      setIsJoined(false);
      console.error(err);
      showToast({ title: "something went wrong" });
    } finally {
      reload();
      getSeries();
      setIsJoined(true);
    }
    return;
  };

  const exitSeries = async () => {
    try {
      const data = await api.post(
        "/series/exit",
        {
          seriesId: seriesData?._id,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      if (!data.data.success) {
        setIsJoined(true);
        showToast({ title: data.data.message || "something went wrong" });
        return;
      }
      reload();
    } catch (err) {
      setIsJoined(false);
      console.error("exit error", err);
      showToast({ title: "something went wrong" });
    } finally {
      reload();
      getSeries();
      setIsJoined(false);
    }
    return;
  };

  if (!seriesData) {
    return (
      <View style={styles.body}>
        <Text style={styles.cardTitle}>Series data not available</Text>
      </View>
    );
  }

  const renderQuestionCard = ({ item }: { item: ISeriesContent }) => {
    if (item.contentModel === "Question" && typeof item.content !== "string") {
      const questionData = item.content as IQuestion;
      return (
        <QuestionCard
          onCommentClick={() => {
            setCommentedQueId(questionData._id);
            setShowComments(true);
          }}
          key={questionData._id}
          question={questionData}
        />
      );
    }
  };

  const renderContentCard = ({ item }: { item: any }) => {
    const chapterData = item.content as IChapter;
    return <ContentCard key={chapterData._id} book={chapterData} />;
  };

  return (
    <View style={styles.body}>
      <ScrollView style={styles.body} bounces={true}>
        <View style={styles.seriesHero}>
          <Image
            source={{ uri: coverUrl }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(5, 5, 5, 0.4)", pallete.bgmain]}
            locations={[0, 0.6, 1]}
            style={styles.heroOverlay}
          />
        </View>

        <View style={styles.seriesInfo}>
          <Text style={styles.seriesTitle}>{seriesTitle}</Text>
          <Text style={styles.seriesAuthor}>
            {seriesData?.chapters[0].content.author}
          </Text>

          {/* Scalable Badge using PopButton */}
          <PopButton
            styles={styles.joinedBadge}
            activeStyles={styles.joinedBadgeActive}>
            <Svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke={pallete.accent}
              strokeWidth="2">
              <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <Circle cx="9" cy="7" r="4" />
              <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </Svg>
            <Text style={styles.badgeText}>
              {joinedCount}{" "}
              <Text style={{ color: pallete.textgray }}>Joined</Text>
            </Text>
          </PopButton>
        </View>

        {/* Dynamic Progress Box Framework Layout Section */}
        <PopButton styles={styles.progressBox}>
          <Text style={styles.progressText}>
            {completeChapters} of {totalChapters} chapters complete
          </Text>

          <View style={styles.progressBarContainer}>
            {/* Progress Bar Track Layer */}
            <View style={styles.pBarTrack}>
              <View
                style={[
                  styles.pBarFill,
                  { width: `${(completeChapters / totalChapters) * 100}%` },
                ]}
              />
            </View>

            {/* Inline Micro Interaction Actions Control Stack */}
            <View style={styles.actionIcons}>
              {/* Action 2: Meta Info Description Sheet Trigger */}
              <PopButton
                styles={styles.actBtn}
                onPress={() => {
                  setIsDetailOpen(true);
                }}>
                <Svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={pallete.textgray}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <Circle cx="12" cy="12" r="10" />
                  <Line x1="12" y1="16" x2="12" y2="12" />
                  <Line x1="12" y1="8" x2="12.01" y2="8" />
                </Svg>
              </PopButton>

              {/* Action 3: Join Confirmation Overlay Trigger */}
              {user?.joinedSeries === seriesData?._id ? (
                <PopButton
                  styles={[styles.actBtn, styles.exitBtn]}
                  onPress={() =>
                    showModal({
                      title: "Are you sure to exit from this series?",
                      onConfirm: exitSeries,
                    })
                  }>
                  <Svg fill="none" width="18" height="18" viewBox="0 0 16 16" >
                    <G id="SVGRepo_bgCarrier" strokeWidth="0"></G>
                    <G
                      id="SVGRepo_tracerCarrier"
                      strokeLinecap="round"
                      strokeLinejoin="round"></G>
                    <G id="SVGRepo_iconCarrier">
                      <G fill={pallete.false}>
                        <Path d="M1 8a6 6 0 018.514-5.45.75.75 0 01-.629 1.363 4.5 4.5 0 100 8.175.75.75 0 11.63 1.361A6 6 0 011 8z"></Path>
                        <Path d="M11.245 4.695a.75.75 0 00-.05 1.06l1.36 1.495H6.75a.75.75 0 000 1.5h5.805l-1.36 1.495a.75.75 0 001.11 1.01l2.5-2.75a.748.748 0 00-.002-1.012l-2.498-2.748a.75.75 0 00-1.06-.05z"></Path>
                      </G>
                    </G>
                  </Svg>
                </PopButton>
              ) : (
                <PopButton
                  styles={[styles.actBtn, styles.joinBtn]}
                  onPress={() =>
                    showModal({
                      title: "Are you sure to join this series?",
                      onConfirm: joinSeries,
                    })
                  }>
                  <Svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={pallete.true}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <Path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <Polyline points="10 17 15 12 10 7" />
                    <Line x1="15" y1="12" x2="3" y2="12" />
                  </Svg>
                </PopButton>
              )}
            </View>
          </View>
        </PopButton>

        <View style={styles.pollSection}>
          <Carousel
            loop={false}
            width={width}
            height={510}
            style={{
              width,
            }}
            data={
              seriesData?.chapters?.filter(
                (item) => item.contentModel === "Question",
              ) || []
            }
            pagingEnabled
            snapEnabled
            mode="parallax"
            onConfigurePanGesture={(gestureChain) =>
              gestureChain.activeOffsetX([-15, 15]).failOffsetY([-10, 10])
            }
            modeConfig={{
              parallaxScrollingScale: 0.92,
              parallaxScrollingOffset: 0,
            }}
            renderItem={({ item }) => (
              <View
                style={{
                  width: (width / 100) * 85,
                  height: "100%",
                  justifyContent: "center",
                  alignItems: "center",
                  // backgroundColor: "blue"
                }}>
                <View
                  style={{
                    width: (width / 100) * 85, // Constrain visual asset to strict card width
                    height: "100%",
                    // backgroundColor: "red"
                    // padding: SIDE_PADDING,
                  }}>
                  {renderQuestionCard({ item })}
                </View>
              </View>
            )}
          />
        </View>

        {/* Grid Iteration Viewport Mapping Blocks Context */}
        <View style={styles.gridSection}>
          <View style={styles.booksGrid}>
            <FlatList
              data={
                seriesData?.chapters?.filter(
                  (item) => item.contentModel === "Chapter",
                ) || []
              }
              renderItem={renderContentCard}
              keyExtractor={(item) => item.content._id}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={{
                justifyContent: "space-between",
                paddingHorizontal: 5,
              }}
              contentContainerStyle={{
                paddingHorizontal: 0,
              }}
            />
          </View>
        </View>
      </ScrollView>
      <DetailsPanel
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
        }}
        data={{
          chapters: seriesData?.chapters,
          published: new Date(seriesData.createdAt).toLocaleDateString(),
          description: seriesData?.description,
        }}
      />
      <CommentsDrawer
        visible={showComments}
        reload={getSeries}
        onClose={() => setShowComments(false)}
        chapterId={commentedQueId}
        isQuestion={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: pallete.bgmain,
  },
  seriesHero: {
    marginTop: 70,
    width: "100%",
    height: 220,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  seriesInfo: {
    paddingHorizontal: pallete.paddingside,
    marginTop: -20,
    position: "relative",
    zIndex: 10,
  },
  seriesTitle: {
    fontFamily: "Bebas Neue",
    fontSize: 36,
    lineHeight: 36,
    color: pallete.textwhite,
    marginBottom: 4,
  },
  seriesAuthor: {
    color: pallete.textgray,
    fontSize: 14,
    marginBottom: 12,
  },
  joinedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: "flex-start",
    marginBottom: 24,
  },
  joinedBadgeActive: {
    backgroundColor: "#ffffff1f",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#e5e7eb",
  },
  pollSection: {
    marginBottom: 20,
    overflow: "hidden",
  },
  pollSlider: {
    display: "flex",
    gap: 16,
    paddingHorizontal: pallete.paddingside,
    paddingBottom: 10,
  },
  progressBox: {
    backgroundColor: pallete.bgcard,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: pallete.paddingside,
    marginBottom: 30,
  },
  progressText: {
    fontSize: 14,
    color: pallete.textwhite,
    marginBottom: 12,
    fontWeight: "500",
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  pBarTrack: {
    flex: 1,
    height: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    overflow: "hidden",
  },
  pBarFill: {
    height: "100%",
    backgroundColor: pallete.accent,
    borderRadius: 10,
  },
  actionIcons: {
    flexDirection: "row",
    gap: 10,
  },
  actBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  joinBtn: {
    backgroundColor: "rgba(113, 251, 182, 0.2)",
    borderColor: pallete.true,
  },
  exitBtn: {
    backgroundColor: "rgba(251, 113, 133, 0.2)",
    borderColor: pallete.false,
  },
  gridSection: {
    paddingHorizontal: 4,
    marginBottom: 40,
  },
  booksGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    gap: 16,
  },
  // Sub-content layout components metrics configurations
  contentCardFallback: {
    width: (Dimensions.get("window").width - pallete.paddingside * 2 - 16) / 2,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  cardImage: {
    width: "100%",
    height: 140,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#222",
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: pallete.textwhite,
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 10,
    color: pallete.accent,
    textTransform: "uppercase",
    fontWeight: "700",
  },
});

export default SeriesOverview;
