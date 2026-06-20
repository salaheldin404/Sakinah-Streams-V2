"use client";

import { JourneyStats } from "@/lib/utils/activity";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { BookOpen, Clock, Percent } from "lucide-react";

interface StatsGridProps {
  stats: JourneyStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  const t = useTranslations("Journey.stats");

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}${t("hours")} ${minutes}${t("minutes")}`;
    }
    return `${minutes}${t("minutes")}`;
  };
  console.log(stats,'stats')
  const items = [
    {
      label: t("totalPages"),
      value: stats.totalPagesRead.toFixed(0),
      icon: BookOpen,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },

    {
      label: t("totalTime"),
      value: formatTime(stats.totalSecondsRead),
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: t("avgPages"),
      value: (stats.totalPagesRead / (stats.totalReadingDays || 1)).toFixed(1),
      icon: Percent,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 + 0.5 }}
        >
          <Card className="py-3 md:py-6 border-primary/5 hover:border-primary/20 transition-colors">
            <CardContent className="p-3 md:p-6 flex md:flex-row flex-col items-center gap-4">
              <div className={`p-3 rounded-2xl ${item.bg}`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {item.label}
                </p>
                <p className="text-2xl text-center font-bold tabular-nums">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
