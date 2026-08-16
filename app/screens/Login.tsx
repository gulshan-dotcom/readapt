import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert, ActivityIndicator } from "react-native";
import * as SecureStore from "expo-secure-store";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import useAuth from "../../hooks/useAuth";
import Svg, { G, Path } from "react-native-svg";
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

// 1. Configure Google Sign-In outside or in useEffect
GoogleSignin.configure({
  // Get this from your Google Cloud Console / Firebase (OAuth 2.0 Client ID for Web)
  webClientId: "743066184878-es8jqus96o8ip2qlrmd7md7n5o5j8ndv.apps.googleusercontent.com", 
  offlineAccess: true, // Set to true if you need refresh tokens on your backend
});

const Login = ({ route, navigation }: Props) => {
  const [accessToken, isLoggedIn, isLoading] = useAuth();
  const { showToast } = useToast();
  const [isLoadingUi, setIsLoadingUi] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      navigation.replace("Tabs");
    }
  }, [isLoading, isLoggedIn]);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoadingUi(true);

      // Check if Play Services are available (Android)
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Perform native sign-in
      const response = await GoogleSignin.signIn();

      // Retrieve tokens (idToken or accessToken depending on your backend contract)
      console.log("token mil gaya: ", response.data?.idToken)
      const idToken = response.data?.idToken;
      const tokens = await GoogleSignin.getTokens(); // Returns { accessToken, idToken }

      if (idToken || tokens.accessToken) {
        await handleBackendLogin(tokens.accessToken || idToken);
      } else {
        throw new Error("Failed to retrieve Google tokens");
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled the sign-in flow
        console.log("User cancelled Google Sign-In");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Operation (e.g. sign in) is in progress already
        console.log("Google Sign-In already in progress");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert("Error", "Google Play Services are not available or updated.");
      } else {
        Alert.alert("Login Failed", error.message || "An unexpected error occurred.");
      }
    } finally {
      setIsLoadingUi(false);
    }
  };

  const handleBackendLogin = async (googleAccessToken: string): Promise<void> => {
    try {
      const { data } = await api.post(BACKEND_LOGIN_URL, {
        provider: "google",
        googleAccessToken,
      });

      await SecureStore.setItemAsync(
        "accessToken",
        JSON.stringify({ token: data.token, expiry: data.expiry })
      );

      showToast({
        title: "You're Welcome",
      });

      navigation.replace("Tabs");
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || err.message || "Backend login failed");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.loginContainer}>
        <View style={styles.brandHeader}>
          <Text style={styles.brandTitle}>Naveen Kewat</Text>
          <Text style={styles.brandSubtitle}>Let's get you signed in</Text>
        </View>

        {isLoadingUi ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="small" color={pallete.textwhite} />
            <Text style={styles.processingText}>Processing login...</Text>
          </View>
        ) : (
          <PopButton
            styles={styles.googleButton}
            onPress={handleGoogleSignIn}
          >
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

  loadingWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
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