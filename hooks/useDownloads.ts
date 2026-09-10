import { useState, useEffect, useCallback } from 'react';
import ReactNativeBlobUtil from 'react-native-blob-util';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IChapter } from '../types/Chapter';
import * as FileSystem from 'expo-file-system/legacy';

const DOWNLOADS_KEY = '@downloaded_chapters';

export interface DownloadedChapter extends IChapter {
  localUri: string;
  dateAdded: string;
  fileSize: string;
}

export interface DownloadStatus {
  id: string;
  percent: number;
  progressText: string;
  status: 'downloading' | 'completed' | 'failed';
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 MB';

  const mb = bytes / (1024 * 1024);

  if (mb >= 1) {
    return `${mb.toFixed(1)} MB`;
  }

  const kb = bytes / 1024;
  return `${Math.round(kb)} KB`;
};

const formatDateAdded = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();

  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 3600 * 24)
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const useDownloads = () => {
  const [downloads, setDownloads] = useState<DownloadedChapter[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [downloadStatuses, setDownloadStatuses] = useState<
    Record<string, DownloadStatus>
  >({});

  // --------------------------------------------------
  // Load saved downloads
  // --------------------------------------------------

  const loadDownloads = useCallback(async () => {
    try {
      setIsLoading(true);

      const jsonValue = await AsyncStorage.getItem(DOWNLOADS_KEY);

      const data: DownloadedChapter[] =
        jsonValue != null ? JSON.parse(jsonValue) : [];

      setDownloads(data);
    } catch (error) {
      console.error('Error reading downloads:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDownloads();
  }, [loadDownloads]);

  // --------------------------------------------------
  // Download chapter
  // --------------------------------------------------

const downloadChapter = async (
  chapter: IChapter
): Promise<string | null> => {
  const chapterId = chapter._id;

  try {
    setDownloadStatuses((prev) => ({
      ...prev,
      [chapterId]: {
        id: chapterId,
        percent: 0,
        progressText: '0%',
        status: 'downloading',
      },
    }));

    const fileExtension =
      chapter.media
        ?.split('?')[0]
        .split('.')
        .pop()
        ?.toLowerCase() ||
      (chapter.type === 'audio' ? 'mp3' : 'pdf');

    const targetDir = FileSystem.documentDirectory;

    if (!targetDir) {
      throw new Error('Document directory is unavailable');
    }

    const localPath =
      `${targetDir}${chapterId}.${fileExtension}`;

    // --------------------------------------------------
    // Check whether already downloaded
    // --------------------------------------------------

    const fileInfo =
      await FileSystem.getInfoAsync(localPath);

    if (fileInfo.exists) {

      const size =
        'size' in fileInfo
          ? Number(fileInfo.size || 0)
          : 0;

      const newEntry: DownloadedChapter = {
        ...chapter,
        localUri: fileInfo.uri,
        dateAdded: (new Date()).toISOString(),
        fileSize: formatFileSize(size),
      };

      const jsonValue =
        await AsyncStorage.getItem(
          DOWNLOADS_KEY
        );

      const existing: DownloadedChapter[] =
        jsonValue
          ? JSON.parse(jsonValue)
          : [];

      const updated = [
        newEntry,
        ...existing.filter(
          (item) => item._id !== chapterId
        ),
      ];

      await AsyncStorage.setItem(
        DOWNLOADS_KEY,
        JSON.stringify(updated)
      );

      setDownloads(updated);

      setDownloadStatuses((prev) => ({
        ...prev,
        [chapterId]: {
          id: chapterId,
          percent: 100,
          progressText: 'Downloaded',
          status: 'completed',
        },
      }));

      return fileInfo.uri;
    }

    const result = await FileSystem.downloadAsync(
      chapter.media,
      localPath
    );

    if (!result.uri) {
      throw new Error(
        'Download completed but URI is missing'
      );
    }

    // --------------------------------------------------
    // Check downloaded file
    // --------------------------------------------------

    const downloadedInfo =
      await FileSystem.getInfoAsync(
        result.uri
      );

    if (!downloadedInfo.exists) {
      throw new Error(
        'Downloaded file does not exist'
      );
    }

    const fileSize =
      'size' in downloadedInfo
        ? Number(downloadedInfo.size || 0)
        : 0;

    if (fileSize <= 0) {
      throw new Error(
        'Downloaded file is empty'
      );
    }

    const fileSizeFormatted =
      formatFileSize(fileSize);

    // --------------------------------------------------
    // Create download record
    // --------------------------------------------------

    const newEntry: DownloadedChapter = {
      ...chapter,
      localUri: result.uri,
      dateAdded: (new Date()).toISOString(),
      fileSize: fileSizeFormatted,
    };

    // --------------------------------------------------
    // Save metadata
    // --------------------------------------------------

    const jsonValue =
      await AsyncStorage.getItem(
        DOWNLOADS_KEY
      );

    const existing: DownloadedChapter[] =
      jsonValue
        ? JSON.parse(jsonValue)
        : [];

    const updated = [
      newEntry,
      ...existing.filter(
        (item) => item._id !== chapterId
      ),
    ];

    await AsyncStorage.setItem(
      DOWNLOADS_KEY,
      JSON.stringify(updated)
    );

    setDownloads(updated);

    // --------------------------------------------------
    // Completed
    // --------------------------------------------------

    setDownloadStatuses((prev) => ({
      ...prev,
      [chapterId]: {
        id: chapterId,
        percent: 100,
        progressText: 'Downloaded',
        status: 'completed',
      },
    }));

    return result.uri;

  } catch (error: any) {
    console.error(
      'Download error:',
      error
    );

    console.error(
      'Download error message:',
      error?.message
    );

    setDownloadStatuses((prev) => ({
      ...prev,
      [chapterId]: {
        id: chapterId,
        percent: 0,
        progressText: 'Failed',
        status: 'failed',
      },
    }));

    return null;
  }
};

  // --------------------------------------------------
  // Delete chapter
  // --------------------------------------------------

  const deleteChapter = async (id: string): Promise<void> => {
    try {
      const itemToDelete = downloads.find(
        (item) => item._id === id
      );

      if (itemToDelete) {
        // Remove file:// prefix before RNBU fs operations
        const path = itemToDelete.localUri.replace(
          /^file:\/\//,
          ''
        );

        const exists = await ReactNativeBlobUtil.fs.exists(path);

        if (exists) {
          await ReactNativeBlobUtil.fs.unlink(path);
        }
      }

      const updated = downloads.filter(
        (item) => item._id !== id
      );

      await AsyncStorage.setItem(
        DOWNLOADS_KEY,
        JSON.stringify(updated)
      );

      setDownloads(updated);

      setDownloadStatuses((prev) => {
        const copy = { ...prev };

        delete copy[id];

        return copy;
      });
    } catch (error) {
      console.error('Failed to delete chapter:', error);
    }
  };

  return {
    downloads,
    isLoading,
    downloadStatuses,
    downloadChapter,
    deleteChapter,
    refreshDownloads: loadDownloads,
  };
};