import { MediaType, SubscriptionPlan } from "../enums";

export type IChapter = {
  _id: string;
  title: string;
  details?: string;
  media: string; // URL
  type: "pdf" | "audio";
  for: SubscriptionPlan;
  isTrending: boolean;
  comments: number;
  cover: string;
  category: string;
  series?: string;
  likes: number;
  author: string,
  total: number,
  isDownloadable: boolean;
  toc: {
    cut: string;
    title: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}