"use client";

import { JourneyStats } from "@/lib/utils/activity";
import { useTranslations, useLocale } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import HeatMap from "@uiw/react-heat-map";
import { useTheme } from "next-themes";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DateTime, Info } from "luxon";
import JourneyYearsSelector from "./JourneyYearsSelector";
import { useMemo } from "react";

interface ActivityHeatmapProps {
  stats: JourneyStats;
  yearSetting: {
    selectedYear: number;
    setSelectedYear: (year: number) => void;
  };
}

export function ActivityHeatmap({ stats, yearSetting }: ActivityHeatmapProps) {
  const t = useTranslations("Journey.heatmap");
  const locale = useLocale();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const todayKey = DateTime.now().toFormat("yyyy/M/d");

  const monthLabels = Info.months("short", { locale }) as string[];
  const weekdays = Info.weekdays("short", { locale });
  const weekLabels = [weekdays[6], ...weekdays.slice(0, 6)] as string[]; // Rotate to start with Sunday

  const panelColors = isDark
    ? {
        0: "#1e293b",
        1: "#064e3b",
        5: "#065f46",
        7: "#047857",
        10: "#059669",
      }
    : {
        0: "#f1f5f9",
        1: "#d1fae5",
        5: "#6ee7b7",
        7: "#34d399",
        10: "#10b981",
      };

  // const isCurrentYear = yearSetting.selectedYear === DateTime.now().year;

  const startDate = DateTime.fromISO(
    `${yearSetting.selectedYear}-01-01`,
  ).toJSDate();

  // const endDate = isCurrentYear
  //   ? DateTime.now().toJSDate()
  //   : DateTime.fromISO(`${yearSetting.selectedYear}-12-31`).toJSDate();

  const endDate = DateTime.fromISO(
    `${yearSetting.selectedYear}-12-31`,
  ).toJSDate();

  const heatmapDataMap = useMemo(() => {
    return new Map(stats.heatmapData.map((d) => [d.date, d]));
  }, [stats.heatmapData]);

  return (
    <Card className=" border-emerald-500/10 overflow-hidden">
      <CardHeader className="flex justify-between items-center gap-3">
        <div>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </div>
        <JourneyYearsSelector
          selectedYear={yearSetting.selectedYear}
          onYearChange={yearSetting.setSelectedYear}
        />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="min-w-[820px]">
            <HeatMap
              value={stats.heatmapData}
              width="100%"
              rectSize={12}
              space={3}
              monthLabels={monthLabels}
              weekLabels={weekLabels}
              style={{
                color: isDark ? "#94a3b8" : "#64748b",
              }}
              startDate={startDate}
              endDate={endDate}
              legendRender={(props) => {
                const { key, ...rest } = props;
                return <rect key={key} {...rest} rx={2} />;
              }}
              rectProps={{
                rx: 2,
              }}
              panelColors={panelColors}
              rectRender={(props, data) => {
                const { key, ...rest } = props;
                const dayData = heatmapDataMap.get(data.date);
                const isToday = data.date === todayKey;
                const dateLabel = DateTime.fromFormat(data.date, "yyyy/M/d")
                  .setLocale(locale)
                  .toLocaleString(DateTime.DATE_MED);

                const pages = dayData?.pages || 0;

                let intensityLabel = t("noReading");

                if (pages >= 7) {
                  intensityLabel = t("deepReading");
                } else if (pages >= 5) {
                  intensityLabel = t("moderateReading");
                } else if (pages >= 1) {
                  intensityLabel = t("lightReading");
                }
                return (
                  <TooltipProvider key={data.date}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <rect
                          key={key}
                          {...rest}
                          rx={2}
                          strokeWidth={isToday ? 2 : 0}
                          stroke={isToday ? "#10b981" : undefined}
                          className="transition-all
                      duration-200
                      hover:stroke-2
                      hover:stroke-emerald-400
                      cursor-pointer"
                        />
                      </TooltipTrigger>
                      <TooltipContent
                        className=" rounded-xl
                    border
                    bg-background/95
                    p-3
                    shadow-xl
                    backdrop-blur "
                      >
                        <div className="font-bold text-sm">{dateLabel}</div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-emerald-500 font-bold">
                            📖{" "}
                            {t("pages", {
                              count: dayData?.pages.toFixed(0) || 0,
                            })}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-emerald-500 font-bold">
                            ⏱️ {t("minutes", { count: dayData?.minutes || 0 })}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          {dayData?.seconds && (
                            <span className="text-emerald-500 font-bold">
                              {t("seconds", { count: dayData.seconds })}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {intensityLabel}
                        </div>

                        {isToday && (
                          <div className="text-xs font-medium text-amber-500">
                            ✨ {t("today")}
                          </div>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              }}
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground pt-2">
          <span>{t("less")}</span>
          <div className="flex gap-1">
            {Object.values(panelColors).map((color, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-[2px]"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <span>{t("more")}</span>
        </div>
      </CardContent>
    </Card>
  );
}
