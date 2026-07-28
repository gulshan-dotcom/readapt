import React, { useEffect, useState } from "react";
import { View } from "react-native";
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

type Props = NativeStackScreenProps<RootStackParamList, "RecentReads">;

const RecentReads = ({ route, navigation }: Props) => {
  const [accesstoken] = useAuth();
  const { showToast } = useToast();
  const [recentReads, setRecentReads] = useState<IRecentReadSection[] | null>(
    null,
  );

  useEffect(() => {
    const getUser = async () => {
      if (accesstoken) {
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
  }, [accesstoken]);

  if (!recentReads) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Nothing to show</Text>
      </View>
    );
  }

  const renderContentCard = ({ item }: { item: any }) => (
    <View style={{ marginBottom: 24 }}>
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
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reading History</Text>
      <FlatList
        data={recentReads}
        keyExtractor={(item) => item.date}
        renderItem={renderContentCard}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: pallete.bgmain || "#090314",
    paddingTop: 90,
  },
  date: {
    fontSize: 11,
    fontWeight: "600",
    color: pallete.textgray,
    marginTop: 20,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.5,
    color: pallete.textwhite,
    marginVertical: 40,
  },
});

export default RecentReads;
