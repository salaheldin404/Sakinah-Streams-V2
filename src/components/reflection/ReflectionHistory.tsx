"use client";

import { useTranslations } from "next-intl";

import { History } from "lucide-react";
import { ReflectionResponse } from "@/types/reflection";
import ReflectionHistoryCard from "./ReflectionHistoryCard";
import { useGetReflectionsQuery } from "@/lib/store/features/reflectionApi";

interface ReflectionHistoryProps {
  onSelect: (data: ReflectionResponse) => void;
}

export default function ReflectionHistory({
  onSelect,
}: ReflectionHistoryProps) {
  const t = useTranslations("reflection");
  const { data, isLoading: isGetReflectionsLoading } = useGetReflectionsQuery();

  if (isGetReflectionsLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="min-w-[280px] h-32 rounded-2xl bg-card/50 animate-pulse"
          />
        ))}
      </div>
    );
  }
  if (data?.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-4">
        <History className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {t("recent_history")}
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ">
        {data?.map((item) => (
          <ReflectionHistoryCard
            key={item.id}
            item={item}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
