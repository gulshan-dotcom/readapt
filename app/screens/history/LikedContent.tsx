import React from "react";
import { View } from "react-native";
import ContentCard from "../../../components/props/ContentCard";
import { FlatList, StyleSheet, Text } from "react-native";
import { useUser } from "../../../hooks/useUser";
import pallete from "../../../lib/Colors";

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../components/nav/MainNavigation";

type Props = NativeStackScreenProps<RootStackParamList, "LikedContent">;

const LikedContent = ({ route, navigation }: Props) => {
  const { user, loadingUser } = useUser();

  const renderContentCard = ({ item }: { item: any }) => {
    return <ContentCard key={item._id} book={item} />;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Liked Content</Text>
      {user?.likes && !loadingUser && (
        <FlatList
          data={user?.likes}
          keyExtractor={(item) => item._id}
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
});

export default LikedContent;
