"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  useGetAllNotesQuery,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
} from "@/lib/store/features/notesApi";
import { useAppSelector } from "@/lib/store/hooks";
import { Note } from "@/types/note";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import AuthRequiredPrompt from "@/components/common/AuthRequiredPrompt";
import {
  Pencil,
  Trash2,
  Save,
  StickyNote,
  Loader2,
  AlertCircle,
  Calendar,
  BookOpen,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import quranData from "@/data/all-quran-surah.json";

interface NotesContentProps {
  noNotesText: string;
}

interface LinkInfo {
  chapterId: number;
  verseNumber?: number;
}

interface ParsedRange {
  chapterId: number;
  verseStart: number;
  verseEnd: number | null;
  surah: (typeof quranData.data)[number] | null;
}

function parseRange(rangeStr: string): ParsedRange | null {
  if (!rangeStr) return null;

  const [startStr, endStr] = rangeStr.split("-");
  if (!startStr) return null;

  const startParts = startStr.split(":");
  if (startParts.length < 2) return null;

  const chapterId = parseInt(startParts[0], 10);
  const verseStart = parseInt(startParts[1], 10);

  const endParts = endStr?.split(":");
  const verseEnd =
    endParts && endParts.length >= 2 ? parseInt(endParts[1], 10) : null;

  const surah = quranData.data[chapterId - 1] ?? null;

  return { chapterId, verseStart, verseEnd, surah };
}

function getLinkInfo(parsed: ParsedRange): LinkInfo {
  const { chapterId, verseStart, verseEnd, surah } = parsed;

  if (verseEnd === null || verseStart === verseEnd) {
    return { chapterId, verseNumber: verseStart };
  }

  if (surah && verseStart === 1 && verseEnd === surah.numberOfAyahs) {
    return { chapterId };
  }

  return { chapterId, verseNumber: verseStart };
}

function formatRange(
  parsed: ParsedRange,
  locale: string,
  tFav: (key: string, values?: Record<string, string | number>) => string,
): string {
  const { verseStart, verseEnd, surah } = parsed;

  if (!surah) return "";

  const surahName = locale === "ar" ? surah.shortName : surah.englishName;

  if (verseEnd !== null) {
    const isFullSurah = verseStart === 1 && verseEnd === surah.numberOfAyahs;
    if (isFullSurah) {
      return tFav("surahLabel", { name: surahName });
    }

    const isSingleVerse = verseStart === verseEnd;
    if (isSingleVerse) {
      return tFav("surahVerseLabel", { name: surahName, verse: verseStart });
    }

    return tFav("surahVersesLabel", {
      name: surahName,
      verses: `${verseStart}-${verseEnd}`,
    });
  }

  return tFav("surahVerseLabel", { name: surahName, verse: verseStart });
}

const NotesContent = ({ noNotesText }: NotesContentProps) => {
  const locale = useLocale();
  const t = useTranslations("NoteEditor");
  const tFav = useTranslations("FavoritePage");
  const isAuthenticated = useAppSelector((state) => state.sync.isAuthenticated);

  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", "10");
    if (currentCursor) {
      params.set("cursor", currentCursor);
    }
    return params.toString();
  }, [currentCursor]);

  const { data: response, isLoading } = useGetAllNotesQuery(queryParams, {
    skip: !isAuthenticated,
    refetchOnMountOrArgChange: true,
  });

  const notes = useMemo(() => response?.data || [], [response?.data]);
  const hasNextPage = response?.pagination?.hasNextPage || false;

  const [updateNote, { isLoading: isUpdatingNote }] = useUpdateNoteMutation();
  const [deleteNote, { isLoading: isDeletingNote }] = useDeleteNoteMutation();

  const [searchQuery, setSearchQuery] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  const isArabic = locale === "ar";

  const handleNextPage = () => {
    if (hasNextPage) {
      setCursorHistory((prev) => [...prev, currentCursor || ""]);
      setCurrentCursor(response?.pagination?.endCursor || null);
    }
  };

  const handlePrevPage = () => {
    if (cursorHistory.length > 0) {
      const newHistory = [...cursorHistory];
      const prevCursor = newHistory.pop();
      setCursorHistory(newHistory);
      setCurrentCursor(prevCursor || null);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentCursor(null);
    setCursorHistory([]);
  };

  const handleUpdateNote = async (id: string) => {
    if (!editBody.trim() || editBody.trim().length < 6) {
      toast.error(t("error"));
      return;
    }

    try {
      await updateNote({
        id,
        body: editBody,
      }).unwrap();
      setEditingNoteId(null);
      toast.success(t("editSuccess"));
    } catch (error) {
      console.error(error, "error from update note");
      toast.error(t("editError"));
    }
  };

  const handleDeleteNote = async () => {
    if (!noteToDelete) return;

    try {
      await deleteNote(noteToDelete).unwrap();
      setNoteToDelete(null);
      toast.success(t("deleteSuccess"));
    } catch (error) {
      console.error(error, "error from delete note");
      toast.error(t("deleteError"));
    }
  };

  const startEditing = (note: Note) => {
    setEditingNoteId(note.id);
    setEditBody(note.body);
  };

  const enrichedNotes = useMemo(
    () =>
      notes.map((note) => {
        const rangeStr = note.ranges?.[0] ?? "";
        const parsed = rangeStr ? parseRange(rangeStr) : null;
        return {
          note,
          linkInfo: parsed ? getLinkInfo(parsed) : null,
          formattedRange: parsed ? formatRange(parsed, locale, tFav) : "",
          date: new Date(note.createdAt).toLocaleDateString(locale, {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
        };
      }),
    [notes, locale, tFav],
  );

  // Filter notes based on search query (search body or Surah name)
  const filteredNotes = useMemo(() => {
    if (!searchQuery) return enrichedNotes;
    const q = searchQuery.toLowerCase();
    return enrichedNotes.filter(
      ({ note, formattedRange }) =>
        note.body.toLowerCase().includes(q) ||
        formattedRange.toLowerCase().includes(q),
    );
  }, [enrichedNotes, searchQuery]);

  if (!isAuthenticated) {
    return <AuthRequiredPrompt />;
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 bg-white dark:bg-card space-y-4"
          >
            <div className="h-4 bg-gray-200 dark:bg-neutral-800 rounded-md w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-neutral-800 rounded-md w-1/2"></div>
            <div className="flex justify-between items-center pt-2">
              <div className="h-3 bg-gray-200 dark:bg-neutral-800 rounded-md w-1/4"></div>
              <div className="h-6 bg-gray-200 dark:bg-neutral-800 rounded-full w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and count header */}
      {notes.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-card p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm transition-all duration-300">
          <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            <span>
              {tFav("totalNotes")}
              <span className="text-primary font-bold mx-1">
                {notes.length}
              </span>
            </span>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder={tFav("searchPlaceholder")}
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
        </div>
      )}

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredNotes.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/10">
              <StickyNote
                size={48}
                className="mb-3 text-neutral-400 opacity-50"
              />
              <p className="text-base text-neutral-500 font-medium">
                {searchQuery ? tFav("noSearchResults") : noNotesText}
              </p>
            </div>
          ) : (
            filteredNotes.map(({ note, linkInfo, formattedRange, date }) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="group relative rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-card shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                {editingNoteId === note.id ? (
                  <div className="space-y-3 w-full">
                    <Textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      className="min-h-[120px] resize-none border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 focus-visible:ring-primary focus-visible:ring-1 p-3 text-sm rounded-xl"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingNoteId(null)}
                        className="h-8 rounded-lg"
                      >
                        {t("cancel")}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateNote(note.id)}
                        disabled={editBody.trim().length < 6 || isUpdatingNote}
                        className="h-8 rounded-lg text-white bg-primary hover:bg-primary/90"
                      >
                        {isUpdatingNote ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save
                            size={14}
                            className={isArabic ? "ml-1" : "mr-1"}
                          />
                        )}
                        {t("save")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {formattedRange && linkInfo && (
                        <Link
                          href={
                            linkInfo.verseNumber
                              ? `/surahs/${linkInfo.chapterId}?verse=${linkInfo.verseNumber}`
                              : `/surahs/${linkInfo.chapterId}`
                          }
                          locale={locale}
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all w-fit"
                        >
                          <BookOpen size={12} />
                          <span>{formattedRange}</span>
                        </Link>
                      )}
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                        {note.body}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                      <span className="text-xs text-neutral-400 flex items-center gap-1">
                        <Calendar size={12} />
                        {date}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditing(note)}
                          className="h-8 w-8 rounded-xl text-neutral-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all"
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setNoteToDelete(note.id)}
                          className="h-8 w-8 rounded-xl text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Pagination Controls */}
      {(cursorHistory.length > 0 || hasNextPage) && (
        <div className="flex justify-between items-center bg-white dark:bg-card p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm transition-all duration-300">
          <Button
            variant="outline"
            onClick={handlePrevPage}
            disabled={cursorHistory.length === 0}
            className="flex items-center gap-1.5 px-4 h-9 rounded-xl text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800"
          >
            {isArabic ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {tFav("prevPage")}
          </Button>

          <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
            {tFav("pageLabel", { page: cursorHistory.length + 1 })}
          </span>

          <Button
            variant="outline"
            onClick={handleNextPage}
            disabled={!hasNextPage}
            className="flex items-center gap-1.5 px-4 h-9 rounded-xl text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800"
          >
            {tFav("nextPage")}
            {isArabic ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </Button>
        </div>
      )}

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={!!noteToDelete}
        onOpenChange={(open) => !open && setNoteToDelete(null)}
      >
        <AlertDialogContent
          dir={isArabic ? "rtl" : "ltr"}
          className="rounded-3xl border-0 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl"
        >
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-red-500 mb-2">
              <AlertCircle size={20} />
              <AlertDialogTitle>{t("delete")}</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-neutral-500 dark:text-neutral-400">
              {t("confirmDelete")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl border-neutral-200 dark:border-neutral-800">
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNote}
              className="rounded-xl bg-red-500 hover:bg-red-600 text-white"
              disabled={isDeletingNote}
            >
              {isDeletingNote ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 size={16} className={isArabic ? "ml-2" : "mr-2"} />
              )}
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NotesContent;
