import React from "react";
import * as Network from "expo-network";

const useOffline = () => {
  const checkConnection = async () => {
    const status = await Network.getNetworkStateAsync();
    return status.isConnected;
  };
  checkConnection();
};
export default useOffline;
