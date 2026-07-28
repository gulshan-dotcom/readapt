import { IChapter } from "./Chapter";

export interface IRecentRead {
  readtill: string;
  total: string;
  content: IChapter;
  readAt: string;
}
