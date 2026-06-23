"use client";

import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { AlertCircle, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";

interface AuthRequiredPromptProps {
  showTitle?: boolean;
  color?: string;
  glassStyle?: React.CSSProperties;
}
// color must be hex when glassStyle is enabled
export default function AuthRequiredPrompt({
  showTitle = false,
  color = "currentColor",
  glassStyle,
}: AuthRequiredPromptProps) {
  const t = useTranslations("NoteEditor");
  const tAuth = useTranslations("AuthRequired");
  const locale = useLocale();

  const isCustom = !!glassStyle;

  return (
    <div className={cn("space-y-4", !isCustom && "mt-4")}>
      {isCustom && showTitle && (
        <div className="flex items-center justify-between">
          <h3
            className="flex items-center gap-2 text-base font-bold"
            style={{ color }}
          >
            <StickyNote size={18} />
            {t("title")}
          </h3>
        </div>
      )}

      <div
        className={cn(
          "flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed",
          isCustom
            ? undefined
            : "border-amber-200 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10",
        )}
        style={
          isCustom
            ? { borderColor: `${color}40`, backgroundColor: `${color}08` }
            : undefined
        }
      >
        <AlertCircle
          size={isCustom ? 36 : 40}
          className={cn(
            "mb-3",
            !isCustom && "text-amber-600 dark:text-amber-400",
          )}
          style={isCustom ? { color } : undefined}
        />
        <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-2">
          {tAuth("title")}
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          {tAuth("description")}
        </p>
        <Button
          className={cn(
            "h-9 rounded-xl px-6 text-white",
            isCustom ? "shadow-lg" : "bg-primary hover:bg-primary/90 shadow-md",
          )}
          style={
            isCustom
              ? { backgroundColor: color, boxShadow: `0 4px 12px ${color}30` }
              : undefined
          }
          asChild
        >
          <Link href={`/auth/signin`} locale={locale}>
          {tAuth("signInButton")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
