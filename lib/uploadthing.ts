
import { generateReactNativeHelpers } from "@uploadthing/expo";
import type { OurFileRouter } from "../types/uploadthing";

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || "http://192.168.43.91:3000";

export const { useImageUploader } = generateReactNativeHelpers<OurFileRouter>({
  url: SERVER_URL + "/api/uploadthing",
});