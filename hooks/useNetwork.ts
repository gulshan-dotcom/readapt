import { useState, useEffect } from 'react';
import * as Network from 'expo-network';

export const useNetworkStatus = () => {
  const [status, setStatus] = useState({
    isConnected: true,
  });

  useEffect(() => {
    let subscription: ReturnType<typeof Network.addNetworkStateListener>;

    const checkNetwork = async () => {
      // Get initial state
      const state = await Network.getNetworkStateAsync();
      setStatus({
        isConnected: !!state.isConnected,
      });

      // Listen for network changes
      subscription = Network.addNetworkStateListener((state) => {
        setStatus({
          isConnected: !!state.isConnected,
        });
      });
    };

    checkNetwork();

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  return status;
};