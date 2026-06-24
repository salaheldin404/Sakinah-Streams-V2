import { useAddActivityDayMutation } from "@/lib/store/features/activityApi";
import { UserSync } from "@/lib/store/slices/sync-slice";
import {
  calculateReadingTime,
  formatActivityRanges,
} from "@/lib/utils/activity";
import { ActivityDayInput } from "@/types/activity";
import { Verse } from "@/types/verse";
import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "@/i18n/navigation";

function isMobileDevice(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches
  );
}

function consumeSession(
  activeSessionRef: React.MutableRefObject<ActiveReadingSession | null>,
): { payload: ActivityDayInput; qualified: boolean } | null {
  const session = activeSessionRef.current;
  if (!session) return null;

  if (session.focusStartedAt !== null) {
    session.focusedMs += Date.now() - session.focusStartedAt;
    session.focusStartedAt = null;
  }

  const seconds = Math.floor(session.focusedMs / 1000);
  activeSessionRef.current = null;

  return {
    payload: {
      type: "QURAN",
      seconds,
      ranges: [session.activityRange],
      mushafId: 4,
    } satisfies ActivityDayInput,
    qualified: seconds >= session.estimatedSeconds,
  };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActiveReadingSession = {
  /** The Quran page number being read. */
  page: number;
  /** Minimum focused seconds required before the activity is recorded. */
  estimatedSeconds: number;
  /** Verse range string, e.g. "2:1-2:7". */
  activityRange: string;
  /** Total focused milliseconds accumulated so far. */
  focusedMs: number;
  /**
   * Timestamp (ms) when the current focus period started,
   * or `null` if the window is currently blurred.
   */
  focusStartedAt: number | null;
};

interface UseQuranActivityTrackerOptions {
  user: UserSync | null;
  readingPages: number[];
  groupedVerses: Record<number, Verse[]>;
}

export const useQuranActivityTracker = ({
  user,
  readingPages,
  groupedVerses,
}: UseQuranActivityTrackerOptions) => {
  const [addActivityDay] = useAddActivityDayMutation();
  const pathname = usePathname();

  /** The session that is currently being tracked. Mutated in-place. */
  const activeSessionRef = useRef<ActiveReadingSession | null>(null);
  const currentIndexRef = useRef<number | null>(null);

  // -------------------------------------------------------------------------
  // Core helpers
  // -------------------------------------------------------------------------
  const flushCurrentSession = useCallback(() => {
    const result = consumeSession(activeSessionRef);
    if (!result?.qualified) return;

    addActivityDay(result.payload)
      .unwrap()
      .catch((error) => console.error("Failed to save Quran activity:", error));
  }, [addActivityDay]);
  /**
   * Build and start a new reading session for the given Embla index.
   * Does nothing if there is no authenticated user or no verses on the page.
   */
  const startSession = useCallback(
    (index: number) => {
      if (!user) return;

      const currentPage = readingPages[index];
      if (currentPage === undefined) return;

      const versesOnPage = groupedVerses[currentPage] ?? [];
      if (!versesOnPage.length) return;

      const activityRange = formatActivityRanges(versesOnPage);
      if (!activityRange) return;

      const estimatedSeconds = calculateReadingTime(versesOnPage);

      activeSessionRef.current = {
        page: currentPage,
        estimatedSeconds,
        activityRange,
        focusedMs: 0,
        focusStartedAt: document.hasFocus() ? Date.now() : null,
      };
    },
    [user, readingPages, groupedVerses],
  );

  // -------------------------------------------------------------------------
  // Public API – called by the Embla carousel on page change
  // -------------------------------------------------------------------------
  const flushRef = useRef(flushCurrentSession);
  const startSessionRef = useRef(startSession);

  useEffect(() => {
    flushRef.current = flushCurrentSession;
    startSessionRef.current = startSession;
  }, [flushCurrentSession, startSession]);

  const trackCurrentPage = useCallback(
    (currentIndex: number) => {
      const page = readingPages[currentIndex];
      if (page == null) return;

      // Deduplicate: Embla can fire select events for the same page.
      const prevPage =
        currentIndexRef.current != null
          ? readingPages[currentIndexRef.current]
          : null;

      if (page === prevPage) return;

      currentIndexRef.current = currentIndex;

      flushCurrentSession();
      startSession(currentIndex);
    },
    [readingPages, flushCurrentSession, startSession],
  );

  // -------------------------------------------------------------------------
  // Desktop focus / blur
  // -------------------------------------------------------------------------

  useEffect(() => {
    const handleBlur = () => {
      const session = activeSessionRef.current;
      if (!session || session.focusStartedAt === null) return;

      session.focusedMs += Date.now() - session.focusStartedAt;
      session.focusStartedAt = null;
    };

    const handleFocus = () => {
      const session = activeSessionRef.current;
      if (!session || session.focusStartedAt !== null) return; // already timing

      session.focusStartedAt = Date.now();
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  useEffect(() => {
    if (!isMobileDevice()) return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushRef.current();
        return;
      }
      if (
        document.visibilityState === "visible" &&
        activeSessionRef.current === null &&
        currentIndexRef.current !== null
      ) {
        startSessionRef.current(currentIndexRef.current);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [flushCurrentSession]);

  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      flushCurrentSession();
    }
  }, [pathname, flushCurrentSession]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const session = activeSessionRef.current;
      if (!session) return;

      // Calculate how many focused seconds have been accumulated so far,
      // including any currently-open focus window, WITHOUT mutating the ref.
      // flushCurrentSession (via consumeSession) will do the real mutation.
      const openWindowMs =
        session.focusStartedAt !== null
          ? Date.now() - session.focusStartedAt
          : 0;
      const projectedSeconds = Math.floor(
        (session.focusedMs + openWindowMs) / 1000,
      );

      if (projectedSeconds < session.estimatedSeconds) {
        // Not enough reading time – close silently.
        return;
      }
      const result = consumeSession(activeSessionRef);
      if (!result?.qualified) return;
      fetch("/api/qf/v1/activity-days", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        body: JSON.stringify(result.payload),
        keepalive: true, // survives tab close, same guarantee as sendBeacon
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // -------------------------------------------------------------------------
  // Component unmount
  // -------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      flushRef.current();
    };
  }, [flushCurrentSession]);

  return { trackCurrentPage };
};
