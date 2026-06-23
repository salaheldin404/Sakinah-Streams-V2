"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  useAddNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
  useGetNoteByVerseQuery,
} from "@/lib/store/features/notesApi";
import { useAppSelector } from "@/lib/store/hooks";
import { Note } from "@/types/note";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import AuthRequiredPrompt from "@/components/common/AuthRequiredPrompt";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  StickyNote,
  Loader2,
  AlertCircle,
  X,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Verse } from "@/types/verse";

interface VerseNotesDialogProps {
  verse: Verse;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VerseNotesDialog({
  verse,
  isOpen,
  onOpenChange,
}: VerseNotesDialogProps) {
  const t = useTranslations("NoteEditor");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const isAuthenticated = useAppSelector((state) => state.sync.isAuthenticated);

  const [newNoteBody, setNewNoteBody] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Range format for a specific verse: surahId:verseNum-surahId:verseNum
  const range = `${verse.chapter_id}:${verse.verse_number}-${verse.chapter_id}:${verse.verse_number}`;

  // Query notes for this specific verse (e.g. verse_key like "1:1")
  const { data: notes = [], isLoading } = useGetNoteByVerseQuery(
    verse.verse_key,
    {
      skip: !isOpen || !isAuthenticated,
      refetchOnMountOrArgChange: true,
    }
  );

  const [addNote, { isLoading: isAddingNote }] = useAddNoteMutation();
  const [updateNote, { isLoading: isUpdatingNote }] = useUpdateNoteMutation();
  const [deleteNote, { isLoading: isDeletingNote }] = useDeleteNoteMutation();

  const handleAddNote = async () => {
    if (!newNoteBody.trim() || newNoteBody.trim().length < 6) return;

    try {
      await addNote({
        body: newNoteBody,
        saveToQR: false,
        ranges: [range],
      }).unwrap();

      setNewNoteBody("");
      setIsAdding(false);
      toast.success(t("addSuccess"));
    } catch (error) {
      console.error(error, "error from add note");
      toast.error(t("addError"));
    }
  };

  const handleUpdateNote = async (id: string) => {
    if (!editBody.trim() || editBody.trim().length < 6) return;

    try {
      await updateNote({
        id,
        body: editBody,
      }).unwrap();

      setEditingNoteId(null);
      setEditBody("");
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
      requestAnimationFrame(() => setIsDeleteConfirmOpen(false));
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

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && isDeleteConfirmOpen) return;
        onOpenChange(open);
      }}
    >
      <DialogContent
        dir={isArabic ? "rtl" : "ltr"}
        className="rounded-3xl border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl p-6 shadow-2xl w-[clamp(20rem,92vw,42rem)] max-w-none max-h-[85vh] overflow-y-auto"
        onPointerDownOutside={(event) => {
          if (isDeleteConfirmOpen) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (isDeleteConfirmOpen) event.preventDefault();
        }}
      >
        <DialogClose asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 rtl:right-auto rtl:left-4 h-8 w-8 rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X size={18} />
          </Button>
        </DialogClose>

        <DialogHeader className={isArabic ? "text-right! pl-8" : "text-left pr-8"}>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-neutral-900 dark:text-white">
            <StickyNote className="h-5 w-5 text-primary" />
            <span>
              {t("title")} - {verse.verse_key}
            </span>
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-500 mt-1">
            {t("descriptionVerse")}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !isAuthenticated ? (
          <AuthRequiredPrompt />
        ) : (
          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                {isArabic ? "قائمة الملاحظات" : "Notes List"}
              </h4>

              {!isAdding && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAdding(true)}
                  className="h-8 gap-1 rounded-full px-3 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20"
                >
                  <Plus size={14} />
                  {t("add")}
                </Button>
              )}
            </div>

            {/* Add Note Form */}
            <AnimatePresence>
              {isAdding && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-2xl p-4 space-y-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                    <Textarea
                      placeholder={t("notePlaceholder")}
                      value={newNoteBody}
                      onChange={(e) => setNewNoteBody(e.target.value)}
                      className="min-h-[100px] resize-none border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 focus-visible:ring-primary focus-visible:ring-1"
                      minLength={6}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsAdding(false);
                          setNewNoteBody("");
                        }}
                        className="h-9 rounded-xl px-4"
                      >
                        {t("cancel")}
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAddNote}
                        disabled={newNoteBody.trim().length < 6 || isAddingNote}
                        className="h-9 rounded-xl px-4 text-white bg-primary hover:bg-primary/90 shadow-md"
                      >
                        {isAddingNote ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save
                            size={16}
                            className={isArabic ? "ml-2" : "mr-2"}
                          />
                        )}
                        {t("save")}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notes List */}
            <div className="space-y-3  pr-1 custom-scrollbar">
              {notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20">
                  <StickyNote size={32} className="mb-2 opacity-20" />
                  <p className="text-sm text-neutral-500">
                    {t("noNotesVerse")}
                  </p>
                </div>
              ) : (
                notes.map((note) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="group relative rounded-2xl p-4 transition-all duration-300 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/30"
                  >
                    {editingNoteId === note.id ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          className="min-h-[100px] resize-none border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 focus-visible:ring-primary focus-visible:ring-1"
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
                            disabled={
                              editBody.trim().length < 6 || isUpdatingNote
                            }
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
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                          {note.body}
                        </p>

                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-[10px] text-neutral-400">
                            {new Date(note.createdAt).toLocaleDateString(
                              locale,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </span>

                          <div className="flex gap-1 opacity-100 [@media(hover:hover)]:opacity-0 transition-opacity [@media(hover:hover)]:group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEditing(note)}
                              className="h-7 w-7 rounded-full text-neutral-500 hover:text-blue-500"
                            >
                              <Pencil size={12} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setNoteToDelete(note.id);
                                setIsDeleteConfirmOpen(true);
                              }}
                              className="h-7 w-7 rounded-full text-neutral-500 hover:text-red-500"
                            >
                              <Trash2 size={12} />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}
      </DialogContent>

      {/* Delete Confirmation */}
      {!!noteToDelete && (
        <AlertDialog
          open={!!noteToDelete}
          onOpenChange={(open) => {
            if (!open) {
              setNoteToDelete(null);
              requestAnimationFrame(() => setIsDeleteConfirmOpen(false));
            }
          }}
        >
          <AlertDialogContent
            dir={isArabic ? "rtl" : "ltr"}
            className="rounded-3xl border-0 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl shadow-2xl"
          >
            <AlertDialogHeader>
              <div className="flex items-center gap-2 text-red-500 mb-2">
                <AlertCircle size={20} />
                <AlertDialogTitle>{t("delete")}</AlertDialogTitle>
              </div>
              <AlertDialogDescription>
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
      )}
    </Dialog>
  );
}
