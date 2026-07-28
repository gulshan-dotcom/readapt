
interface IAttemptedQuestion {
  question: string;
  answered: number;
}
import { SubscriptionPlan } from "../enums";
import { IChapter } from "./Chapter";

export interface IUser {
  _id: string;
  email: string;
  name: string;
  userId: string;
  subscription: {
    plan: SubscriptionPlan;
    expiresOn?: Date | null;
  };
  likes: IChapter[];
  image?: string;
  joinedSeries?: string;
  profileLevel: number;
  questionsAttempted: IAttemptedQuestion[];
  correctAnsStreak?: number;
  createdAt: Date;
  updatedAt: Date;
}