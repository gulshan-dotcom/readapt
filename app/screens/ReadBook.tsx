import { useSafeAreaInsets } from "react-native-safe-area-context";
import Pdf, { Source } from "react-native-pdf";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  InteractionManager,
  Share,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Svg, { Path, Line, Circle, Polyline } from "react-native-svg";
import pallete from "../../lib/Colors";
import ContentCard from "../../components/props/ContentCard";
import { api } from "../../lib/api";
import useAuth from "../../hooks/useAuth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IRecentRead } from "../../types/Storage";
import PopButton from "../../components/props/PopButton";
import { useToast } from "../../hooks/useToast";
import { useUser } from "../../hooks/useUser";
import CommentsDrawer from "../../components/props/Comments";
import { SubscriptionPlan } from "../../enums";
import * as FileSystem from "expo-file-system/legacy";
import ReanimatedView, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const MORPH_DISTANCE = 100;
const CONTAINER_PADDING_TOP = 75;
const SCROLLVIEW_MARGIN_TOP = 20;
const PLAYER_CONTAINER_PADDING = 16;
const PDF_FRAME_MARGIN_TOP = 12;
const CARD_SCALE = 0.6;
const CARD_WIDTH = SCREEN_WIDTH * CARD_SCALE;
const CARD_HEIGHT = SCREEN_HEIGHT * CARD_SCALE;
const CARD_RADIUS = 12;
const CARD_HORIZONTAL_MARGIN =
  (SCREEN_WIDTH - PLAYER_CONTAINER_PADDING * 2 - CARD_WIDTH) / 2;
const INITIAL_CENTER_Y = SCREEN_HEIGHT / 2;
const CARD_LEFT_ESTIMATE = (SCREEN_WIDTH - CARD_WIDTH) / 2;
const CARD_TOP_ESTIMATE =
  CONTAINER_PADDING_TOP +
  SCROLLVIEW_MARGIN_TOP +
  PLAYER_CONTAINER_PADDING +
  PDF_FRAME_MARGIN_TOP;
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

import Carousel, { ICarouselInstance } from "react-native-reanimated-carousel";
import { useDownloads } from "../../hooks/useDownloads";
import NextChapter from "../../components/props/NextChapter";
import { checkIsDownloaded, getSingleDownloaded } from "../../lib/downloadManager";
import Offline from "../../components/state/Offline";
import { useNetworkStatus } from "../../hooks/useNetwork";
import { useGlobalAudio } from "../../hooks/useGlobalAudio";
import QuestionCard from "../../components/props/QuestionCard";
import { IQuestion } from "../../types/Question";
import { ISeries, ISeriesContent } from "../../types/Series";

export interface PdfCarouselRef {
  jumpToPage: (page: number) => void;
}

/**
 * Shared props for both the small "card" carousel and the fullscreen
 * carousel. Sizing (`width`/`height`) is parameterized so the exact same
 * paging logic drives both views - the only real difference between them
 * is how big each page renders and whether pinch-zoom should be reported
 * back up (`onScaleChanged`, fullscreen only).
 *
 * Sync between the two carousels is handled entirely by the parent via
 * `onPageChange` + imperative `jumpToPage` calls - there's no local lock
 * state here. A carousel that gets jumped to a page it's already on (or
 * one whose `onPageChange` reports the page the parent already has) is a
 * no-op, so no extra "is this programmatic" bookkeeping is needed.
 */
interface PdfCarouselViewerProps {
  pdfSource: { uri: string | null; cache: boolean };
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  onScaleChanged?: (scale: number) => void;
  width?: number;
  height?: number;
}

const PdfCarouselViewer = forwardRef<PdfCarouselRef, PdfCarouselViewerProps>(
  (
    {
      pdfSource,
      currentPage,
      totalPages,
      onPageChange,
      onScaleChanged,
      width = CARD_WIDTH,
      height = CARD_HEIGHT,
    },
    ref,
  ) => {
    const carouselRef = useRef<ICarouselInstance>(null);

    useImperativeHandle(ref, () => ({
      jumpToPage(page: number) {
        if (carouselRef.current && page >= 1 && page <= totalPages) {
          carouselRef.current.scrollTo({ index: page - 1, animated: true });
        }
      },
    }));

    const pagesData = useMemo(() => {
      const pages = [];
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }, [totalPages]);

    const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

    return (
      <View style={[styles.pdfcontainer, { width, height }]}>
        {totalPages > 0 && (
          <Carousel
            ref={carouselRef}
            loop={false}
            width={width}
            height={height}
            data={pagesData}
            defaultIndex={safeCurrentPage - 1}
            onSnapToItem={(index) => onPageChange?.(index + 1)}
            onConfigurePanGesture={(gestureChain) =>
              gestureChain.activeOffsetX([-15, 15]).failOffsetY([-10, 10])
            }
            renderItem={({ item: pageNum, index }) => {
              const distance = Math.abs(index - (safeCurrentPage - 1));

              if (distance > 2) {
                return (
                  <View style={[styles.pageContainer, { width, height }]} />
                );
              }

              return (
                <View style={[styles.pageContainer, { width, height }]}>
                  <Pdf
                    source={pdfSource}
                    page={pageNum}
                    singlePage={true}
                    style={styles.pdfImage}
                    enablePaging={false}
                    enableAnnotationRendering={false}
                    onScaleChanged={onScaleChanged}
                    onError={(err) =>
                      console.log(`Error rendering page ${pageNum}:`, err)
                    }
                  />
                </View>
              );
            }}
          />
        )}
      </View>
    );
  },
);

const ZOOM_MAX_SCALE = 3;

const ZoomablePdfPage = ({
  pdfSource,
  pageNum,
  width,
  height,
  isZoomed,
  onZoomChange,
}: {
  pdfSource: { uri: string | null; cache: boolean };
  pageNum: number;
  width: number;
  height: number;
  isZoomed: boolean;
  onZoomChange: (zoomed: boolean) => void;
}) => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const resetZoom = () => {
    "worklet";
    scale.value = withTiming(1);
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(
        Math.max(savedScale.value * e.scale, 1),
        ZOOM_MAX_SCALE,
      );
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      const zoomed = scale.value > 1;
      if (!zoomed) resetZoom();
      runOnJS(onZoomChange)(zoomed);
    });

  const panGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(2)
    .enabled(isZoomed)
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const zoomed = savedScale.value > 1;
      if (zoomed) {
        resetZoom();
        runOnJS(onZoomChange)(false);
      } else {
        scale.value = withTiming(2);
        savedScale.value = 2;
        runOnJS(onZoomChange)(true);
      }
    });

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTapGesture,
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <ReanimatedView.View style={[{ width, height }, animatedStyle]}>
        <Pdf
          source={pdfSource}
          page={pageNum}
          singlePage={true}
          style={styles.pdfImage}
          enablePaging={false}
          enableAnnotationRendering={false}
          // Zoom is fully owned by the gestures above now - lock the
          // library's own scale so it can't fight with them.
          minScale={1}
          maxScale={1}
          scale={1}
          onError={(err) =>
            console.log(`Error rendering page ${pageNum}:`, err)
          }
        />
      </ReanimatedView.View>
    </GestureDetector>
  );
};

const MemoizedZoomablePdfPage = React.memo(ZoomablePdfPage);

const MainPdfCarouselViewer = forwardRef<
  PdfCarouselRef,
  PdfCarouselViewerProps
>(
  (
    {
      pdfSource,
      currentPage,
      totalPages,
      onPageChange,
      onScaleChanged,
      width = SCREEN_WIDTH,
      height = SCREEN_HEIGHT,
    },
    ref,
  ) => {
    const carouselRef = useRef<ICarouselInstance>(null);
    // Tracks whether the currently-visible page is pinch-zoomed in. While
    // zoomed, the carousel's own swipe-to-page gesture is disabled so a
    // one-finger drag pans around the zoomed page instead of turning it.
    const [isZoomed, setIsZoomed] = useState(false);

    const handleZoomChange = (zoomed: boolean) => {
      setIsZoomed(zoomed);
      onScaleChanged?.(zoomed ? 2 : 1);
    };

    useImperativeHandle(ref, () => ({
      jumpToPage(page: number) {
        if (carouselRef.current && page >= 1 && page <= totalPages) {
          carouselRef.current.scrollTo({ index: page - 1, animated: true });
        }
      },
    }));

    const pagesData = useMemo(() => {
      const pages = [];
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }, [totalPages]);

    const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

    return (
      <View style={[styles.pdfcontainer, { width, height }]}>
        {totalPages > 0 && (
          <Carousel
            ref={carouselRef}
            loop={false}
            width={width}
            height={height}
            data={pagesData}
            defaultIndex={safeCurrentPage - 1}
            enabled={!isZoomed}
            onSnapToItem={(index) => onPageChange?.(index + 1)}
            onConfigurePanGesture={(gestureChain) =>
              gestureChain
                .activeOffsetX([-15, 15])
                .failOffsetY([-10, 10])
                // Restrict the carousel's own pan gesture to single-finger
                // touches only, so a two-finger pinch is never claimed by
                // the swipe-to-page gesture and can reach ZoomablePdfPage's
                // Pinch gesture underneath.
                .minPointers(1)
                .maxPointers(1)
            }
            renderItem={({ item: pageNum, index }) => {
              const distance = Math.abs(index - (safeCurrentPage - 1));

              if (distance > 2) {
                return (
                  <View style={[styles.pageContainer, { width, height }]} />
                );
              }

              return (
                <View style={[styles.morphFrameInner, { width, height }]}>
                  <MemoizedZoomablePdfPage
                    pdfSource={pdfSource}
                    pageNum={pageNum}
                    width={width}
                    height={height}
                    isZoomed={isZoomed}
                    onZoomChange={handleZoomChange}
                  />
                </View>
              );
            }}
          />
        )}
      </View>
    );
  },
);

const pdfUri =
  "https://sample-files.com/downloads/documents/pdf/sample-10-page-pdf-a4-size.pdf";
const BookReaderScreen = ({ route, navigation }: Props) => {
  const scrollRef = useRef<Animated.ScrollView>(null);
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const borderDriver = useRef(new Animated.Value(0)).current;
  const currentScrollYRef = useRef(0);
  const scrollDirectionRef = useRef<"up" | "down" | null>(null);
  const isSnappingRef = useRef(false);
  const morphSpringRef = useRef<Animated.CompositeAnimation | null>(null);

  const chapterId = route.params.bookId;

  // Refs to the two carousels. Keeping both pages in sync is just: whichever
  // carousel's gesture changed the page tells the parent, the parent updates
  // `currentPage` and imperatively jumps the *other* carousel to match.
  const miniCarouselRef = useRef<PdfCarouselRef>(null);
  const mainCarouselRef = useRef<PdfCarouselRef>(null);

  const { accessToken } = useAuth();
  const { showToast } = useToast();
  const { user, reload } = useUser();
  const { downloadChapter } = useDownloads();
  const { removeAllTracks } = useGlobalAudio()

  const [book, setBook] = useState<BookPopulated | null>();
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [showPdfControls, setShowPdfControls] = useState(true);
  const {isConnected} = useNetworkStatus()
  const [commentedQueId, setCommentedQueId] = useState("");
  const [questions, setQuestions] = useState<ISeriesContent[] | null>(null);

  const resetInfo = () => {
    console.log("retingth")
    setIsLiked(false);
    setPdfPath(null)
    setTotalPages(0)
    setCurrentPage(1)
    setQuestions(null)
  }

  const fullHeight = SCREEN_HEIGHT + insets.top + insets.bottom;

  const [cardTarget, setCardTarget] = useState({
    x: CARD_LEFT_ESTIMATE,
    y: CARD_TOP_ESTIMATE,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  });
  const pdfFrameRef = useRef<View>(null);

  const measureCardPosition = () => {
    if (currentScrollYRef.current > 2) return;
    const doMeasure = () => {
      pdfFrameRef.current?.measureInWindow((x, y, width, height) => {
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        setCardTarget({
          x: x + SCREEN_WIDTH / 2,
          y:
            y -
            MORPH_DISTANCE -
            insets.top +
            SCROLLVIEW_MARGIN_TOP +
            PLAYER_CONTAINER_PADDING +
            PDF_FRAME_MARGIN_TOP,
          width: width || CARD_WIDTH,
          height: height || CARD_HEIGHT,
        });
      });
    };
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(doMeasure);
    });
    setTimeout(doMeasure, 400);
  };
  
  const fetchChapter = async () => {
    if(isConnected){

      const chapter = await api.get(`/chapter/${chapterId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setBook(chapter.data.data);
    } else {
      const isDownloaded = await checkIsDownloaded(chapterId);
      if (!isDownloaded) {
        showToast({title: "You seems to be offline. Please connect to Internet"})
      }
      const downloaded = await getSingleDownloaded(chapterId)
      setBook(downloaded)
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchChapter();
  }, [ accessToken, isConnected ]);

  useEffect(() => {
    removeAllTracks()
  }, [])
  

  useEffect(() => {
    const loadPdf = async () => {
      if (!book?.media) return;
      console.log("fetching pdf", book._id);
      try {
        const targetDir = FileSystem.documentDirectory;
        const id = book?._id || Date.now();
        const path = `${targetDir}myfile${id}.pdf`;

        const fileInfo = await FileSystem.getInfoAsync(path);

        if (fileInfo.exists) {
          console.log("Loaded from local cache:", fileInfo.uri);
          setPdfPath(fileInfo.uri);
          return;
        }

        if (!isConnected) {
          showToast({title: "You seems to to be offline"})
        }

        const result = await FileSystem.downloadAsync(book?.media, path);

        console.log("Downloaded and cached to:", result.uri);
        setPdfPath(result.uri);
      } catch (err) {
        console.log(err, "rnby err");
      }
    };
    loadPdf();
  }, [book?.media, isConnected]);

  useEffect(() => {
    if (user) {
      const isalreadyLiked = user.likes.find((item) => item._id === chapterId);
      setIsLiked(isalreadyLiked?._id ? true : false);
    }
  }, [user, isConnected]);

  const pdfSource = useMemo(
    () => ({
      uri: pdfPath,
      cache: true,
    }),
    [pdfPath],
  );

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (e: any) => {
        const y = e.nativeEvent.contentOffset.y;
        const prevY = currentScrollYRef.current;

        if (Math.abs(y - prevY) > 0.5) {
          scrollDirectionRef.current = y > prevY ? "down" : "up";
        }

        currentScrollYRef.current = y;
        borderDriver.setValue(y);

        if (y >= MORPH_DISTANCE && !isLocked) {
          setIsLocked(true);
        } else if (y <= 0 && isLocked) {
          setIsLocked(false);
        }
      },
    },
  );
  const snapTo = (target: number) => {
    if (isSnappingRef.current) return;
    isSnappingRef.current = true;
    scrollDirectionRef.current = target === MORPH_DISTANCE ? "down" : "up";
    scrollRef.current?.scrollTo({ y: target, animated: true });
  };
  const handleScrollBeginDrag = () => {
    isSnappingRef.current = false;
    morphSpringRef.current?.stop();
  };
  const snapToNearestState = (y: number) => {
    if (y <= 0) {
      isSnappingRef.current = false;
      return;
    }
    if (y >= MORPH_DISTANCE) {
      isSnappingRef.current = false;
      return;
    }
    if (scrollDirectionRef.current === "up") {
      snapTo(0);
    } else {
      snapTo(MORPH_DISTANCE);
    }
  };
  const handleScrollEndDrag = (e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    snapToNearestState(y);
  };
  const handleMomentumScrollEnd = (e: any) => {
    if (isSnappingRef.current) return;
    snapToNearestState(e.nativeEvent.contentOffset.y);
  };
  const openToc = () => setIsTocOpen(true);
  const closeToc = () => setIsTocOpen(false);
  const pageCountLabel =
    totalPages > 0 ? `${currentPage} / ${totalPages}` : `Page ${currentPage}`;
  const progress = scrollY.interpolate({
    inputRange: [0, MORPH_DISTANCE],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
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
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, CARD_SCALE],
  });
  const targetCenterX = cardTarget.x + cardTarget.width / 2;
  const targetCenterY = cardTarget.y + cardTarget.height / 2;
  const translateXTo = targetCenterX - SCREEN_WIDTH;
  const translateYTo = targetCenterY - INITIAL_CENTER_Y;
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, translateXTo],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, translateYTo],
  });
  const borderProgress = borderDriver.interpolate({
    inputRange: [0, MORPH_DISTANCE],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const borderRadius = borderProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, CARD_RADIUS],
  });
  const lastSavedPageRef = useRef<number | null>(null);
  const goToPage = (page: number, origin: "mini" | "main" | "toc") => {
    if (page < 1 || page === currentPage) return;
    setCurrentPage(page);
    if (origin !== "mini") miniCarouselRef.current?.jumpToPage(page);
    if (origin !== "main") mainCarouselRef.current?.jumpToPage(page);
  };

  useEffect(() => {
    if (!chapterId) return;
    const getRecentRead = async () => {
      const readChapters = await AsyncStorage.getItem("recentReads");
      if (!readChapters) return;
      const recentReads: IRecentRead[] = JSON.parse(readChapters);
      const existingRead = recentReads.find(
        (recentRead) => recentRead.content._id === chapterId,
      );
      if (!existingRead) return;
      const lastOpen = parseInt(existingRead.readtill);
      setCurrentPage(lastOpen);
      lastSavedPageRef.current = lastOpen;
      // Carousels may already be mounted with a stale defaultIndex by the
      // time this async read resolves - nudge them to the restored page.
      miniCarouselRef.current?.jumpToPage(lastOpen);
      mainCarouselRef.current?.jumpToPage(lastOpen);
    };
    getRecentRead();
  }, [chapterId, isConnected, book]);

  const updateRecentReads = async () => {
    if (currentPage < 1 || !book) return;
    console.log("Updating recent reads for chapter", chapterId, "page", currentPage);

    const currentPageValue = Math.max(1, currentPage);
    if (lastSavedPageRef.current === currentPageValue) return;

    try {
      let oldRecentReads = await AsyncStorage.getItem("recentReads");
      if (!oldRecentReads) oldRecentReads = "[]";
      const recentReads: IRecentRead[] = JSON.parse(oldRecentReads);
      const newRecentReads = recentReads.filter(
        (item) => item.content._id !== chapterId,
      );
      newRecentReads.push({
        content: {
          ...book,
          comments: Array.isArray(book.comments) ? book.comments.length : 0,
          category: book.category?.name || book.category?._id || "",
        },
        readtill: currentPageValue +  "",
        total: book?.total? book?.total + "" : "5",
        readAt: new Date().toString(),
      });
      console.log("Saving recent reads:", newRecentReads);
      await AsyncStorage.setItem("recentReads", JSON.stringify(newRecentReads));
      lastSavedPageRef.current = currentPageValue;
    } catch (error) {
      console.error("Error updating recent reads:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", () => {
      void updateRecentReads();
    });

    return () => {
      unsubscribe();
    };
  }, [navigation, chapterId, book, currentPage]);

  const like = async () => {
     if (!isConnected) {
      showToast({
        title: "Please connect to the Internet.",
      });
      return;
    }
    setIsLiked(!isLiked);
    try {
      await api.post(
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
    await Share.share({
      message: "https://play.google.com/store/apps",
    });
  };

  const download = async () => {
     if (!isConnected) {
      showToast({
        title: "Please connect to the Internet.",
      });
      return;
    }
    if (!book || !user) return;
    if (!book?.isDownloadable) {
      showToast({
        title: "This Chapter is not downloadable",
      });
      return;
    }
    if (user?.subscription.plan < 2) {
      showToast({
        title: "Please upgrade your plan to download this chapter",
      });
      return;
    }

    const isAlreadyDownloaded = await checkIsDownloaded(book._id);
    if (isAlreadyDownloaded) {
      showToast({
        title: "This Chapter is already Downloaded",
      });
      return;
    }

    downloadChapter(book);
    showToast({
      title: "Download started",
    });
  };

  useEffect(() => {
    if(!book || !user || !book.series) return;
    const fetchQuestions = async () => {
      try {
        const series: ISeries = book.series;
        const contents = series.chapters || [];
        const chapterIndex = contents.findIndex((item) => {
          return item.content?._id === book._id;
        });

        console.log(series.chapters.map(item => item.contentModel), " content model")

        const chapterQues: ISeriesContent[] = [];
        if (chapterIndex !== -1) {
          for (let index = chapterIndex + 1; index < contents.length; index++) {
            const item = contents[index];
            if (item.contentModel !== "Question") break;
            chapterQues.push(item);
          }
        }

        setQuestions(chapterQues);
      } catch (error) {
        console.error("Error fetching questions:", error);
      }
    };

    fetchQuestions();
  }, [accessToken, user, isConnected, book]);

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

    if (!book && !isConnected) {
    return <View style={[styles.container,{ paddingTop: 100, alignItems: "center", justifyContent: "center"}]}>
      <Offline />
    </View>;
  }

  return (
    <View style={styles.container}>
      {/* Invisible probe: the only job of this instance is to report
          onLoadComplete so we know totalPages before either carousel
          renders. It's unmounted as soon as we have that number. */}
      {pdfPath && totalPages === 0 && (
        <View style={styles.hiddenProbe} pointerEvents="none">
          <Pdf
            source={pdfSource}
            trustAllCerts={false}
            onLoadComplete={(pages) => setTotalPages(pages)}
            onError={(err) => console.log("probe pdf error", err)}
            style={styles.hiddenProbeInner}
          />
        </View>
      )}
      <Animated.ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={styles.scrollView}
        scrollEventThrottle={16}
        scrollEnabled={!isLoading}
        showsVerticalScrollIndicator={false}>
        <View style={styles.falseHeight}></View>
        {/* Main Content */}

        <View style={styles.playerContainer}>
          <Animated.View
            ref={pdfFrameRef}
            onLayout={measureCardPosition}
            style={[styles.pdfFrame, { opacity: cardOpacity }]}>
            {book?.media ? (
              <View style={styles.pdfTouchArea}>
                {pdfPath && totalPages > 0 ? (
                  <PdfCarouselViewer
                    ref={miniCarouselRef}
                    pdfSource={pdfSource}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => goToPage(page, "mini")}
                  />
                ) : (
                  <View style={styles.pdfActivity}>
                  <ActivityIndicator color="white" />
                  </View>
                )}
              </View>
            ) : (
              <View style={[styles.pdfImage, styles.pdfPlaceholder]}>
                <ActivityIndicator color={pallete.accent} />
              </View>
            )}
          </Animated.View>
          {/* Book Details */}
          <View style={styles.bookDetails}>
            <Text style={styles.bookTitle}>{book?.title}</Text>
            <View style={styles.row}>
              <Text style={styles.bookAuthor}>{book?.author}</Text>
              <View style={styles.divider} />
              <Text style={styles.statItem}>
                {isLiked ? (book?.likes || 0) + 1 : book?.likes} likes
              </Text>
              <View style={styles.divider} />
              <Text style={styles.statItem}>
                {book?.comments.length} comments
              </Text>
            </View>
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

        {
          questions && questions?.length > 0 &&
        <View style={styles.pollSection}>
          <Carousel
            loop={false}
            width={SCREEN_WIDTH}
            height={510}
            style={{
              width: SCREEN_WIDTH,
            }}
            data={
              questions
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
                width: (SCREEN_WIDTH / 100) * 85,
                height: "100%",
                justifyContent: "center",
                alignItems: "center",
                // backgroundColor: "blue"
              }}>
                <View
                  style={{
                    width: (SCREEN_WIDTH / 100) * 85, // Constrain visual asset to strict card width
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
        }

            
        {/* Next Chapters */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Next Chapters</Text>
          </View>
          {book && (
            <NextChapter
              book={book}
              onOpen={(book: BookPopulated) => {
                updateRecentReads()
                resetInfo()
                setBook(book);
                scrollRef.current?.scrollTo(0);
              }}
              viewer="pdf"
            />
          )}
        </View>
      </Animated.ScrollView>
      <Animated.View
        pointerEvents={isLocked ? "none" : "auto"}
        style={[
          styles.morphFrame,
          {
            opacity: overlayOpacity,
            height: fullHeight,
            transform: [
              { translateX },
              { translateY },
              { scaleX: scale },
              { scaleY: scale },
            ],
          },
        ]}>
        {!isLocked && showPdfControls && (
          <TouchableOpacity
            style={[
              styles.fullscreenClose,
              {
                top: insets.top + 16,
              },
            ]}
            onPress={() => {
              scrollRef.current?.scrollTo({
                y: MORPH_DISTANCE,
                animated: true,
              });
            }}
            activeOpacity={0.8}>
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>
        )}
        <Animated.View
          style={[
            styles.morphFrameInner,
            {
              borderRadius,
              height: fullHeight,
            },
          ]}>
          {book?.media && pdfPath && totalPages > 0 ? (
            <MainPdfCarouselViewer
              ref={mainCarouselRef}
              pdfSource={pdfSource}
              currentPage={currentPage}
              totalPages={totalPages}
              width={SCREEN_WIDTH}
              height={fullHeight}
              onPageChange={(page) => goToPage(page, "main")}
              onScaleChanged={(scale) => setShowPdfControls(scale === 1)}
            />
          ) : (
            <View style={styles.pdfPlaceholder}>
              <ActivityIndicator color={pallete.accent} />
            </View>
          )}
        </Animated.View>
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
              {book?.toc?.map((ch, i) => (
                <PopButton
                  key={i}
                  styles={styles.tocChip}
                  onPress={() => {
                    goToPage(Number(ch.cut), "toc");
                    closeToc();
                  }}>
                  <Text style={styles.chipName}>{ch.title}</Text>
                  <Text style={styles.chipPage}>P. {String(ch.cut)}</Text>
                </PopButton>
              ))}
            </View>
          </Animated.View>
        </>
      )}
      {!isLocked && showPdfControls && (
        <View style={[styles.bottomReadBar, { paddingBottom: insets.bottom }]}>
          <Text style={styles.bottomReadBarText}>{pageCountLabel}</Text>
          <TouchableOpacity
            style={styles.tocButton}
            onPress={openToc}
            activeOpacity={0.9}>
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
          </TouchableOpacity>
        </View>
      )}
      <CommentsDrawer
        visible={showComments}
        reload={fetchChapter}
        onClose={() => setShowComments(false)}
        chapterId={commentedQueId ? commentedQueId : chapterId}
        initialComments={commentedQueId ? [] : book?.comments ? book?.comments : []}
        isQuestion={commentedQueId ? true : false}
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
  pdfcontainer: {
    flex: 1,
    backgroundColor: pallete.bgmain,
  },
  hiddenProbe: {
    position: "absolute",
    // width: SCREEN_WIDTH,
    // height: SCREEN_HEIGHT,
    width: 1,
    height: 1,
    opacity: 1,
    // backgroundColor: "red",
    top: -10000,
    left: -10000,
    zIndex: -1,
  },
  hiddenProbeInner: {
    width: 1,
    height: 1,
  },
  pageContainer: {
    flex: 1,
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
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginHorizontal: CARD_HORIZONTAL_MARGIN,
    backgroundColor: "#12121c",
    borderRadius: 12,
    marginTop: PDF_FRAME_MARGIN_TOP,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  pdfImage: { width: "100%", height: "100%", resizeMode: "cover" },
  morphFrame: {
    position: "absolute",
    zIndex: 400,
    left: 0,
    width: SCREEN_WIDTH,
  },
  pdfPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  morphFrameInner: {
    width: SCREEN_WIDTH,
    backgroundColor: "#12121c",
    overflow: "hidden",
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  pdfTouchArea: {
    width: "100%",
    height: "100%",
  },
  pdfActivity :{
     width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignItems: "center",
    justifyContent: 'center'
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
  },  pollSection: {
    marginBottom: 20,
    overflow: "hidden",
  },
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
    marginTop: 15,
    fontWeight: "700",
    color: pallete.accent,
    textAlign: "center",
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
  bottomReadBar: {
    position: "absolute",
    bottom: 0,
    margin: 0,
    width: SCREEN_WIDTH,
    backgroundColor: "rgb(15, 15, 17)",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 450,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  bottomReadBarText: {
    color: pallete.textwhite,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  tocButton: {
    backgroundColor: pallete.accent,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 78,
    alignItems: "center",
    justifyContent: "center",
  },
  tocButtonText: {
    color: pallete.textwhite,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  fullscreenClose: {
    position: "absolute",
    right: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },

  closeText: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "300",
    lineHeight: 32,
  },
});
export default BookReaderScreen;
