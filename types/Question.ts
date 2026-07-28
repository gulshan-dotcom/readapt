
export interface IQuestion {
  _id: string;
  question: string;
  options: string[];
  correct: number; // index
  explanation?: string;
  comments: number;
  createdAt: string;
  updatedAt: string;
}
