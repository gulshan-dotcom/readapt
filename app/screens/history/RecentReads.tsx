import React, { useEffect, useState } from "react";
import { Dimensions, ScrollView, View } from "react-native";
import useAuth from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FlatList, StyleSheet, Text } from "react-native";
import { IRecentRead } from "../../../types/Storage";
import Contentprogress from "../../../components/props/ContentProgress";
import pallete from "../../../lib/Colors";

interface IRecentReadSection {
  date: string;
  data: IRecentRead[];
}
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../components/nav/MainNavigation";
import { Circle, G, Mask, Path, Rect, Svg } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const { width } = Dimensions.get("window")

type Props = NativeStackScreenProps<RootStackParamList, "RecentReads">;

const RecentReads = ({ route, navigation }: Props) => {
  const { accessToken } = useAuth();
  const { showToast } = useToast();
  const [recentReads, setRecentReads] = useState<IRecentReadSection[] | null>(
    null,
  );
  const insets = useSafeAreaInsets()

  useEffect(() => {
    const getUser = async () => {
      if (accessToken) {
        try {
          const readChapters = await AsyncStorage.getItem("recentReads");
          if (!readChapters) return;
          const recentReads: IRecentRead[] = JSON.parse(readChapters);
          const grouped = recentReads.reduce<Record<string, IRecentRead[]>>(
            (acc, item) => {
              const date = new Date(item.readAt)
                .toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
                .replace(/,/g, "");

              if (!acc[date]) {
                acc[date] = [];
              }

              acc[date].push(item);

              return acc;
            },
            {},
          );

          const sections: IRecentReadSection[] = Object.entries(grouped).map(
            ([date, data]) => ({
              date,
              data,
            }),
          );

          setRecentReads(sections);
        } catch (error) {
          console.error("Error fetching series data:", error);
          showToast({ title: "Error" });
        }
      }
    };
    getUser();
  }, [ accessToken ]);

  const renderContentCard = ({ item }: { item: any }) => (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.date}>{item.date.toUpperCase()}</Text>

      {item.data.map((read: any) => (
        <Contentprogress
          id={read.content._id}
          cover={read.content.cover}
          title={read.content.title}
          readtill={read.readtill}
          total={read.total}
          type={read.content.type}
          author={read.content.author}
          learWidth={width /100 * 90}
        />
      ))}
    </View>
  );

  return (
    <View style={[styles.container,{paddingBottom: insets.bottom }]}>
      <ScrollView >
      <Text style={styles.title}>Reading History</Text>
      <FlatList
        data={recentReads}
        keyExtractor={(item, index) => index + item.data[0].content._id + ""}
        renderItem={renderContentCard}
        numColumns={1}
        scrollEnabled={false}
        contentContainerStyle={{
          paddingHorizontal: 0,
        }}
        ListEmptyComponent={
          <View style={styles.emptyReadsPage}>
            <View style={styles.emptyIconCircle}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Mask
                  id="mask0"
                  maskUnits="userSpaceOnUse"
                  x={0}
                  y={0}
                  width={24}
                  height={24}>
                  <Rect width={24} height={24} fill="white" />
                  <Circle cx={18} cy={6} r={5} fill="black" />
                </Mask>
                <G mask="url(#mask0)">
                  <Path
                    d="M4 19C4 19 5.5 18 9 18C12.5 18 12 21 12 21C12 21 11.5 18 15 18C18.5 18 20 19 20 19V6C20 6 18.5 5 15 5C11.5 5 12 8 12 8C12 8 12.5 5 9 5C5.5 5 4 6 4 6V19Z"
                    stroke="#01796F"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </G>
                <Circle
                  cx={18}
                  cy={6}
                  r={4}
                  stroke="#01796F"
                  strokeWidth={1.5}
                  fill="none"
                />
                <Path
                  d="M18 4.5V6L19 7"
                  stroke="#01796F"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text style={styles.emptyTitleText}>No Recent Reads</Text>
            <Text style={styles.emptySubText}>
              Books and audio chapters you read or listen to will appear here
              automatically.
            </Text>
          </View>
        }
      />
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: pallete.bgmain || "#090314",
    paddingTop: 90,
    alignItems: "center",
    justifyContent: "center"
  },
  date: {
    fontSize: 11,
    fontWeight: "600",
    color: pallete.textgray,
    marginVertical: 20
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.5,
    color: pallete.textwhite,
    marginVertical: 40,
  },
  emptyReadsPage: {
    flex: 1,
    paddingVertical: 60,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(1, 121, 111, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(1, 121, 111, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 6,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 12,
    color: "#9CA3AF",
    lineHeight: 18,
    maxWidth: 240,
    textAlign: "center",
  },
});

export default RecentReads;
