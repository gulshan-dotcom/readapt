
import { generateReactNativeHelpers } from "@uploadthing/expo";
import type { OurFileRouter } from "../types/uploadthing";

const SERVER_URL = "https://redapt-admin-sand.vercel.app";
const UPLOADTHING_URL =
  process.env.EXPO_PUBLIC_UPLOADTHING_URL ||
  (SERVER_URL ? `${SERVER_URL}/api/uploadthing` : "");

export const hasUploadThingConfig = Boolean(
  UPLOADTHING_URL && UPLOADTHING_URL.startsWith("http"),
);

export const { useImageUploader } = hasUploadThingConfig
  ? generateReactNativeHelpers<OurFileRouter>({
      url: UPLOADTHING_URL,
    })
  : ({
      useImageUploader: () => ({
        openImagePicker: () => {
          throw new Error(
            "UploadThing is not configured. Set EXPO_PUBLIC_UPLOADTHING_URL or EXPO_PUBLIC_SERVER_URL to your backend URL.",
          );
        },
        isUploading: false,
      }),
    } as any);