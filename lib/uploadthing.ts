
import { generateReactNativeHelpers } from "@uploadthing/expo";
import type { OurFileRouter } from "../types/uploadthing";

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || "https://redapt-admin-git-main-gulshan-dotcoms-projects.vercel.app/";

export const { useImageUploader } = generateReactNativeHelpers<OurFileRouter>({
  url: SERVER_URL + "/api/uploadthing",
});