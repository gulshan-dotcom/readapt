import { useContext } from "react";
import { AudioContext } from "../components/state/DataContext";

export const useGlobalAudio = () => {
  const context = useContext(AudioContext);

  if (!context) {
    throw new Error(
      "useGlobalAudio must be used inside AudioProvider"
    );
  }

  return context;
};