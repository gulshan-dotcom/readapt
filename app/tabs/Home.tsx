import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Dimensions } from "react-native";
import pallete from "../../lib/Colors";
import useAuth from "../../hooks/useAuth";
import Carousel from "react-native-reanimated-carousel";
import ContentCard from "../../components/props/ContentCard";
import SeriesCard from "../../components/props/SeriesCard";
import Svg, { Path, Rect, Line } from "react-native-svg";
import { api } from "../../lib/api";
import ChapterCardSkelly from "../../components/props/ChapterCardSkelly";
import SeriesCardSkelly from "../../components/props/SeriesCardSkelly";
import { ISeries } from "../../types/Series";
import { IRecentRead } from "../../types/Storage";
import { IChapter } from "../../types/Chapter";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "../../hooks/useUser";
import { useToast } from "../../hooks/useToast";
import PopButton from "../../components/props/PopButton";
import ContentProgressSkelly from "../../components/props/ProgressCardSkelly";
import Contentprogress from "../../components/props/ContentProgress";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../components/nav/MainNavigation";

const AvailableIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Rect x="3" y="3" width="7" height="7" rx="1.5" fill="#FFCA00" />
    <Rect x="14" y="3" width="7" height="7" rx="1.5" fill="#FFCA00" />
    <Rect x="3" y="14" width="7" height="7" rx="1.5" fill="#FFCA00" />
    <Rect x="14" y="14" width="7" height="7" rx="1.5" fill="#FFCA00" />
  </Svg>
);

const SeriesIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Line
      x1="8"
      y1="6"
      x2="21"
      y2="6"
      stroke="#01796F"
      strokeWidth={2.5}
      strokeLinecap="round"
    />
    <Line
      x1="8"
      y1="12"
      x2="21"
      y2="12"
      stroke="#01796F"
      strokeWidth={2.5}
      strokeLinecap="round"
    />
    <Line
      x1="8"
      y1="18"
      x2="21"
      y2="18"
      stroke="#01796F"
      strokeWidth={2.5}
      strokeLinecap="round"
    />

    <Line
      x1="3"
      y1="6"
      x2="3.01"
      y2="6"
      stroke="#01796F"
      strokeWidth={2.5}
      strokeLinecap="round"
    />
    <Line
      x1="3"
      y1="12"
      x2="3.01"
      y2="12"
      stroke="#01796F"
      strokeWidth={2.5}
      strokeLinecap="round"
    />
    <Line
      x1="3"
      y1="18"
      x2="3.01"
      y2="18"
      stroke="#01796F"
      strokeWidth={2.5}
      strokeLinecap="round"
    />
  </Svg>
);

const ContinueIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 640 640">
    <Path
      fill="#4ade80"
      d="M175.3 160C161.3 160 148.8 169.2 144.7 182.6L102.4 320L256 320C273.7 320 288 334.3 288 352L352 352C352 334.3 366.3 320 384 320L537.6 320L495.3 182.6C491.2 169.2 478.8 160 464.7 160L432 160C414.3 160 400 145.7 400 128C400 110.3 414.3 96 432 96L464.7 96C506.8 96 544.1 123.5 556.5 163.8L601.9 311.3C606 324.5 608 338.2 608 352L608 448C608 501 565 544 512 544L448 544C395 544 352 501 352 448L352 416L288 416L288 448C288 501 245 544 192 544L128 544C75 544 32 501 32 448L32 352C32 338.2 34.1 324.5 38.1 311.3L83.5 163.8C95.9 123.5 133.1 96 175.3 96L208 96C225.7 96 240 110.3 240 128C240 145.7 225.7 160 208 160L175.3 160z"
    />
  </Svg>
);

const TrendingIcon = () => (
  <Svg viewBox="0 0 640 640" width={18} height={18} fill="#f97316">
    <Path d="M281.6 93.9L297.6 72.6C301.6 67.2 308 64 314.7 64C326.4 64 336 73.6 336 85.3L336 107.4C336 120.5 341.4 133.1 350.9 142.1L435.6 223C484.4 269.6 512 334.2 512 401.7C512 498 434 576 337.7 576L320 576C214 576 128 490 128 384L128 380.2C128 331.4 147.4 284.6 181.9 250.1L185.4 246.6C189.6 242.4 195.4 240 201.4 240C213.9 240 224 250.1 224 262.6L224 352C224 387.3 252.7 416 288 416C323.3 416 352 387.3 352 352L352 348.1C352 330.1 344.8 312.8 332.1 300.1L293.5 261.5C269.5 237.5 256 204.8 256 170.8C256 143.1 265 116 281.6 93.9z" />
  </Svg>
);

const YourFeedIcon = () => {
  return (
    <Svg viewBox="0 0 640 640" width={18} height={18} fill="#60a5fa">
      <Path d="M128 128C128 92.7 156.7 64 192 64L448 64C483.3 64 512 92.7 512 128L512 545.1C512 570.7 483.5 585.9 462.2 571.7L320 476.8L177.8 571.7C156.5 585.9 128 570.6 128 545.1L128 128zM192 112C183.2 112 176 119.2 176 128L176 515.2L293.4 437C309.5 426.3 330.5 426.3 346.6 437L464 515.2L464 128C464 119.2 456.8 112 448 112L192 112z" />
    </Svg>
  );
};

const AllStuffIcon = () => {
  return (
    <Svg viewBox="-0.5 -0.5 16 16" fill="#3b82f6" width={20} height={20}>
      <Path
        d="M2.2230625 13.153875V2.2230625c0 -0.8326875 0.6750625 -1.5076875 1.5076875 -1.5076875h8.593875c0.2498125 0 0.4523125 0.2025 0.4523125 0.4523125v13.1169375"
        stroke="#000"
        stroke-linecap="round"
        stroke-width="1"></Path>
      <Path
        d="M5.238437500000001 3.73075h4.523125"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-width="1"></Path>
      <Path
        d="M3.353875 9.7615625h9.4230625"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-width="1"></Path>
      <Path
        d="M3.353875 12.023062499999998h9.4230625"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-width="1"></Path>
      <Path
        d="M3.353875 14.284625h9.4230625"
        stroke="#000"
        stroke-linecap="round"
        stroke-width="1"></Path>
    </Svg>
  );
};

const { width } = Dimensions.get("window");

const CARD_GAP = 5;
const SIDE_PADDING = 22;

// 2 cards visible
const CARD_WIDTH = (width - SIDE_PADDING * 2 - CARD_GAP) / 2;

const renderContentCard = ({ item }: { item: any }) => (
  <ContentCard book={item} />
);

function ContentSlider({ data }: { data: any[] }) {
  return (
    <Carousel
      loop={false}
      width={CARD_WIDTH + CARD_GAP}
      height={300}
      style={{
        width,
      }}
      data={data}
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
            width: CARD_WIDTH + CARD_GAP,
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
            // backgroundColor: "blue"
          }}>
          <View
            style={{
              width: CARD_WIDTH, // Constrain visual asset to strict card width
              height: "100%",
              // backgroundColor: "red"
              // padding: SIDE_PADDING,
            }}>
            {renderContentCard({ item })}
          </View>
        </View>
      )}
    />
  );
}

const renderSkellyCard = () => <ChapterCardSkelly />;

function SkellyCrousel() {
  return (
    <Carousel
      loop={false}
      width={CARD_WIDTH + CARD_GAP}
      height={260}
      style={{
        width,
      }}
      data={[1, 2, 3, 4]}
      pagingEnabled
      snapEnabled
      onConfigurePanGesture={(gestureChain) =>
        gestureChain.activeOffsetX([-15, 15]).failOffsetY([-10, -10])
      }
      mode="parallax"
      modeConfig={{
        parallaxScrollingScale: 0.96,
        parallaxScrollingOffset: 0,
      }}
      renderItem={() => (
        <View
          style={{
            width: CARD_WIDTH,
            marginLeft: SIDE_PADDING,
          }}>
          {renderSkellyCard()}
        </View>
      )}
    />
  );
}

const HomeScreen = () => {
  const [accessToken, isAuthLoading] = useAuth();
  const [feedData, setFeedData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seriesData, setSeriesData] = useState<ISeries | null>(null);
  const { user, loadingUser } = useUser();
  const [completeChapters, setCompleteChapters] = useState(0);
  const { showToast } = useToast();
  const [continueReading, setContinueReading] = useState<IRecentRead[] | null>(
    null,
  );
  const [isContinueLoading, setIsContinueLoading] = useState(true);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // const CHAPTER_LIMIT = 15;

  const [chapters, setChapters] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingChapters, setLoadingChapters] = useState(false);

  useEffect(() => {
    const fetchFeed = async () => {
      if (!accessToken) return;

      try {
        const { data } = await api.get("/feed", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!data.data) throw new Error("fetch failed");

        if (data.success) {
          setFeedData(data.data);
        }

        fetchChapters(1);
      } catch (err) {
        console.error("Failed to fetch feed:", err);
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      }
    };

    fetchFeed();
  }, [accessToken]);

  useEffect(() => {
    const getSeries = async () => {
      if (user && user?.joinedSeries && accessToken) {
        try {
          const data = await api.get(`/series/${user.joinedSeries}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          setSeriesData(data.data.data);
        } catch (error) {
          console.error("Error fetching series data in homepage:", error);
          showToast({ title: "Error" });
        }
      } else if (!user?.joinedSeries) {
        setIsContinueLoading(false);
      }
    };
    getSeries();
  }, [user, loadingUser,accessToken]);

  useEffect(() => {
    if (!seriesData?.cover || !user?.email) return;
    const getJoinedSeriesData = async () => {
      const readChapters = await AsyncStorage.getItem("recentReads");
      if (!readChapters) {
        setIsContinueLoading(false);
        return;
      }
      const recentReads: IRecentRead[] = JSON.parse(readChapters);
      const json: IChapter[] = recentReads.map(
        (recentRead) => recentRead.content,
      );
      const ChapterIdsInSeries = seriesData?.chapters?.map(
        (item) => item.content._id,
      );
      const readChaptersInSeries = json.filter((readChapter) =>
        ChapterIdsInSeries.includes(readChapter._id),
      );
      setCompleteChapters(readChaptersInSeries.length);
      setContinueReading(recentReads.slice(0, 3));
      setIsContinueLoading(false);
    };
    getJoinedSeriesData();
  }, [seriesData?.chapters, user, loadingUser]);

  const fetchChapters = async (pageNumber: number) => {
    if (!accessToken || loadingChapters || !hasMore) return;

    try {
      setLoadingChapters(true);

      const { data } = await api.get(`/chapter/chunk?page=${pageNumber}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (data.success) {
        setChapters((prev: any[]) =>
          pageNumber === 1
            ? data.data.chapters
            : [...prev, ...data.data.chapters],
        );

        setHasMore(data.data.hasMore);
        setPage(pageNumber);
      }
    } catch (err) {
      console.error("Failed to fetch chapters:", err);
    } finally {
      setLoadingChapters(false);
    }
  };

  const loadMore = () => {
    if (!loadingChapters && hasMore) {
      fetchChapters(page + 1);
    }
  };

  const renderSeries = ({ item }: { item: any }) => (
    <SeriesCard
      id={item._id}
      title={item.title}
      author={item.author || "Unknown Author"}
      cover={item.cover}
      chapterCount={item.chapters?.length || 0}
    />
  );

  const renderAllStuff = ({ item }: { item: any }) => (
    <View style={styles.gridContainer}>
      <FlatList
        data={feedData?.personalized || []}
        renderItem={renderContentCard}
        keyExtractor={(item) => item._id}
        numColumns={2}
        scrollEnabled={false}
        columnWrapperStyle={{
          justifyContent: "space-between",
          paddingHorizontal: SIDE_PADDING - 2,
        }}
        contentContainerStyle={{
          paddingHorizontal: 24,
        }}
      />
    </View>
  );

  const renderSkellySeries = () => <SeriesCardSkelly />;

  return (
    <View style={styles.container}>
      <FlatList
        data={chapters}
        renderItem={renderAllStuff}
        keyExtractor={(item) => item._id}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Hero Section */}
            <View style={styles.hero}>
              <Text style={styles.heroTitle}>
                {"Good to see you again.".toUpperCase()}
              </Text>
              <Text style={styles.heroSubtitle}>
                Discover stories that matter. Continue where you left off.
              </Text>
            </View>

            {user?.joinedSeries && seriesData && completeChapters !== null && (
              <>
                <View style={styles.section}>
                  <PopButton
                    onPress={() => {
                      navigation.navigate("SeriesOverview", {
                        seriesId: user?.joinedSeries || "",
                      });
                    }}>
                    <View style={styles.progressCard}>
                      <View style={styles.progressContent}>
                        <Text style={styles.progressTitle}>
                          {seriesData.title}
                        </Text>

                        <Text style={styles.progressMeta}>
                          Chapter {completeChapters} •{" "}
                          <Text style={styles.accentText}>
                            {(
                              (completeChapters /
                                seriesData?.chapters?.map(
                                  (item) => item.content._id,
                                ).length) *
                              100
                            ).toFixed(0)}
                            % Complete
                          </Text>
                        </Text>

                        {/* Progress Track */}
                        <View style={styles.progressTrack}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width:
                                  width *
                                  (completeChapters /
                                    seriesData?.chapters?.map(
                                      (item) => item.content._id,
                                    ).length),
                              },
                            ]}
                          />
                        </View>
                      </View>

                      {/* Chevron Right Icon */}
                      <Svg
                        width={20}
                        height={20}
                        viewBox="0 0 16 16"
                        fill="none">
                        <Path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M10.853333333333333 7.6466666666666665a0.5 0.5 0 0 1 0 0.7066666666666667l-5 5a0.5 0.5 0 0 1 -0.7066666666666667 -0.7066666666666667L9.793333333333333 8 5.1466666666666665 3.3533333333333335a0.5 0.5 0 0 1 0.7066666666666667 -0.7066666666666667l5 5Z"
                          fill={pallete.textwhite}
                        />
                      </Svg>
                    </View>
                  </PopButton>
                </View>
              </>
            )}

            {/* continue learnign */}
            {continueReading && (
              <SectionHeader
                title="Available for you"
                icon={<AvailableIcon />}
              />
            )}
            {isContinueLoading && (
              <View style={{ paddingHorizontal: 20 }}>
                <ContentProgressSkelly />
                <ContentProgressSkelly />
                <ContentProgressSkelly />
              </View>
            )}
            {continueReading && (
              <View style={{ paddingHorizontal: 20 }}>
                {continueReading?.map((item) => (
                  <Contentprogress
                    id={item.content._id}
                    cover={item.content.cover}
                    title={item.content.title}
                    readtill={item.readtill}
                    total={item.total}
                    type={item.content.type}
                    author={item.content.author}
                  />
                ))}
              </View>
            )}

            {/* Available For You */}
            <SectionHeader title="Available for you" icon={<AvailableIcon />} />
            {loading ? (
              <SkellyCrousel />
            ) : (
              <ContentSlider data={feedData?.available || []} />
            )}

            {/* Series */}
            <SectionHeader title="Series" icon={<SeriesIcon />} />
            {loading ? (
              <Carousel
                loop={false}
                width={280 + 16}
                height={260}
                style={{
                  ...styles.horizontalList,
                  width,
                }}
                data={feedData?.series || []}
                pagingEnabled
                snapEnabled
                onConfigurePanGesture={(gestureChain) =>
                  gestureChain.activeOffsetX([-15, 15]).failOffsetY([-10, -10])
                }
                mode="parallax"
                modeConfig={{
                  parallaxScrollingScale: 0.96,
                  parallaxScrollingOffset: 0,
                }}
                renderItem={() => (
                  <View
                    style={{
                      width: 280,
                      marginLeft: SIDE_PADDING,
                    }}>
                    {renderSkellySeries()}
                  </View>
                )}
              />
            ) : (
              <Carousel
                loop={false}
                width={280 + 16}
                height={260}
                style={{
                  ...styles.horizontalList,
                  width,
                }}
                data={feedData?.series || []}
                pagingEnabled
                snapEnabled
                onConfigurePanGesture={(gestureChain) =>
                  gestureChain.activeOffsetX([-10, 10]).failOffsetY([-20, 20])
                }
                mode="parallax"
                modeConfig={{
                  parallaxScrollingScale: 0.96,
                  parallaxScrollingOffset: 0,
                }}
                renderItem={({ item }) => (
                  <View
                    style={{
                      width: 280,
                      marginLeft: SIDE_PADDING,
                    }}>
                    {renderSeries({ item })}
                  </View>
                )}
              />
            )}

            {/* Your Feed */}
            <SectionHeader title="Your Feed" icon={<YourFeedIcon />} />
            <View style={styles.gridContainer}>
              <FlatList
                data={feedData?.personalized || []}
                renderItem={renderContentCard}
                keyExtractor={(item) => item._id}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={{
                  justifyContent: "space-between",
                  paddingHorizontal: SIDE_PADDING - 2,
                }}
                contentContainerStyle={{
                  paddingHorizontal: 24,
                }}
              />
            </View>

            {/* Trending */}
            <SectionHeader title="Trending Now" icon={<TrendingIcon />} />
            <ContentSlider data={feedData?.trending || []} />

            {/* All Stuff */}
            <SectionHeader title="All Stuff" icon={<AllStuffIcon />} />
          </>
        }
        ListFooterComponent={
          loadingChapters ? (
            <>
              <ChapterCardSkelly />
              <ChapterCardSkelly />
            </>
          ) : !hasMore ? (
            <Text>noting to show</Text>
          ) : null
        }
      />
    </View>
  );
};

function SectionHeader({
  title,
  icon,
}: {
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.left}>
        {icon}
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: pallete.bgmain,
    paddingTop: 100,
  },
  hero: {
    paddingHorizontal: 24,
    marginTop: 24,
  },

  heroTitle: {
    fontFamily: "Bebas Neue",
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "700",
    color: "#fff",
  },

  heroSubtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 24,
    color: "#9ca3af",
    width: "85%",
  },
  sectionHeader: {
    paddingHorizontal: 24,
    marginTop: 18,
    marginBottom: 14,
  },

  title: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#F5F5F5",
  },
  headerText: {
    fontSize: 16,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#e5e7eb",
  },
  horizontalList: {
    paddingLeft: 24,
    paddingRight: 16,
    paddingBottom: 10,
  },
  gridContainer: {
    // paddingHorizontal: 10,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: pallete.bgmain,
  },
  loadingText: {
    color: pallete.textwhite,
    fontSize: 16,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  section: {
    width: "100%",
  },
  progressCard: {
    marginHorizontal: pallete.paddingside,
    marginVertical: 10,
    backgroundColor: pallete.bgcard,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressContent: {
    flex: 1,
    marginRight: 16,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: pallete.textwhite,
    marginBottom: 4,
  },
  progressMeta: {
    fontSize: 12,
    color: pallete.textgray,
    marginBottom: 12,
  },
  accentText: {
    color: pallete.accent,
    fontWeight: "700",
  },
  progressTrack: {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: pallete.accent,
    borderRadius: 10,
  },
});

export default HomeScreen;
