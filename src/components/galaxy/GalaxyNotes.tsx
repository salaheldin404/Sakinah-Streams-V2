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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createGlassStyle } from "@/lib/utils/galaxy";
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
import { GalaxySurah } from "@/types/galaxy";

interface GalaxyNotesProps {
  surah: GalaxySurah;
  color: string;
}

const GalaxyNotes = ({ surah, color }: GalaxyNotesProps) => {
  const t = useTranslations("NoteEditor");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const isAuthenticated = useAppSelector((state) => state.sync.isAuthenticated);

  const [newNoteBody, setNewNoteBody] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const range = `${surah.number}:1-${surah.number}:${surah.numberOfAyahs}`;
  // Filter notes by Surah number using ranges
  const { data: notes = [], isLoading } = useGetNoteByVerseQuery(
    `${surah.number}:1`,
    {
      refetchOnMountOrArgChange: true,
    },
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
      console.log(error, "error from add note");
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
      console.log(error, "error from update note");
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
      console.log(error, "error from delete note");
      toast.error(t("deleteError"));
    }
  };

  const startEditing = (note: Note) => {
    setEditingNoteId(note.id);
    setEditBody(note.body);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthRequiredPrompt
        showTitle={true}
        color={color}
        glassStyle={createGlassStyle(color)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3
          className="flex items-center gap-2 text-base font-bold"
          style={{ color }}
        >
          <StickyNote size={18} />
          {t("title")}
        </h3>

        {!isAdding && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="h-8 gap-1 rounded-full px-3 text-xs font-semibold"
            style={{
              backgroundColor: `${color}15`,
              color,
              border: `1px solid ${color}30`,
            }}
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
            <div
              className="rounded-2xl p-4 space-y-3"
              style={createGlassStyle(color)}
            >
              <Textarea
                placeholder={t("notePlaceholder")}
                value={newNoteBody}
                onChange={(e) => setNewNoteBody(e.target.value)}
                className="min-h-[100px] resize-none border-neutral-200/50 bg-white/50 dark:border-neutral-700/50 dark:bg-neutral-900/50"
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
                  className="h-9 rounded-xl px-4 text-white shadow-lg"
                  style={{
                    backgroundColor: color,
                    boxShadow: `0 4px 12px ${color}30`,
                  }}
                >
                  {isAddingNote ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save size={16} className={isArabic ? "ml-2" : "mr-2"} />
                  )}
                  {t("save")}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes List */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
            <StickyNote size={32} className="mb-2 opacity-20" />
            <p className="text-sm text-neutral-500">{t("noNotes")}</p>
          </div>
        ) : (
          notes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative rounded-2xl p-4 transition-all duration-300"
              style={createGlassStyle(color)}
            >
              {editingNoteId === note.id ? (
                <div className="space-y-3">
                  <Textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    className="min-h-[100px] resize-none border-neutral-200/50 bg-white/50 dark:border-neutral-700/50 dark:bg-neutral-900/50"
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
                      className="h-8 rounded-lg text-white"
                      style={{ backgroundColor: color }}
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
                      {new Date(note.createdAt).toLocaleDateString(locale, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
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
                        onClick={() => setNoteToDelete(note.id)}
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

      {/* Delete Confirmation */}
      <div dir={isArabic ? "rtl" : "ltr"}>
        <AlertDialog
          open={!!noteToDelete}
          onOpenChange={(open) => !open && setNoteToDelete(null)}
        >
          <AlertDialogContent
            dir={isArabic ? "rtl" : "ltr"}
            className="rounded-3xl border-0 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-xl"
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
      </div>
    </div>
  );
};

export default GalaxyNotes;
