import React, { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import * as Network from "expo-network";

const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [isLoading, setisLoading] = useState(true);

  const checkLogin = async () => {
    const storedToken = await SecureStore.getItemAsync("accessToken");

    if (!storedToken) {
      setisLoading(false);
      setIsLoggedIn(false);
      return;
    }
    const acessToken: { token: string; expiry: string } =
      JSON.parse(storedToken);

    // if (acessToken) {
    //   console.log(acessToken.token,"accessToken");
    //   console.log(acessToken.expiry,"expiry");
    // }

    if (!acessToken) {
      setIsLoggedIn(false);
      console.log("acess token not found");
      return;
    }
    // console.log("token found")

    const expiryTime = parseInt(acessToken.expiry);
    const now = Date.now();

    if (now > expiryTime) {
      console.log("you should exxpire")
      await SecureStore.deleteItemAsync("accessToken");
      setIsLoggedIn(false);
      setisLoading(false);
      return;
    } else {
      setAccessToken(acessToken.token);
      setIsLoggedIn(true);
    }
    setisLoading(false);

    // try {
    //   console.log("Checking login status with backend...");
    //   const res = await fetch(
    //     "http://10.0.2.2:3000/user/login/verify",
    //     {
    //       method: "POST",
    //       headers: { Authorization: `Bearer ${acessToken.token}` },
    //     }
    //   );

    //   if (res.ok) {

    //     setIsLoggedIn(true);
    //     setisLoading(false);
    //     console.log("Login check successful");
    //   } else {
    //     setisLoading(false);
    //     console.log("Login check failed:", res.statusText);
    //     setIsLoggedIn(false);
    //   }
    // } catch (err) {
    //   setisLoading(false);
    //   console.error("Login check failed:", err.message);
    //   setIsLoggedIn(false);
    // }
  };
  useEffect(() => {
    checkLogin();
  }, []);

  return {accessToken, isLoggedIn, isLoading, checkLogin};
};

export default useAuth;
