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
import TrackPlayer, {
  Capability,
  Event,
  State,
  useProgress,
  useTrackPlayerEvents,
} from "react-native-track-player";
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
  removeAllTracks: () => void;
};

export const AudioContext = createContext<AudioContextType | null>(null);
export const ToastContext = createContext<ToastContextType | null>(null);
export const ModalContext = createContext<ModalContextType | null>(null);
export const UserContext = createContext<{
  user: IUser | null;
  loadingUser: boolean;
  reload: () => Promise<void>;
} | null>(null);

const DEMO_AUDIO_URL =
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

// NOTE: the exact nightly you have pinned
// ("react-native-track-player@5.0.0-alpha0-nightly-...") still ships the
// pre-rename package name (`react-native-track-player`, not `@rntp/player`)
// and, as of alpha0, still speaks the older/V4-style JS API (add/play/
// updateOptions/Capability) rather than the newer setMediaItems/
// PlayerCommand API that later V5 builds settled on. This file is written
// against that older surface to match what's actually installed. Double-
// check node_modules/react-native-track-player/package.json's "version"
// and its type declarations if anything here doesn't match — alpha/nightly
// builds change their API between commits.
//
// Also worth knowing: there's an open, unresolved upstream issue reporting
// that this exact alpha0 line doesn't play tracks at all on iOS
// (doublesymmetry/react-native-track-player#2503). Worth confirming
// playback actually works on a real iOS device/simulator before relying on
// this pinned commit for anything real.

let setupPromise: Promise<void> | null = null;

const ensurePlayerSetup = () => {
  if (!setupPromise) {
    setupPromise = TrackPlayer.setupPlayer()
      .then(() =>
        TrackPlayer.updateOptions({
          capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.Stop,
            Capability.SeekTo,
          ],
          compactCapabilities: [Capability.Play, Capability.Pause],
        }),
      )
      .catch((error) => {
        console.log("Audio setup error:", error);
        setupPromise = null; // allow a retry on the next playTrack/mount
        throw error;
      });
  }
  return setupPromise;
};

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
  }, [accessToken, isConnected]);

  useEffect(() => {
    getUser();
  }, [getUser, isConnected]);

  // ── react-native-track-player (alpha0 nightly, pre-@rntp/player) ──
  useEffect(() => {
    ensurePlayerSetup().catch(() => {});
  }, []);

  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [playerState, setPlayerState] = useState<State>(State.None);
  const { position, duration } = useProgress();

  useTrackPlayerEvents(
    [Event.PlaybackState, Event.PlaybackError],
    (event) => {
      if (event.type === Event.PlaybackState) {
        setPlayerState(event.state);
      } else if (event.type === Event.PlaybackError) {
        console.log("Playback error:", event);
      }
    },
  );

  const isPlayingNow = playerState === State.Playing;
  const isLoaded =
    !!currentTrack && playerState !== State.None && playerState !== State.Error;

  const status = useMemo(
    () => ({
      playing: isPlayingNow,
      isLoaded,
      duration,
      currentTime: position,
      playbackState: playerState,
    }),
    [isPlayingNow, isLoaded, duration, position, playerState],
  );

  // Kept as a stable "player" facade (play/pause/seekTo/setPlaybackRate)
  // so existing consumers that call `player.seekTo(...)` or
  // `player.setPlaybackRate(...)` (see AudioRdr.tsx) don't need to change.
  const player = useMemo(
    () => ({
      play: () => TrackPlayer.play(),
      pause: () => TrackPlayer.pause(),
      seekTo: (sec: number) => TrackPlayer.seekTo(sec),
      setPlaybackRate: (rate: number) => TrackPlayer.setRate(rate),
      replace: async (source: { uri: string }) => {
        await ensurePlayerSetup();
        await TrackPlayer.reset();
        await TrackPlayer.add({
          id: source.uri,
          url: source.uri,
          media: source.uri,
        });
        await TrackPlayer.play();
      },
    }),
    [],
  );

  const playTrack = useCallback(
    async (track: any) => {
      if (!track) return;
      if (!isConnected && track.media?.includes("file://")) {
        showToast({ title: "Please connect to internet to play audio" });
        return;
      }

      const targetUrl = track.media || DEMO_AUDIO_URL;

      try {
        await ensurePlayerSetup();
        // Lock-screen / notification metadata (title, artist, artwork) is
        // picked up automatically from these fields.
        await TrackPlayer.reset();
        await TrackPlayer.add({
          ...track,
          id: track._id ?? targetUrl,
          url: targetUrl,
          media: targetUrl,
          title: track.title ?? "Audio",
          artist: track.author ?? "Unknown Artist",
          artwork: track.cover,
        });
        // await TrackPlayer.play();
        setCurrentTrack(track);
      } catch (error) {
        console.log("Error playing track:", error);
      }
    },
    [isConnected],
  );

  const removeAllTracks = useCallback(async () => {
    try {
      await TrackPlayer.reset();
      setCurrentTrack(null);
    } catch (error) {
      console.log("Error clearing tracks:", error);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (!isLoaded) return;

    if (isPlayingNow) {
      TrackPlayer.pause();
    } else {
      TrackPlayer.play();
    }
  }, [isLoaded, isPlayingNow]);

  const pause = useCallback(() => {
    TrackPlayer.pause();
  }, []);

  const seekTo = useCallback((seconds: number) => {
    TrackPlayer.seekTo(seconds);
  }, []);

  const value = useMemo(
    () => ({
      player,
      status,
      currentTrack,
      playTrack,
      togglePlay,
      pause,
      seekTo,
      removeAllTracks,
    }),
    [player, status, currentTrack, playTrack, togglePlay, pause, seekTo, removeAllTracks],
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