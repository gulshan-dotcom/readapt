import React from "react";
import { Text, View } from "react-native";

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from "../../components/nav/MainNavigation";

type Props = NativeStackScreenProps<RootStackParamList, 'About'>;


const About = ({ route, navigation }: Props) => {
  return (
    <View>
      <Text>About the naveen kewat</Text>
    </View>
  );
};

export default About;
