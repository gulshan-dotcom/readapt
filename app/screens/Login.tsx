import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
// import * as Google from "expo-auth-session/providers/google";
// import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
// import { makeRedirectUri } from "expo-auth-session";
import useAuth from "../../hooks/useAuth";
import Svg, { G, Path } from "react-native-svg";
import axios from "axios";
import { useToast } from "../../hooks/useToast";
import { ParamListBase, RouteProp } from "@react-navigation/native";
import pallete from "../../lib/Colors";
import { api } from "../../lib/api";
import PopButton from "../../components/props/PopButton";

type Props = {
  route: RouteProp<ParamListBase, "Login">;
  navigation: any;
};

const BACKEND_LOGIN_URL = "/auth/login";

// WebBrowser.maybeCompleteAuthSession();

const Login = ({ route, navigation }: Props) => {
  const [accessToken, isLoggedIn, isLoading] = useAuth();
  const { showToast } = useToast();
  // const [request, response, promptAsync] = Google.useAuthRequest({
  //   androidClientId:
  //     "286065569518-rga0aatttorkd7va26ubs19negeb3itq.apps.googleusercontent.com",
  //   redirectUri: makeRedirectUri({
  //     native: "com.waves.kewat:/redirect",
  //   }),
  //   scopes: ["openid", "profile", "email"],
  //   responseType: "token",
  // });

  const [isLoadingUi, setIsLoadingUi] = useState(false);

  // useEffect(() => {
  //   if (response?.type === "success") {
  //     const { authentication } = response;
  //     if (authentication) {
  //       handleBackendLogin(authentication.accessToken);
  //     }
  //   }
  // }, [response]);

  useEffect(() => {
    if (isLoggedIn) {
      navigation.replace("Tabs");
    }
  }, [isLoading, isLoggedIn]);

  // const handleBackendLogin = async (
  //   googleAccessToken: string,
  // ): Promise<void> => {
  //   try {
  //     const { data } = await api.post(BACKEND_LOGIN_URL, {
  //       provider: "google",
  //       googleAccessToken,
  //     });

  //     await SecureStore.setItemAsync(
  //       "accessToken",
  //       JSON.stringify({ token: data.token, expiry: data.expiry }),
  //     );

  //     showToast({
  //       title: "You're Welcome"
  //     });

  //     navigation.replace("HomeTabs");
  //   } catch (err: any) {
  //     Alert.alert("Error", err.message);
  //   }
  // };

  const dummyLogin = async () => {
    await SecureStore.setItemAsync(
      "accessToken",
      JSON.stringify({
        token:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2YTQxZGJiM2JhNGMwNjE1ZjM4ZGI5YmMiLCJlbWFpbCI6InJvbGVAdXNlci5jb20iLCJ1c2VySWQiOiJyb2xlIiwiaWF0IjoxNzgyNzAwOTc5LCJleHAiOjE3ODUyOTI5Nzl9.0Y-ZDlcY7RiBT4-T43njN2z6F0DtQYxJLu3RH4a2kxk",
        expiry: "1785311879022",
      }),
    );
    navigation.replace("Tabs");
  };

  return (
    <View style={styles.container}>
      <View style={styles.loginContainer}>
        <View style={styles.brandHeader}>
          <Text style={styles.brandTitle}>Naveen Kewat</Text>
          <Text style={styles.brandSubtitle}>Let's get you signed in</Text>
        </View>

        {isLoadingUi ? (
          <Text style={styles.processingText}>Processing login...</Text>
        ) : (
          <PopButton
            styles={styles.googleButton}
            // activeOpacity={0.9}
            // onPress={() => promptAsync()}
            onPress={() => dummyLogin()}>
            <Svg width={20} height={20} viewBox="0 0 32 32">
              <G>
                <Path
                  d="M23.75,16A7.7446,7.7446,0,0,1,8.7177,18.6259L4.2849,22.1721A13.244,13.244,0,0,0,29.25,16"
                  fill="#00AC47"
                />
                <Path
                  d="M23.75,16a7.7387,7.7387,0,0,1-3.2516,6.2987l4.3824,3.5059A13.2042,13.2042,0,0,0,29.25,16"
                  fill="#4285F4"
                />
                <Path
                  d="M8.25,16a7.698,7.698,0,0,1,.4677-2.6259L4.2849,9.8279a13.177,13.177,0,0,0,0,12.3442l4.4328-3.5462A7.698,7.698,0,0,1,8.25,16Z"
                  fill="#FFBA00"
                />
                <Path
                  d="M16,8.25a7.699,7.699,0,0,1,4.558,1.4958l4.06-3.7893A13.2152,13.2152,0,0,0,4.2849,9.8279l4.4328,3.5462A7.756,7.756,0,0,1,16,8.25Z"
                  fill="#EA4335"
                />
                <Path
                  d="M29.25,15v1L27,19.5H16.5V14H28.25A1,1,0,0,1,29.25,15Z"
                  fill="#4285F4"
                />
              </G>
            </Svg>

            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </PopButton>
        )}
        <Text style={styles.footerText}>
          By continuing, you agree to our Terms & Privacy Policy
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: pallete.bgmain,
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  loginContainer: {
    width: "100%",
    alignSelf: "center",
  },

  brandHeader: {
    alignItems: "center",
    marginBottom: 42,
  },

  brandTitle: {
    fontSize: 54,
    fontWeight: "900",
    color: pallete.textwhite,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  brandSubtitle: {
    marginTop: 10,
    color: pallete.textgray,
    fontSize: 15,
    fontWeight: "500",
  },

  googleButton: {
    height: 58,
    borderRadius: 16,
    backgroundColor: "#090314",

    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    borderWidth: 1,
    borderColor: "#64646b",

    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 8,
  },

  googleButtonText: {
    marginLeft: 14,
    fontSize: 16,
    fontWeight: "700",
    color: "#64646b",
  },

  processingText: {
    textAlign: "center",
    color: pallete.textgray,
    fontSize: 16,
  },
  footerText: {
    marginTop: 18,
    textAlign: "center",
    color: pallete.textgray,
    fontSize: 12,
    lineHeight: 18,
  },
});

export default Login;
