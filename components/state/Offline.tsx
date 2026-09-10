import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import PopButton from "../props/PopButton";
import pallete from "../../lib/Colors";

const Offline = () => {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Image
        source={require("../../assets/offline.png")}
        style={{ width: 300, height: 300, resizeMode: "cover", borderColor: "transparent" }}
      />
      <PopButton styles={style.button}><Text style={style.buttonText}>Refresh</Text></PopButton>
    </View>
  );
};

const style = StyleSheet.create({
  button: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    backgroundColor: pallete.accent,
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 50,
  },
  buttonText: {
    fontSize: 16,
    color: pallete.textwhite,
  }
})

export default Offline;
