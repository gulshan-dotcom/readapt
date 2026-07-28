import { useContext } from "react";
import { ModalContext } from "../components/state/DataContext";

export const useModal = () => {
  const context = useContext(ModalContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
};