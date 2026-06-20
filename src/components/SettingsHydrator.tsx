"use client";

import { useHydrateSettings } from "@/hooks/useHydrateSettings";
import { ReactNode } from "react";
import { SyncStatusToast } from "./common/SyncStatusToast";

interface SettingsHydratorProps {
  children: ReactNode;
}


export default function SettingsHydrator({ children }: SettingsHydratorProps) {
  useHydrateSettings();
  
  return (
    <>
      <SyncStatusToast />
      {children}
    </>
  );
}
