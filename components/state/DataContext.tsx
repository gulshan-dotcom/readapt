import {
  createContext,
  useRef,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { IUser } from "../../types/User";
import useAuth from "../../hooks/useAuth";
import { api } from "../../lib/api";

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
  const [accessToken] = useAuth();

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
      const userData : IUser = data.data.data
      console.log(userData, user)
      setUser(userData);
    } catch (error) {
      console.error("Error fetching series data:", error);
      showToast({ title: "Error" });
    } finally {
      setLoadingUser(false);
    }
  }, [accessToken]);

  useEffect(() => {
    getUser();
  }, [getUser]);

  return (
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
  );
};
