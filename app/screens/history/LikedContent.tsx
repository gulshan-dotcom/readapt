import React from "react";
import { ScrollView, View } from "react-native";
import ContentCard from "../../../components/props/ContentCard";
import { FlatList, StyleSheet, Text } from "react-native";
import { useUser } from "../../../hooks/useUser";
import pallete from "../../../lib/Colors";

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../components/nav/MainNavigation";
import { Path, Svg } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Offline from "../../../components/state/Offline";
import { useNetworkStatus } from "../../../hooks/useNetwork";

type Props = NativeStackScreenProps<RootStackParamList, "LikedContent">;

const LikedContent = ({ route, navigation }: Props) => {
  const { user, loadingUser } = useUser();
  const insets = useSafeAreaInsets()
  const { isConnected  } = useNetworkStatus()

  const renderContentCard = ({ item }: { item: any }) => {
    return <ContentCard key={item._id} book={item} />;
  };

  console.log(isConnected, "is it commentted")

  if (!user && !isConnected) {
    return <View style={[styles.container,{paddingBottom: insets.bottom,}]}>
      <Offline />
    </View>;
  }

  return (
    <View style={[styles.container,{paddingBottom: insets.bottom }]}>
            
      {user?.likes && !loadingUser && (
        <FlatList
          data={user?.likes}
          keyExtractor={(item) => item._id}
          renderItem={renderContentCard}
          numColumns={2}
          scrollEnabled={true}
          columnWrapperStyle={{
            gap: 20,
          }}
          ListHeaderComponent={<Text style={styles.title}>Liked Content</Text>}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyLikedBox}>
              <View style={styles.emptyIconCircle}>
                <Svg
                  width={24}
                  height={24}
                  viewBox="0 0 24 24"
                  fill={pallete.accent || "#01796F"}>
                  <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </Svg>
              </View>

              <Text style={styles.emptyTitleText}>No Liked Content</Text>
              <Text style={styles.emptySubText}>
                Books and audios you like will appear here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: pallete.bgmain || "#090314",
    paddingTop: 90,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.5,
    color: pallete.textwhite,
    marginVertical: 40,
  },
  listContent: {
    flexGrow: 1,
    // alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  emptyLikedBox: {
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
    color: "#FFFFFF", // Maps to var(--text-white)
    marginBottom: 6,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 12,
    color: "#9CA3AF", // Maps to var(--text-gray)
    lineHeight: 18, // 12px * 1.5 line-height = 18px
    maxWidth: 240,
    textAlign: "center",
  },
});

export default LikedContent;
