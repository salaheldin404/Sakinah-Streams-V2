import { Activity } from "@/types/activity";
import { DateTime } from "luxon";
import { THEMES } from "./galaxy";
import { Verse } from "@/types/verse";
import { Pagination } from "@/types/paginate";

export interface JourneyStats {
  currentStreak: number;
  longestStreak: number;
  totalReadingDays: number;
  totalPagesRead: number;
  totalSecondsRead: number;
  consistencyPercentage: number;
  isReadToday: boolean;
  heatmapData: {
    date: string;
    count: number;
    pages: number;
    minutes: number;
    seconds: number;
  }[];
  achievements: {
    id: string;
    isUnlocked: boolean;
    progress: number;
  }[];
  insights: {
    mostReadSurahId: number | null;
    mostReadThemeId: string | null;
  };
}

const EMPTY_JOURNEY_STATS: JourneyStats = {
  currentStreak: 0,
  longestStreak: 0,
  totalReadingDays: 0,
  totalPagesRead: 0,
  totalSecondsRead: 0,
  consistencyPercentage: 0,
  isReadToday: false,
  heatmapData: [],
  achievements: [],
  insights: {
    mostReadSurahId: null,
    mostReadThemeId: null,
  },
};

const SURAH_THEME_MAP = THEMES.reduce<Record<number, string[]>>(
  (acc, theme) => {
    theme.surahIds.forEach((surahId) => {
      if (!acc[surahId]) {
        acc[surahId] = [];
      }

      acc[surahId].push(theme.id);
    });

    return acc;
  },
  {},
);

const getMostFrequentKey = <T extends string | number>(
  record: Record<string, number>,
): T | null => {
  let result: T | null = null;
  let max = 0;

  for (const [key, value] of Object.entries(record)) {
    if (value > max) {
      max = value;
      result = key as T;
    }
  }

  return result;
};

const calculateLongestStreak = (sortedDates: DateTime[]) => {
  if (sortedDates.length === 0) {
    return 0;
  }

  let longest = 1;
  let current = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const previous = sortedDates[i - 1];

    const currentDate = sortedDates[i];

    const diff = currentDate.diff(previous, "days").days;

    current = diff === 1 ? current + 1 : 1;

    longest = Math.max(longest, current);
  }

  return longest;
};
function buildAchievements({
  totalReadingDays,
  longestStreak,
  totalPagesRead,
  completedKhatmas,
}: {
  totalReadingDays: number;
  longestStreak: number;
  totalPagesRead: number;
  completedKhatmas: number;
}): JourneyStats["achievements"] {
  return [
    // ===== Reading Days =====
    {
      id: "firstDay",
      isUnlocked: totalReadingDays >= 1,
      progress: Math.min((totalReadingDays / 1) * 100, 100),
    },
    {
      id: "readingDays7",
      isUnlocked: totalReadingDays >= 7,
      progress: Math.min((totalReadingDays / 7) * 100, 100),
    },
    {
      id: "readingDays30",
      isUnlocked: totalReadingDays >= 30,
      progress: Math.min((totalReadingDays / 30) * 100, 100),
    },
    {
      id: "readingDays100",
      isUnlocked: totalReadingDays >= 100,
      progress: Math.min((totalReadingDays / 100) * 100, 100),
    },

    // ===== Streaks =====
    {
      id: "streak3",
      isUnlocked: longestStreak >= 3,
      progress: Math.min((longestStreak / 3) * 100, 100),
    },
    {
      id: "streak7",
      isUnlocked: longestStreak >= 7,
      progress: Math.min((longestStreak / 7) * 100, 100),
    },
    {
      id: "streak14",
      isUnlocked: longestStreak >= 14,
      progress: Math.min((longestStreak / 14) * 100, 100),
    },
    {
      id: "streak30",
      isUnlocked: longestStreak >= 30,
      progress: Math.min((longestStreak / 30) * 100, 100),
    },
    {
      id: "streak90",
      isUnlocked: longestStreak >= 90,
      progress: Math.min((longestStreak / 90) * 100, 100),
    },

    // ===== Pages Read =====
    {
      id: "pages10",
      isUnlocked: totalPagesRead >= 10,
      progress: Math.min((totalPagesRead / 10) * 100, 100),
    },
    {
      id: "pages50",
      isUnlocked: totalPagesRead >= 50,
      progress: Math.min((totalPagesRead / 50) * 100, 100),
    },
    {
      id: "pages100",
      isUnlocked: totalPagesRead >= 100,
      progress: Math.min((totalPagesRead / 100) * 100, 100),
    },
    {
      id: "pages500",
      isUnlocked: totalPagesRead >= 500,
      progress: Math.min((totalPagesRead / 500) * 100, 100),
    },
    {
      id: "pages604",
      isUnlocked: totalPagesRead >= 604,
      progress: Math.min((totalPagesRead / 604) * 100, 100),
    },
    // ===== Khatma Achievements =====
    {
      id: "khatma1",
      isUnlocked: completedKhatmas >= 1,
      progress: Math.min((completedKhatmas / 1) * 100, 100),
    },
    {
      id: "khatma3",
      isUnlocked: completedKhatmas >= 3,
      progress: Math.min((completedKhatmas / 3) * 100, 100),
    },
    {
      id: "khatma5",
      isUnlocked: completedKhatmas >= 5,
      progress: Math.min((completedKhatmas / 5) * 100, 100),
    },
  ];
}

export function calculateJourneyStats(
  activities: Activity[],
  currentStreak: number,
  completedKhatmas: number,
): JourneyStats {
  if (!activities?.length) {
    return EMPTY_JOURNEY_STATS;
  }

  const today = DateTime.now().startOf("day");

  const activityDates = new Set<string>();

  const surahCounts: Record<number, number> = {};

  const themeCounts: Record<string, number> = {};

  let totalPagesRead = 0;
  let totalSecondsRead = 0;

  const heatmapByDate = new Map<
    string,
    {
      date: string;
      count: number;
      pages: number;
      seconds: number;
    }
  >();

  activities.forEach((activity) => {
    if (activity.type !== "QURAN") {
      return;
    }

    const {
      date,
      pagesRead,

      secondsRead,
      ranges,
    } = activity;

    const normalizedDate = DateTime.fromISO(date).toISODate() ?? date;
    activityDates.add(normalizedDate);
    totalPagesRead += pagesRead;

    totalSecondsRead += secondsRead;

    const existing = heatmapByDate.get(normalizedDate) ?? {
      date: DateTime.fromISO(normalizedDate).toFormat("yyyy/M/d"),
      count: 0,
      pages: 0,
      seconds: 0,
    };

    existing.pages += pagesRead;
    existing.seconds += secondsRead;
    existing.count = Math.ceil(existing.pages);

    heatmapByDate.set(normalizedDate, existing);

    // Ensure ranges is an array before calling forEach
    const rangesArray = Array.isArray(ranges) ? ranges : [];
    rangesArray.forEach((range) => {
      const surahId = Number(range.split(":")[0]);

      if (Number.isNaN(surahId)) {
        return;
      }

      surahCounts[surahId] = (surahCounts[surahId] || 0) + 1;

      const themes = SURAH_THEME_MAP[surahId];

      themes?.forEach((themeId) => {
        themeCounts[themeId] = (themeCounts[themeId] || 0) + 1;
      });
    });
  });

  const heatmapData = Array.from(heatmapByDate.values())
    .sort(
      (a, b) =>
        DateTime.fromFormat(a.date, "yyyy/M/d").toMillis() -
        DateTime.fromFormat(b.date, "yyyy/M/d").toMillis(),
    )
    .map(({ seconds, ...rest }) => ({
      ...rest,
      minutes: Math.floor(seconds / 60),
      seconds: seconds % 60,
    }));

  const sortedDates = Array.from(activityDates)
    .map((date) => DateTime.fromISO(date))
    .sort((a, b) => a.toMillis() - b.toMillis());

  const longestStreak = calculateLongestStreak(sortedDates);

  const firstActivityDate = sortedDates[0] ?? today;

  const daysSinceStart = Math.max(
    1,
    today.diff(firstActivityDate, "days").days + 1,
  );

  const consistencyPercentage = Math.round(
    (activityDates.size / daysSinceStart) * 100,
  );

  const mostReadSurahId = getMostFrequentKey<number>(surahCounts);

  const mostReadThemeId = getMostFrequentKey<string>(themeCounts);
  return {
    currentStreak,

    longestStreak,

    totalReadingDays: activityDates.size,

    totalPagesRead,

    totalSecondsRead,

    consistencyPercentage,

    isReadToday: activityDates.has(today.toISODate()),

    heatmapData,

    achievements: buildAchievements({
      totalReadingDays: activityDates.size,
      longestStreak,
      totalPagesRead,
      completedKhatmas,
    }),

    insights: {
      mostReadSurahId,

      mostReadThemeId,
    },
  };
}

export const generateJourneyYears = (createdAt: string) => {
  const startYear = DateTime.fromISO(createdAt).year;

  const currentYear = DateTime.now().year;

  const years: number[] = [];

  for (let year = currentYear; year >= startYear; year--) {
    years.push(year);
  }

  return years;
};

export const getYearDateRange = (year: number) => {
  return {
    from: `${year}-01-01`,
    to: `${year}-12-31`,
  };
};

export const formatActivityRanges = (data: Verse[]) => {
  const firstVerse = data[0];
  const lastVerse = data[data.length - 1];

  if (!firstVerse || !lastVerse) return null;

  const startingVerseKey = firstVerse.verse_key;
  const endingVerseKey = lastVerse.verse_key;

  return `${startingVerseKey}-${endingVerseKey}`;
};

// fetch all activity days for a given year

const journeyYearCache = new Map<string, Activity[]>();

// const createJourneyCacheKey = (userId: string, year: number) =>
//   `${userId}-${year}`;

type ActivityDaysResponse = {
  data: Activity[];
  pagination: Pagination;
};

type FetchActivityDaysParams = {
  first: number;

  after?: string;

  from: string;

  to: string;
};

type FetchActivityDaysFn = (
  params: FetchActivityDaysParams,
) => Promise<ActivityDaysResponse>;

interface FetchActivityParams {
  year: number;
  fetchActivityDays: FetchActivityDaysFn;
}
export const fetchAllActivityDaysForYear = async ({
  year,
  fetchActivityDays,
}: FetchActivityParams) => {
  // const cacheKey = createJourneyCacheKey(userId, year);
  // const cached = journeyYearCache.get(cacheKey);
  // if (cached) {
  //   return cached;
  // }
  const { from, to } = getYearDateRange(year);
  let hasNext = true;
  let after: string | undefined;
  const allActivities: Activity[] = [];

  while (hasNext) {
    const { data, pagination } = await fetchActivityDays({
      first: 20,
      ...(after ? { after } : {}),
      from,
      to,
    });
    allActivities.push(...data);
    hasNext = pagination.hasNextPage;
    after = pagination.endCursor || undefined;
  }

  // journeyYearCache.set(cacheKey, allActivities);
  return allActivities;
};

export const clearJourneyYearCache = (userId?: string) => {
  if (!userId) {
    journeyYearCache.clear();
    return;
  }

  Array.from(journeyYearCache.keys()).forEach((key) => {
    if (key.startsWith(userId)) {
      journeyYearCache.delete(key);
    }
  });
};

const WORDS_PER_MINUTE = 130;

function countWordsInVerse(verse: Verse): number {
  // Fast path: use pre-parsed words array
  const words = verse.words;

  if (words?.length) {
    let count = 0;

    for (const word of words) {
      if (!word.char_type_name || word.char_type_name === "word") {
        count++;
      }
    }

    if (count > 0) return count;
  }

  // Fallback to text fields
  const text = verse.text_uthmani ?? verse.qpc_uthmani_hafs ?? "";

  if (!text.trim()) return 0;

  return text.trim().split(/\s+/).length;
}

export function calculateReadingTime(verses: Verse[]): number {
  let totalWords = 0;

  for (const verse of verses) {
    totalWords += countWordsInVerse(verse);
  }

  // Convert minutes to seconds
  return Math.round((totalWords * 60) / WORDS_PER_MINUTE);
}
