import {
  configureStore,
  combineReducers,
  createListenerMiddleware,
  isAnyOf,
  TypedStartListening,
} from "@reduxjs/toolkit";
import { debounce } from "lodash";
import { apiSlice } from "./services/apiSlice";
import { newVersionApiSlice } from "./services/newVersionApiSlice";
import {
  audioReducer,
  setReciter,
  setLastPlay,
  setVolume,
  initialState as initialAudioState,
  hydrateAudio,
} from "./slices/audio-slice";
import {
  wishlistReducer,
  addReciterToWishlist,
  addSurahToWishlist,
  removeReciterFromWishlist,
  removeSurahFromWishlist,
  initialState as initialWishlistState,
  hydrateWishlist,
} from "./slices/wishlist-slice";
import {
  surahReducer,
  setLastRead,
  initialState as initialSurahState,
  hydrateSurah,
} from "./slices/surah-slice";
import fontReducer, {
  setQuranFont,
  incrementSize,
  decrementSize,
  setAyahNumberStyle,
  hydrateFont,
} from "./slices/font-slice";
import athkarReducer, {
  initialState as initialAthkarState,
  resetAthkar,
  setAthkarCount,
  checkAndResetIfExpired,
  resetCustomAthkar,
  resetCustomCardAthkar,
  AthkarState,
  hydrateAthkar,
} from "./slices/athkar-slice";
import {
  syncReducer,
  setSyncStatus,
  setSyncError,
  initialState as initialSyncState,
} from "./slices/sync-slice";
import { DatabaseState, LocalStorageState } from "@/types/settings";
import { transformReduxToDB } from "../utils/setting";
import { resetToDefaultState } from "./root-actions";

import khatmaReducer from "./slices/khatma-slice";
import languageReducer, { setLanguage } from "./slices/language-slice";
import { reflectionApiSlice } from "./services/reflectionSlice";
import { qfApiSlice } from "./services/qfApiSlice";
// Constants
const isBrowser = typeof window !== "undefined";

const ATHKAR_KEYS = [
  "morning-athkar",
  "evening-athkar",
  "post-prayer-athkar",
  "tasabih",
  "sleep-athkar",
  "waking-up-athkar",
  "quranic-duas",
  "prophets-duas",
] as const;

const appReducer = combineReducers({
  [apiSlice.reducerPath]: apiSlice.reducer,
  [newVersionApiSlice.reducerPath]: newVersionApiSlice.reducer,
  [qfApiSlice.reducerPath]: qfApiSlice.reducer,
  [reflectionApiSlice.reducerPath]: reflectionApiSlice.reducer,
  audio: audioReducer,
  font: fontReducer,
  surah: surahReducer,
  wishlist: wishlistReducer,
  athkar: athkarReducer,
  sync: syncReducer,
  khatma: khatmaReducer,
  language: languageReducer,
});

const rootReducer: typeof appReducer = (state, action) => {
  if (action.type === resetToDefaultState.type) {
    return appReducer(undefined, action);
  }
  return appReducer(state, action);
};

export type RootState = ReturnType<typeof appReducer>;
export type AppDispatch = ReturnType<typeof makeStore>["dispatch"];

// Debounced function to save settings to database with sync status
const saveToDatabase = debounce(
  async (stateToPersist: DatabaseState, dispatch: AppDispatch) => {
    try {
      dispatch(setSyncStatus("syncing"));
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stateToPersist),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      dispatch(setSyncStatus("synced"));
    } catch (e) {
      console.warn("Could not save state to database", e);
      dispatch(setSyncError(e instanceof Error ? e.message : "Sync failed"));
    }
  },
  2000,
);

// Save to localStorage for guest users or as fallback
const saveToLocalStorage = (stateToPersist: LocalStorageState) => {
  if (!isBrowser) return;
  try {
    localStorage.setItem("userSettings", JSON.stringify(stateToPersist));
  } catch (e) {
    console.warn("Could not save state to localStorage", e);
  }
};

// Helper to extract athkar data from state
const extractAthkarData = (athkar: AthkarState) =>
  ATHKAR_KEYS.reduce(
    (acc, key) => ({ ...acc, [key]: athkar[key] }),
    {} as Omit<AthkarState, "expirationDate">,
  );

const getLocalStorageState = (state: RootState) => {
  const athkarData = extractAthkarData(state.athkar);

  // Don't persist a specific reciter (custom source) — fall back to the default.
  // Play history is always saved as-is.
  const safeReciter = state.audio.reciter.source
    ? { id: 7, name: "مشاري راشد العفاسي" }
    : state.audio.reciter;

  return {
    font: state.font,
    audio: {
      reciter: safeReciter,
      lastPlay: state.audio.lastPlay,
      volume: state.audio.volume,
    },
    surah: {
      lastRead: state.surah.lastRead,
    },
    wishlist: {
      reciters: state.wishlist.reciters,
      surahs: state.wishlist.surahs,
    },
    athkar: {
      expirationDate: state.athkar.expirationDate,
      ...athkarData,
    },
    language: state.language,
  };
};

const listenerMiddleware = createListenerMiddleware();
type AppStartListening = TypedStartListening<RootState, AppDispatch>;
const startAppListening =
  listenerMiddleware.startListening as AppStartListening;

startAppListening({
  matcher: isAnyOf(
    setQuranFont,
    incrementSize,
    decrementSize,
    setAyahNumberStyle,
    setReciter,
    setLastRead,
    setLastPlay,
    setVolume,
    addReciterToWishlist,
    addSurahToWishlist,
    removeReciterFromWishlist,
    removeSurahFromWishlist,
    resetAthkar,
    setAthkarCount,
    checkAndResetIfExpired,
    resetCustomAthkar,
    resetCustomCardAthkar,
    setLanguage,
  ),
  effect: (action, listenerApi) => {
    const state = listenerApi.getState();

    // Skip ALL persisting when setReciter is dispatched for a specific reciter
    // (one with a custom source URL). Play history is always saved normally.
    if (setReciter.match(action) && !!action.payload.source) {
      return;
    }

    // Create state for localStorage (nested structure for backward compatibility)
    const localStorageState = getLocalStorageState(state);

    // Always save to localStorage as fallback for guest users
    saveToLocalStorage(localStorageState);

    // Create state for database (flat structure matching UserSettings model)
    const stateData = {
      font: state.font,
      audio: state.audio,
      surah: state.surah,
      wishlist: state.wishlist,
      athkar: state.athkar,
      language: state.language,
    };
    const stateForDB = transformReduxToDB(stateData);

    // Try to save to database (will fail gracefully if not authenticated)
    if (isBrowser && state.sync.isAuthenticated) {
      saveToDatabase(stateForDB, listenerApi.dispatch);
    }
  },
});

// Separate listener for hydrate actions - only saves to localStorage, NOT to database
// This prevents re-saving to DB immediately after fetching settings from DB
startAppListening({
  matcher: isAnyOf(
    hydrateAudio,
    hydrateFont,
    hydrateSurah,
    hydrateWishlist,
    hydrateAthkar,
  ),
  effect: (action, listenerApi) => {
    const state = listenerApi.getState();

    // Save to localStorage only (not to database)
    const localStorageState = getLocalStorageState(state);

    saveToLocalStorage(localStorageState);
  },
});

// Merge loaded state with initial state defaults
const mergeWithDefaults = <T extends object>(
  loaded: T | undefined,
  initial: T,
): T | undefined => (loaded ? { ...initial, ...loaded } : undefined);

const reHydrateStore = (): Partial<RootState> | undefined => {
  if (!isBrowser) return undefined;

  try {
    const serializedState = localStorage.getItem("userSettings");
    if (!serializedState) return undefined;

    const loadedState = JSON.parse(serializedState) as Partial<RootState>;

    return {
      ...loadedState,
      audio: mergeWithDefaults(loadedState.audio, initialAudioState),
      surah: mergeWithDefaults(loadedState.surah, initialSurahState),
      wishlist: mergeWithDefaults(loadedState.wishlist, initialWishlistState),
      athkar: mergeWithDefaults(loadedState.athkar, initialAthkarState),
      sync: initialSyncState,
    };
  } catch (e) {
    console.warn("Could not load state from localStorage", e);
    return undefined;
  }
};

export const makeStore = () =>
  configureStore({
    reducer: rootReducer,
    preloadedState: reHydrateStore(),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false })
        .concat(apiSlice.middleware)
        .concat(newVersionApiSlice.middleware)
        .concat(qfApiSlice.middleware)
        .concat(reflectionApiSlice.middleware)
        .prepend(listenerMiddleware.middleware),
    // devTools: process.env.NODE_ENV !== "production",
  });

export const store = makeStore();

/**
 * Cancel any pending debounced save-to-database call.
 * Must be called on logout to prevent stale data from overwriting
 * the user's persisted settings after sign-out.
 */
export const cancelPendingSave = () => saveToDatabase.cancel();
