"use client";

import { useEffect, useRef } from "react";
import { useAppSelector } from "@/lib/store/hooks";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { SyncStatus } from "@/types/settings";
import { AlertCircle } from "lucide-react";

export function SyncStatusToast() {
  const { status, error } = useAppSelector(
    (state) => state.sync,
  );
  const t = useTranslations("sync");
  const previousStatus = useRef<SyncStatus>("idle");

  useEffect(() => {
    // Only show toasts for meaningful state transitions
    if (status === previousStatus.current) return;

    previousStatus.current = status;

    // Show error toast
    if (status === "error") {
      toast.error(t("error"), {
        icon: <AlertCircle className="h-4 w-4" />,
        description: error || t("errorOccurred"),
        duration: 4000,
      });
    }
  }, [status, error, t]);

  return null; // This component only manages toast notifications
}
