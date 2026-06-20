import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type SyncStatus = "idle" | "pending" | "syncing" | "synced" | "error";

export type UserSync = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  completedKhatmas: number;
}

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: number | null;
  error: string | null;
  pendingChanges: number;
  isAuthenticated: boolean;
  user: UserSync | null;
}

export const initialState: SyncState = {
  status: "idle",
  lastSyncedAt: null,
  error: null,
  pendingChanges: 0,
  isAuthenticated: false,
  user: null,
};

const syncSlice = createSlice({
  name: "sync",
  initialState,
  reducers: {
    setSyncStatus: (state, action: PayloadAction<SyncStatus>) => {
      state.status = action.payload;
      if (action.payload === "synced") {
        state.lastSyncedAt = Date.now();
        state.error = null;
        state.pendingChanges = 0;
      } else if (action.payload === "error") {
        state.lastSyncedAt = Date.now();
      }
    },
    setSyncError: (state, action: PayloadAction<string>) => {
      state.status = "error";
      state.error = action.payload;
      state.lastSyncedAt = Date.now();
    },
    incrementPendingChanges: (state) => {
      state.pendingChanges += 1;
      if (state.status === "idle" || state.status === "synced") {
        state.status = "pending";
        state.error = null;
      }
    },
    resetSync: (state) => {
      state.status = "idle";
      state.lastSyncedAt = null;
      state.error = null;
      state.pendingChanges = 0;
    },
    setIsAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
    setUser: (state, action: PayloadAction<SyncState["user"]>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
  },
});

export const {
  setSyncStatus,
  setSyncError,
  incrementPendingChanges,
  resetSync,
  setIsAuthenticated,
  setUser,
} = syncSlice.actions;

export const syncReducer = syncSlice.reducer;
