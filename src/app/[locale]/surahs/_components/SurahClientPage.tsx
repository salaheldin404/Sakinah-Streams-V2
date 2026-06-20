"use client";

// React and Next.js imports
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

// Third-party library imports
import { toast } from "sonner";
import { LuBookOpen, LuFileText } from "react-icons/lu";

// UI Component imports
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SurahInfo from "@/components/surah/SurahInfo";
import VersesLoadingSkeleton from "@/components/verse/VersesLoadingSkeleton";
import ReadingContent from "@/components/surah/ReadingContent";
import TranslationContent from "@/components/surah/TranslationContent";
import SurahNavigationButton from "@/components/surah/SurahNavigationButton";

// Redux/API imports
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { useGetVersesChapterQuery } from "@/lib/store/features/versesApi";
import { setGoToVerse, setLastRead } from "@/lib/store/slices/surah-slice";

// Utility, Data, and Type imports
import { Verse } from "@/types/verse";
import SurahTopBar from "@/components/surah/SurahTopBar";
import useSurahNavigation from "@/hooks/useSurahNavigation";
import { Surah } from "@/types/surah";
import { toArabicNumber } from "@/lib/utils/surah";

import useReaderCarousel from "@/hooks/useReaderCarousel";
import ReaderPageHeader from "@/components/surah/ReaderPageHeader";

import { useQuranActivityTracker } from "@/hooks/useQuranActivityTracker";

interface SurahClientPageProps {
  initialSurah: Surah;
  locale: "en" | "ar";
}

function processVerses(verses: Verse[] = []) {
  const grouped: Record<string, Verse[]> = {};
  const versePageMap = new Map<string, number>();

  for (const verse of verses) {
    const page = String(verse.page_number);
    (grouped[page] ??= []).push(verse);
    versePageMap.set(verse.verse_key, verse.page_number);
  }

  return { grouped, pages: Object.keys(grouped).map(Number), versePageMap };
}

const SurahClientPage = ({ initialSurah, locale }: SurahClientPageProps) => {
  const surah = initialSurah;
  const id = surah.number.toString();
  const searchParams = useSearchParams();
  const verseQuery = searchParams.get("verse");
  const { currentVerseLocation, lastRead } = useAppSelector(
    (state) => state.surah,
  );
  const syncStatus = useAppSelector((state) => state.sync.status);

  const user = useAppSelector((state) => state.sync.user);
  const dispatch = useAppDispatch();
  const t = useTranslations("Surah");
  const t2 = useTranslations("SurahPage");

  const hasRestoredScrollRef = useRef(false);
  const initialLastReadRef = useRef(lastRead);
  const prevVerseQueryRef = useRef<string | null>(null);
  const pendingSaveLastReadRef = useRef<typeof lastRead | null>(null);
  const isWaitingForSyncRef = useRef(false);
  const numericId = Number(id);

  const [activeTab, setActiveTab] = useState("reading");
  const isRTL = locale === "ar";

  const chapterParams = useMemo(() => {
    const params = new URLSearchParams({
      fields: "text_uthmani,qpc_uthmani_hafs,page_number,audio,chapter_id",
      per_page: "all",
      translations: "131,85",
      translation_fields: "resource_name,language_id",
      words: "true",
    });
    return params.toString();
  }, []);

  const { data: versesData, isFetching } = useGetVersesChapterQuery(
    {
      params: chapterParams.toString(),
      chapterId: numericId,
    },
    {
      skip: !id,
      refetchOnMountOrArgChange: true,
    },
  );
  const { handleNextSurah, handlePreviousSurah, navigationState } =
    useSurahNavigation(numericId);
  const {
    grouped: groupedVerses,
    pages: readingPages,
    versePageMap,
  } = useMemo(() => processVerses(versesData?.verses), [versesData?.verses]);

  const { trackCurrentPage } = useQuranActivityTracker({
    user,
    readingPages,
    groupedVerses,
  });
  const {
    emblaRef: readingCarouselRef,
    emblaApi: readingCarouselApi,
    selectedIndex: selectedPageIndex,
    canClickVisualLeft,
    canClickVisualRight,
    handleVisualLeft,
    handleVisualRight,
    scrollTo,
  } = useReaderCarousel({
    slideCount: readingPages.length,
    isRTL,
    preloadAdjacentSlides: false,
    onPageChange: ({ currentIndex }) => {
      trackCurrentPage(currentIndex);
    },
  });

  const currentReaderPage = readingPages[selectedPageIndex] ?? readingPages[0];
  const currentPageVerses = currentReaderPage
    ? (groupedVerses[Number(currentReaderPage)] ?? [])
    : [];
  const currentPageAnchorVerse = currentPageVerses[0];
  const isCurrentPageSaved =
    Number(lastRead?.chapter_id) === numericId &&
    Number(lastRead?.page_number) === Number(currentReaderPage);

  const { currentReaderPageLabel, selectedReaderLabel, totalReaderLabel } =
    useMemo(() => {
      return {
        currentReaderPageLabel: currentReaderPage
          ? locale === "ar"
            ? toArabicNumber(Number(currentReaderPage))
            : currentReaderPage
          : "-",

        selectedReaderLabel:
          locale === "ar"
            ? toArabicNumber(selectedPageIndex + 1)
            : String(selectedPageIndex + 1),

        totalReaderLabel:
          locale === "ar"
            ? toArabicNumber(readingPages.length)
            : String(readingPages.length),
      };
    }, [locale, currentReaderPage, selectedPageIndex, readingPages.length]);

  const handleSaveMark = useCallback(() => {
    if (!currentPageAnchorVerse) return;

    pendingSaveLastReadRef.current = lastRead;
    isWaitingForSyncRef.current = true;

    dispatch(setGoToVerse(null));
    dispatch(
      setLastRead({
        chapter_id: currentPageAnchorVerse.chapter_id,
        verse_number: currentPageAnchorVerse.verse_number,
        page_number: currentPageAnchorVerse.page_number,
        qpc_uthmani_hafs: currentPageAnchorVerse.qpc_uthmani_hafs,
        verse_key: currentPageAnchorVerse.verse_key,
      }),
    );

    toast.success(t2("marked-saved"), {
      action: {
        label: t2("undo") || "Undo",
        onClick: () => {
          dispatch(setLastRead(pendingSaveLastReadRef.current));
          isWaitingForSyncRef.current = false;
        },
      },
    });
  }, [currentPageAnchorVerse, dispatch, lastRead, t2]);
  // Handle sync errors specifically for saving marks (automatic rollback)
  useEffect(() => {
    if (!isWaitingForSyncRef.current) return;

    if (syncStatus === "error") {
      dispatch(setLastRead(pendingSaveLastReadRef.current));
      toast.error(
        t2("sync-error-undo") ||
          "Sync failed. Bookmark reverted to keep your data consistent.",
        { duration: 5000 },
      );
      isWaitingForSyncRef.current = false;
    } else if (syncStatus === "synced") {
      isWaitingForSyncRef.current = false;
    }
  }, [syncStatus, dispatch, t2]);

  const showBismillah = surah?.number !== 1 && surah?.number !== 9;

  // useScrollToLastRead({ lastRead, isFetching, verseQuery });

  useEffect(() => {
    if (verseQuery) {
      dispatch(setGoToVerse(`${id}:${verseQuery}`));
    } else {
      dispatch(setGoToVerse(null));
    }
  }, [verseQuery, dispatch, id]);

  useEffect(() => {
    if (
      !readingCarouselApi ||
      !readingPages.length ||
      hasRestoredScrollRef.current
    )
      return;

    const initialLastRead = initialLastReadRef.current;
    if (!initialLastRead) {
      hasRestoredScrollRef.current = true;
      return;
    }
    if (initialLastRead.chapter_id !== numericId) {
      hasRestoredScrollRef.current = true;
      return;
    }

    const targetIndex = readingPages.indexOf(initialLastRead.page_number);
    if (targetIndex >= 0) readingCarouselApi.scrollTo(targetIndex, true);
  }, [id, numericId, readingCarouselApi, readingPages, versePageMap]);

  useEffect(() => {
    if (!readingCarouselApi || !readingPages.length) return;
    const hasVerseQueryChanged = verseQuery !== prevVerseQueryRef.current;

    prevVerseQueryRef.current = verseQuery;
    const targetPage =
      verseQuery && hasVerseQueryChanged
        ? (versePageMap.get(`${id}:${verseQuery}`) ?? null)
        : null;

    if (targetPage === null) return;

    const targetIndex = readingPages.indexOf(targetPage);
    if (targetIndex >= 0) readingCarouselApi.scrollTo(targetIndex, true);
  }, [readingCarouselApi, verseQuery, id, readingPages, versePageMap]);
  if (!surah) {
    return (
      <div className="text-center py-10 space-y-3">
        <h3 className="text-2xl font-bold">{t2("not-found")}</h3>
        <p className="text-gray-500">{t2("not-found-description")}</p>
      </div>
    );
  }
  return (
    <div className="py-10 relative" dir={isRTL ? "rtl" : "ltr"}>
      {activeTab === "translation" && (
        <SurahTopBar
          surah={surah}
          currentVerseLocation={currentVerseLocation}
        />
      )}
      <div className="max-w-4xl mx-auto p-3 md:p-6 pb-10">
        <SurahInfo surah={surah} locale={locale} t={t} t2={t2} />
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full my-4"
        >
          <TabsList className="grid w-full grid-cols-2 h-auto rounded-0">
            <TabsTrigger
              value="reading"
              className="flex items-center gap-2 cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-white py-3"
            >
              <LuFileText className="h-4 w-4" />
              {t2("reading")}
            </TabsTrigger>
            <TabsTrigger
              value="translation"
              className="flex items-center gap-2 cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-white py-3"
            >
              <LuBookOpen className="h-4 w-4" />
              {t2("translation")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reading">
            {isFetching ? (
              <VersesLoadingSkeleton />
            ) : (
              <div
                dir={isRTL ? "rtl" : "ltr"}
                className="mt-6 overflow-hidden rounded-md rounded-t-xl border border-border/40 dark:bg-card/40"
              >
                <ReaderPageHeader
                  bookmarkLabel={t2("save-mark")}
                  canGoNext={canClickVisualLeft}
                  canGoPrevious={canClickVisualRight}
                  currentIndexLabel={selectedReaderLabel}
                  isBookmarkLoading={false}
                  isBookmarked={isCurrentPageSaved}
                  onBookmark={handleSaveMark}
                  onNext={handleVisualLeft}
                  onPrevious={handleVisualRight}
                  pageText={
                    locale === "ar"
                      ? `صفحة ${currentReaderPageLabel}`
                      : `Page ${currentReaderPageLabel}`
                  }
                  totalItemsLabel={String(totalReaderLabel)}
                />

                <div className="h-[calc(100dvh-12rem)]  max-h-[900px] ">
                  <div
                    ref={readingCarouselRef}
                    className="h-full overflow-hidden"
                    dir={isRTL ? "rtl" : "ltr"}
                    role="region"
                    aria-roledescription="carousel"
                    aria-label={
                      locale === "ar"
                        ? "صفحات قراءة السورة"
                        : "Surah reading pages"
                    }
                  >
                    <div className="flex h-full gap-2">
                      {readingPages.map((pageNumber, index) => {
                        const versesOnPage = groupedVerses[pageNumber];
                        return (
                          <div
                            key={pageNumber}
                            className="min-w-0 flex-[0_0_100%]"
                            role="group"
                            aria-roledescription="slide"
                            aria-label={
                              locale === "ar"
                                ? `صفحة ${toArabicNumber(pageNumber)}`
                                : `Page ${pageNumber}`
                            }
                          >
                            <ReadingContent
                              pageNumber={pageNumber}
                              verses={versesOnPage}
                              locale={locale}
                              surah={surah}
                              showBismillah={showBismillah && index === 0}
                              onVerseHighlighted={() => scrollTo(index)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <p className="border-t border-border/40 px-4 py-2 text-center font-cairo text-[11px] text-muted-foreground md:hidden">
                  {locale === "ar"
                    ? "اسحب للتنقل بين الصفحات"
                    : "Swipe to move between pages"}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="translation">
            {isFetching ? (
              <VersesLoadingSkeleton />
            ) : (
              <TranslationContent verses={versesData?.verses} surah={surah} />
            )}
          </TabsContent>
        </Tabs>

        {!isFetching && (
          <SurahNavigationButton
            onNextSurah={handleNextSurah}
            onPreviousSurah={handlePreviousSurah}
            isPreviousDisabled={navigationState.isPreviousDisabled}
            isNextDisabled={navigationState.isNextDisabled}
          />
        )}
      </div>
    </div>
  );
};

export default SurahClientPage;
