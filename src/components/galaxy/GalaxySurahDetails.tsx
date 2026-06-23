"use client";
import { useGetChapterInfoQuery } from "@/lib/store/features/chaptersApi";
import { GalaxySurah } from "@/types/galaxy";
import { useLocale, useTranslations } from "next-intl";
import quranData from "@/data/all-quran-surah.json";
import { motion, type Variants } from "framer-motion";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { SurahInfoResource } from "@/types/surah";
import { Button } from "@/components/ui/button";
import { X, BookOpen, MapPin, Users, Calendar } from "lucide-react";
import { HTMLContent } from "@/components/ui/html-content";
import ResourceCard from "./ResourceCard";
import { createGlassStyle } from "@/lib/utils/galaxy";
import StatCard from "./StatCard";
import { Link } from "@/i18n/navigation";
import GalaxyNotes from "./GalaxyNotes";

interface GalaxySurahDetailsProps {
  selectedSurah: GalaxySurah | null;
  onClose: () => void;
}
const containerVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
    y: 16,
  },

  visible: {
    opacity: 1,
    scale: 1,
    y: 0,

    transition: {
      duration: 0.35,
      ease: "easeOut",
    },
  },

  exit: {
    opacity: 0,
    scale: 0.96,
    y: 16,

    transition: {
      duration: 0.25,
      ease: "easeIn",
    },
  },
};

const contentVariants = {
  hidden: {
    opacity: 0,
    y: 12,
  },

  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,

    transition: {
      delay,
      duration: 0.35,
    },
  }),
};

const GalaxySurahDetails = ({
  selectedSurah,
  onClose,
}: GalaxySurahDetailsProps) => {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const t = useTranslations("QuranicGalaxy.GalaxySurahDetails");
  const params = new URLSearchParams({
    language: locale,
    include_resources: "true",
  });

  const { data, isLoading } = useGetChapterInfoQuery(
    {
      id: selectedSurah?.number ?? 0,
      params: params.toString(),
    },
    {
      skip: !selectedSurah,
    },
  );

  if (!selectedSurah) return null;

  const color = selectedSurah.color;
  const surahData = quranData.data[selectedSurah.number - 1];

  const chapterInfo = data?.chapter_info;
  const resources = (data?.resources || []) as SurahInfoResource[];

  const revelationTypeMap: Record<string, string> = {
    Meccan: t("meccan"),
    Medinan: t("medinan"),
  };

  if (isLoading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent aria-describedby={undefined} className="w-[95vw] lg:w-[1400px] max-w-full! max-h-[90vh] overflow-hidden rounded-3xl border-0 p-0">
          <DialogTitle>
            <div className="flex items-center justify-center p-8">
              <p className="text-lg text-neutral-500">
                {t("loading_chapter_info")}
              </p>
            </div>
          </DialogTitle>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className="
          w-[95vw] lg:w-[1400px] max-w-full! max-h-[90vh] overflow-hidden
          rounded-3xl border-0 p-0 shadow-2xl bg-white/90
          dark:bg-neutral-950/90 backdrop-blur-xl
        "
        aria-describedby={undefined}
      >
        {/* Top Accent */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          className="h-1.5 shrink-0 origin-left"
          style={{ background: color }}
        />

        {/* Close Button */}
        <div
          className={`absolute top-6 ${isArabic ? "left-6" : "right-6"} z-50`}
        >
          <DialogClose asChild>
            <button
              className="
                group
                flex h-10 w-10 items-center justify-center
                rounded-full
                bg-white/10
                dark:bg-neutral-900/10
                text-neutral-500
                backdrop-blur-xl
                transition-all
                duration-300
                hover:bg-white/20
                dark:hover:bg-neutral-800/20
                hover:text-neutral-900
                dark:hover:text-neutral-100
                active:scale-90
                cursor-pointer
                border border-neutral-200/20 dark:border-neutral-700/20
                shadow-sm
              "
            >
              <X
                size={20}
                className="transition-transform duration-300 group-hover:rotate-90"
              />
            </button>
          </DialogClose>
        </div>

        {/* Background Glow */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.12, 0.22, 0.12],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
            }}
            className="
              absolute
              -top-32
              -left-32

              h-80
              w-80

              rounded-full
              blur-3xl
            "
            style={{
              background: color,
            }}
          />
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="
            relative z-10

            max-h-[90vh]
            overflow-y-auto

            p-6 md:p-8
          "
        >
          {/* Header */}
          <motion.div
            variants={contentVariants}
            custom={0.1}
            className="mb-8 text-center"
          >
            <span
              className="
                mb-4
                inline-flex items-center

                rounded-full

                px-4 py-1.5

                text-sm font-semibold
              "
              style={{
                backgroundColor: `${color}15`,
                color,
                border: `1px solid ${color}40`,
              }}
            >
              {t("surah")} #{selectedSurah.number}
            </span>

            <DialogTitle asChild>
              <h1
                className="
                  mb-3

                  text-4xl
                  md:text-5xl

                  font-black
                  tracking-tight
                "
                style={{ color }}
              >
                {surahData?.name}
              </h1>
            </DialogTitle>

            <p className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">
              {selectedSurah.englishNameTranslation}
            </p>

            <p className="text-sm text-neutral-500">{surahData?.englishName}</p>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={contentVariants}
            custom={0.2}
            className="
              mb-8

              grid
              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-4

              gap-4
            "
          >
            <StatCard
              icon={<BookOpen size={18} style={{ color }} />}
              label={t("verses")}
              value={selectedSurah.numberOfAyahs}
              color={color}
            />

            <StatCard
              icon={<MapPin size={18} style={{ color }} />}
              label={t("type")}
              value={
                revelationTypeMap[selectedSurah.revelationType] ||
                selectedSurah.revelationType
              }
              color={color}
            />

            <StatCard
              icon={<Users size={18} style={{ color }} />}
              label={t("shortName")}
              value={surahData?.shortName || "-"}
              color={color}
            />
            <StatCard
              icon={<Calendar size={18} style={{ color }} />}
              label={t("order")}
              value={selectedSurah.revelationOrder}
              color={color}
            />
          </motion.div>

          {/* Description */}
          {chapterInfo && (
            <motion.div
              variants={contentVariants}
              custom={0.3}
              className="mb-8"
            >
              <div className="rounded-2xl p-5" style={createGlassStyle(color)}>
                <h3
                  className="
                    mb-4

                    flex items-center gap-2

                    text-base font-bold
                  "
                  style={{ color }}
                >
                  <BookOpen size={16} />

                  {t("about")}
                </h3>

                <HTMLContent
                  html={chapterInfo.text}
                  className={isArabic ? "text-right" : ""}
                />
              </div>
            </motion.div>
          )}

          {/* Notes Section */}
          {/* {user && ( */}
            <motion.div
              variants={contentVariants}
              custom={0.45}
              className="mb-8"
            >
              <GalaxyNotes surah={selectedSurah} color={color} />
            </motion.div>
          

          {/* Resources */}
          {!!resources.length && (
            <motion.div
              variants={contentVariants}
              custom={0.4}
              className="mb-8"
            >
              <h3
                className="
                  mb-4
                  text-base font-bold
                "
                style={{ color }}
              >
                {t("resources")}
              </h3>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.06,
                    },
                  },
                }}
                className="
                  max-h-64
                  overflow-y-auto

                  space-y-3
                "
              >
                {resources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    color={color}
                    isArabic={isArabic}
                  />
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            variants={contentVariants}
            custom={0.5}
            className="
              flex
              flex-col-reverse
              gap-3

              sm:flex-row
            "
          >
            <DialogClose asChild>
              <Button
                variant="outline"
                className="
                  h-11
                  flex-1
                  rounded-xl
                "
              >
                {t("close")}
              </Button>
            </DialogClose>

            <Button
              className="
                h-11
                flex-1

                rounded-xl

                font-semibold
                text-white

                transition-transform

                active:scale-95
              "
              style={{
                backgroundColor: color,
                boxShadow: `0 10px 30px ${color}35`,
              }}
              asChild
            >
              <Link href={`/surahs/${selectedSurah?.number}`}>
                {t("readSurah")}
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default GalaxySurahDetails;
