import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Pdf, { Source } from "react-native-pdf";
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    ActivityIndicator,
    InteractionManager,
} from "react-native";
import { Gesture } from "react-native-gesture-handler";
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
import * as FileSystem from 'expo-file-system/legacy';
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
// const INITIAL_CENTER_X = SCREEN_WIDTH / 2;
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

import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';

export interface PdfCarouselRef {
    jumpToPage: (page: number) => void;
}

interface PdfCarouselViewerProps {
    pdfSource: { uri: string | null; cache: boolean };
    isProgrammaticSwipe: boolean;
    currentPage: number;
    totalPages: number;
    setProgrammaticSwipe: (state: boolean) => void;
    onPageChange?: (page: number) => void;
}

const PdfCarouselViewer = forwardRef<PdfCarouselRef, PdfCarouselViewerProps>(({
    pdfSource,
    isProgrammaticSwipe,
    currentPage,
    totalPages,
    setProgrammaticSwipe,
    onPageChange,
}, ref) => {
    const carouselRef = useRef<ICarouselInstance>(null);

    useImperativeHandle(ref, () => ({
        jumpToPage(page: number) {
            if (carouselRef.current && page >= 1 && page <= totalPages) {
                carouselRef.current.scrollTo({ index: page - 1, animated: true });
            }
        }
    }));

    const pagesData = useMemo(() => {
        const pages = [];

        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }

        return pages;
    }, [totalPages]);

    return (
        <View style={styles.pdfcontainer}>
            {totalPages > 0 && (
                <Carousel
                    ref={carouselRef}
                    loop={false}
                    width={CARD_WIDTH}
                    height={CARD_HEIGHT}
                    data={pagesData}
                    defaultIndex={currentPage - 1}
                    onSnapToItem={(index) => { if (onPageChange && !isProgrammaticSwipe) { onPageChange(index + 1) } else { setProgrammaticSwipe(false) } }}
                    onConfigurePanGesture={(gestureChain) =>
                        gestureChain.activeOffsetX([-15, 15]).failOffsetY([-10, 10])
                    }
                    renderItem={({ item: pageNum, index }) => {
                        const distance = Math.abs(index - (currentPage - 1));

                        if (distance > 2) {
                            return <View style={styles.pageContainer} />;
                        }

                        return (
                            <View style={styles.pageContainer}>
                                <Pdf
                                    source={pdfSource}
                                    page={pageNum}
                                    singlePage={true}
                                    style={styles.pdfImage}
                                    enablePaging={false}
                                    enableAnnotationRendering={false}
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
})

const pdfUri = "https://sample-files.com/downloads/documents/pdf/sample-10-page-pdf-a4-size.pdf"
const BookReaderScreen = ({ route, navigation }: Props) => {
    const scrollRef = useRef<Animated.ScrollView>(null);
    const insets = useSafeAreaInsets();
    const scrollY = useRef(new Animated.Value(0)).current;
    const borderDriver = useRef(new Animated.Value(0)).current;
    const currentScrollYRef = useRef(0);
    const scrollDirectionRef = useRef<"up" | "down" | null>(null);
    const isSnappingRef = useRef(false);
    const isProgrammaticSwipe = useRef(false);
    const morphSpringRef = useRef<Animated.CompositeAnimation | null>(null);

    const chapterId = route.params.bookId;
    const carouselViewerRef = useRef<PdfCarouselRef>(null);

    const [accessToken] = useAuth();
    const { showToast } = useToast();
    const { user, reload } = useUser();

    const [book, setBook] = useState<BookPopulated | null>();
    const [isLoading, setIsLoading] = useState(true);
    const [lastOpenPage, setLastOpenPage] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLiked, setIsLiked] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [isTocOpen, setIsTocOpen] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [pdfPath, setPdfPath] = useState<string | null>(null)
    const [totalPages, setTotalPages] = useState(0)
    const fullPdfRef = useRef<Pdf>(null);
    const [showPdfControls, setShowPdfControls] = useState(true)

    const [cardTarget, setCardTarget] = useState({
        x: CARD_LEFT_ESTIMATE,
        y: CARD_TOP_ESTIMATE,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
    });
    const pdfFrameRef = useRef<View>(null);
    console.log(CARD_LEFT_ESTIMATE, SCREEN_WIDTH, CARD_WIDTH, "card otopins")
    const measureCardPosition = () => {
        if (currentScrollYRef.current > 2) return;
        const doMeasure = () => {
            pdfFrameRef.current?.measureInWindow((x, y, width, height) => {
                if (!Number.isFinite(x) || !Number.isFinite(y)) return;
                console.log(x, "Card x")
                setCardTarget({
                    x: x + SCREEN_WIDTH / 2,
                    y: y - MORPH_DISTANCE - insets.top +
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
        const chapter = await api.get(`/chapter/${chapterId}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        setBook(chapter.data.data);
        setIsLoading(false);
    };
    useEffect(() => {
        fetchChapter();
    }, [accessToken]);

    useEffect(() => {
        const loadPdf = async () => {
            console.log("fetching pdf")
            try {
                console.log("Checking PDF cache...");
                const targetDir = FileSystem.documentDirectory;
                const path = `${targetDir}myfile.pdf`;

                const fileInfo = await FileSystem.getInfoAsync(path);

                if (fileInfo.exists) {
                    console.log("Loaded from local cache:", fileInfo.uri);
                    setPdfPath(fileInfo.uri);
                    return;
                }

                console.log("File not cached. Fetching remote PDF...");
                const result = await FileSystem.downloadAsync(pdfUri, path);

                console.log("Downloaded and cached to:", result.uri);
                setPdfPath(result.uri);
            } catch (err) {
                console.log(err, "rnby err")
            }
        }
        loadPdf();
    }, []);

    const pdfSource = useMemo(
        () => ({
            uri: pdfPath,
            cache: true,
        }),
        [pdfPath]
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
        }
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
    const tocPan = Gesture.Pan().onEnd((e) => {
        if (e.translationX < -100) closeToc();
    });
    const progress = scrollY.interpolate({
        inputRange: [
            0,
            MORPH_DISTANCE,
        ],
        // Quadratic Ease-Out curve mapping [0 -> 1]
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
            const newRecentReads = recentReads.filter(
                (item) => item.content._id !== chapterId,
            );
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

    return (
        <View style={styles.container}>
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
                            <View
                                style={styles.pdfTouchArea}

                            >
                                {
                                    pdfPath ?
                                        <PdfCarouselViewer ref={carouselViewerRef} pdfSource={pdfSource} currentPage={currentPage}
                                            setProgrammaticSwipe={(state) => isProgrammaticSwipe.current = state}
                                            isProgrammaticSwipe={isProgrammaticSwipe.current} totalPages={totalPages} onPageChange={(page) => {
                                                console.log("small page changed trigger")
                                                if (page !== currentPage) {
                                                    console.log("small page changed trigger passed")
                                                    setTimeout(() => {
                                                        console.log("small page changed trigger passed, ", fullPdfRef.current, page)
                                                        if (fullPdfRef.current) {
                                                            fullPdfRef.current.setPage(page);
                                                            console.log("small page changed trigger passed, ", page)
                                                        }
                                                    }, 500);
                                                    setCurrentPage(page);
                                                }
                                            }} />
                                        : <ActivityIndicator color="white" />
                                }

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
                            <Text style={styles.statItem}>{isLiked ? (book?.likes || 0) + 1 : book?.likes} likes</Text>
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
                {/* Next Chapters */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Next Chapters</Text>
<Text style={styles.sectionTitle}>Next Chapters</Text>
<Text style={styles.sectionTitle}>Next Chapters</Text>
<Text style={styles.sectionTitle}>Next Chapters</Text>
<Text style={styles.sectionTitle}>Next Chapters</Text>
                    </View>
                    <View style={styles.booksGrid}>
                        {/* Add your ContentCard components here */}
                    </View>
                </View>
            </Animated.ScrollView>
            <Animated.View
                pointerEvents={isLocked ? "none" : "auto"}
                style={[
                    styles.morphFrame,
                    {
                        opacity: overlayOpacity, top: insets.top,
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
                        activeOpacity={0.8}
                    >
                        <Text style={styles.closeText}>×</Text>
                    </TouchableOpacity>
                )}
                <Animated.View
                    style={[
                        styles.morphFrameInner,
                        {
                            borderRadius,
                        },
                    ]}>
                    {
                        book?.media && pdfPath ?
                            <Pdf
                                trustAllCerts={false}
                                source={pdfSource}
                                ref={fullPdfRef}
                                singlePage={false}
                                horizontal={true}
                                enablePaging={true}
                                fitPolicy={0} spacing={10}
                                onLoadComplete={(numberOfPages) => setTotalPages(numberOfPages)}
                                style={styles.pdfImage}
                                onScaleChanged={scale => {
                                    if (scale === 1) {
                                        setShowPdfControls(true)
                                    } else {
                                        setShowPdfControls(false)
                                    }
                                }}
                                onPageChanged={(page) => {
                                    console.log("LARGE PDF page changed:", page);
                                    if (page !== currentPage) {
                                        console.log("changed small PDF in loop for:", page);
                                        if (page >= 1 && page <= totalPages) {
                                            isProgrammaticSwipe.current = true
                                            carouselViewerRef.current?.jumpToPage(page);
                                        }
                                        setCurrentPage(page);
                                    }
                                }}
                                onError={(error) => {
                                    console.error("PDF error:", error);
                                }}
                            />
                            : (
                                <View style={styles.pdfPlaceholder}>
                                    <ActivityIndicator color={pallete.accent} />
                                </View>
                            )
                    }
                </Animated.View>
            </Animated.View>
            {!isTocOpen && (
                <>
                    <TouchableOpacity
                        style={styles.tocBackdrop}
                        onPress={closeToc}
                        activeOpacity={1}
                    />
                    <Animated.View style={styles.tocSideSheet}>
                        <Text style={styles.tocHeader}>TABLE OF CONTENTS</Text>
                        <View style={styles.tocList}>
                            {book?.toc.map((ch, i) => (
                                <PopButton key={i} styles={styles.tocChip} onPress={()=> setCurrentPage(i + 1)}>
                                    <Text style={styles.chipName}>{ch.title}</Text>
                                    <Text style={styles.chipPage}>
                                        P. {String(ch.cut).padStart(2, "0")}
                                    </Text>
                                </PopButton>
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
    pdfcontainer: {
        flex: 1,
        backgroundColor: pallete.bgmain,
    },

    pageContainer: {
        flex: 1,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
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
        // Same aspect ratio as the full-screen frame (screen width : screen
        // height), just scaled to CARD_SCALE — no more 4:5 mismatch.
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
        height: SCREEN_HEIGHT,
    }, pdfPlaceholder: {
        alignItems: "center",
        justifyContent: "center",
    },
    morphFrameInner: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
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
        marginTop : 15,
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
    chipName: { color: "#e5e7eb", fontSize: 14, fontWeight: "500"},
    chipPage: {
        fontSize: 12,
        fontWeight: "700",
        color: pallete.accent,
        backgroundColor: "rgba(1,121,111,0.15)",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
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