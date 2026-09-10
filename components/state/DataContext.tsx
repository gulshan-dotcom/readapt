import {
  createContext,
  useRef,
  useState,
  ReactNode,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { IUser } from "../../types/User";
import useAuth from "../../hooks/useAuth";
import { api } from "../../lib/api";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from "expo-audio";
import ReactNativeBlobUtil from "react-native-blob-util";
import { useNetworkStatus } from "../../hooks/useNetwork";

type ToastData = {
  title: string;
  time?: number;
};

type ModalData = {
  title: string;
  onCancel?: () => void;
  onConfirm: () => void;
};

type ToastContextType = {
  toast: ToastData | null;
  showToast: (toast: ToastData) => void;
  hideToast: () => void;
};

type ModalContextType = {
  modal: ModalData | null;
  showModal: (modal: ModalData) => void;
  hideModal: () => void;
};

type AudioContextType = {
  player: any;
  status: any;
  currentTrack: any;
  playTrack: (track: any) => void;
  togglePlay: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  removeAllTracks:  () => void;
};

export const AudioContext = createContext<AudioContextType | null>(null);
export const ToastContext = createContext<ToastContextType | null>(null);
export const ModalContext = createContext<ModalContextType | null>(null);
export const UserContext = createContext<{
  user: IUser | null;
  loadingUser: boolean;
  reload: () => Promise<void>;
} | null>(null);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<ToastData | null>(null);
  const [modal, setModal] = useState<ModalData | null>(null);
  const [user, setUser] = useState<IUser | null>(null);
  const { accessToken } = useAuth();
  const { isConnected } = useNetworkStatus();

  const [loadingUser, setLoadingUser] = useState(true);

  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = () => {
    if (toastTimeout.current) {
      clearTimeout(toastTimeout.current);
      toastTimeout.current = null;
    }

    setToast(null);
  };

  const showToast = (toastData: ToastData) => {
    if (toastTimeout.current) {
      clearTimeout(toastTimeout.current);
    }

    setToast(toastData);

    toastTimeout.current = setTimeout(() => {
      setToast(null);
      toastTimeout.current = null;
    }, toastData.time ?? 3000);
  };

  const showModal = (modal: ModalData) => {
    setModal(modal);
  };

  const hideModal = () => {
    setModal(null);
  };


  const getUser = useCallback(async () => {
    if (!accessToken) {
      setUser(null);
      return;
    }

    try {
      const data = await api.get(`/get-self`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const userData: IUser = data.data.data;
      console.log("fetched user");
      setUser(userData);
    } catch (error) {
      console.error("Error fetching user data:", error);
      showToast({ title: "Error" });
    } finally {
      setLoadingUser(false);
    }
  }, [ accessToken, isConnected ]);

  useEffect(() => {
    getUser();
  }, [getUser, isConnected]);

  const [currentTrack, setCurrentTrack] = useState<any>(null);

  const player = useAudioPlayer(currentTrack?.media ?? null, {
    updateInterval: 1000,
  });

  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: "doNotMix",
        });
      } catch (error) {
        console.log("Audio mode error:", error);
      }
    };

    setupAudio();
  }, []);

  const DEMO_AUDIO_URL =
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

  const playTrack = async (track: any) => {
    if (!isConnected && track.media.includes("file://")) {
      showToast({ title: "Please connect to internet to play audio" });
      return;
    }
    if (!track) return;

    const targetUrl = track.media || DEMO_AUDIO_URL;

    player.replace({ uri: targetUrl });

    setCurrentTrack(track);
  };

  const removeAllTracks = async () => {
    // `useAudioPlayer` owns the player lifecycle; removing it directly can
    // crash the app. Stop playback and clear the source instead.
    player.pause();
    setCurrentTrack(null);
  };

  /*
   * Enable Android notification / lock-screen controls
   */
  useEffect(() => {
    if (!currentTrack || !status?.isLoaded) return;

    try {
      player.setActiveForLockScreen(
        true,
        {
          title: currentTrack.title ?? "Audio",
          artist: currentTrack.author ?? "Unknown Artist",
          albumTitle: "Redapt",
          artworkUrl: currentTrack.cover,
        },
        {
          showSeekBackward: true,
          showSeekForward: true,
        },
      );
    } catch (error) {
      console.log("Lock screen setup error:", error);
    }

    return () => {
      try {
        player.clearLockScreenControls();
      } catch {}
    };
  }, [currentTrack, status?.isLoaded, player]);

  /*
   * Automatically start a newly selected track
   */
  // useEffect(() => {
  //   if (!currentTrack || !status?.isLoaded) return;

  //   player.play();
  // }, [currentTrack, status?.isLoaded]);

  const togglePlay = () => {
    if (!status?.isLoaded) return;

    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const pause = () => {
    player.pause();
  };

  const seekTo = (seconds: number) => {
    player.seekTo(seconds);
  };

  const value = useMemo(
    () => ({
      player,
      status,
      currentTrack,
      playTrack,
      togglePlay,
      pause,
      seekTo,
      removeAllTracks
    }),
    [player, status, currentTrack],
  );

  return (
    <AudioContext.Provider value={value}>
      <ToastContext.Provider
        value={{
          toast,
          showToast,
          hideToast,
        }}>
        <ModalContext.Provider
          value={{
            modal,
            showModal,
            hideModal,
          }}>
          <UserContext.Provider
            value={{
              user,
              loadingUser,
              reload: getUser,
            }}>
            {children}
          </UserContext.Provider>
        </ModalContext.Provider>
      </ToastContext.Provider>
    </AudioContext.Provider>
  );
};
