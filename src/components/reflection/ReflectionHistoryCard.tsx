import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight, Trash2, Loader2 } from "lucide-react";
import { ReflectionResponse } from "@/types/reflection";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDeleteReflectionMutation } from "@/lib/store/features/reflectionApi";

interface HistoryItem {
  id: string;
  emotionTag: string;
  userInput: string | null;
  aiResponse: ReflectionResponse;
  createdAt: string;
}

interface ReflectionHistoryCardProps {
  onSelect: (data: ReflectionResponse) => void;
  item: HistoryItem;
}

const ReflectionHistoryCard = ({
  item,
  onSelect,
}: ReflectionHistoryCardProps) => {
  const t = useTranslations("reflection");
  const locale = useLocale();
  const [deleteReflection, { isLoading: isDeleting }] =
    useDeleteReflectionMutation();
  const onConfirmDelete = async () => {
    if (isDeleting) return;

    try {
      await deleteReflection(item.id).unwrap();
      toast.success(t("delete_success"));
    } catch (error) {
      console.error(error);
      toast.error(t("delete_error"));
    }
  };

  return (
    <Card
      className="cursor-pointer hover:border-primary/50 transition-colors bg-background/40 backdrop-blur-sm border-border/50 overflow-hidden group relative"
      onClick={() => onSelect(item.aiResponse)}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <Badge variant="outline" className="capitalize">
            {item.emotionTag}
          </Badge>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {new Date(item.createdAt).toLocaleDateString(locale, {
                month: "short",
                day: "numeric",
              })}
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("delete_confirm_title")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("delete_confirm_description")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {t("delete_confirm_cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onConfirmDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t("delete_confirm_action")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <p className="text-xs line-clamp-2 text-muted-foreground italic">
          {item.userInput || t("no_context")}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <span className="text-[10px] font-medium text-primary uppercase tracking-tighter">
            {item.aiResponse.verses.length} {t("verses")}
          </span>
          <ArrowRight className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
        </div>
      </CardContent>
    </Card>
  );
};

export default ReflectionHistoryCard;
