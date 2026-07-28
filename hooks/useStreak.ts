import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STREAK_KEY = "streak";

export const updateStreak = async () => {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const rawData = await AsyncStorage.getItem(STREAK_KEY);

  if (!rawData) {
    const newStreakData = { streak: 1, lastDate: todayStr };
    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(newStreakData));
    return newStreakData;
  }

  const { streak, lastDate } = JSON.parse(rawData);

  const todayMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const [year, month, day] = lastDate.split("-").map(Number);
  const lastMs = Date.UTC(year, month - 1, day);

  const diffInDays = Math.floor((todayMs - lastMs) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return { streak, lastDate };
  }

  const newStreak: number = diffInDays === 1 ? streak + 1 : 1;
  const updatedData: { streak: number; lastDate: string } = {
    streak: newStreak,
    lastDate: todayStr,
  };

  await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(updatedData));
  return { isUpdated: diffInDays === 1 || !rawData, update: updatedData };
};

export const useStreak = () => {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const [streakData, setStreakData] = useState({
    streak: 0,
    lastDate: todayStr,
  });
  const [loading, setLoading] = useState(true);

  const refreshStreak = useCallback(async () => {
    setLoading(true);
    try {
      const data = await updateStreak();
      if (!data.update) return;
      setStreakData(data.update);
    } catch (error) {
      console.error("Failed to update streak:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStreak();
  }, [refreshStreak]);

  return {
    streak: streakData.streak,
    lastDate: streakData.lastDate,
    loading,
    refreshStreak,
  };
};
