"use client";

import { useAppSelector } from "@/lib/store/hooks";
import { useLocale, useTranslations } from "next-intl";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FaBook, FaBookReader } from "react-icons/fa";

import SurahContent from "./_components/SurahContent";
import ReciterContent from "./_components/ReciterContent";
import NotesContent from "./_components/NotesContent";
import { StickyNote } from "lucide-react";
import { useEffect, useState } from "react";
const FavoritesPage = () => {
  const [isClient, setIsClient] = useState(false);
  // It safely flags that we are now on the client.
  useEffect(() => {
    setIsClient(true);
  }, []);
  const { surahs, reciters } = useAppSelector((state) => state.wishlist);
  const t = useTranslations("FavoritePage");
  const locale = useLocale();

  return (
    <div className="py-10">
      <div className="main-container">
        <h1 className="mb-4 text-xl font-bold">{t("favorite")}</h1>
        <Tabs
          dir={`${locale == "ar" ? "rtl" : "ltr"}`}
          defaultValue="surahs"
          className="w-full my-5"
        >
          <TabsList className="grid w-full grid-cols-3 gap-4 h-auto rounded-0 mb-3 bg-white dark:bg-card">
            <TabsTrigger
              value="surahs"
              className="flex items-center gap-2 cursor-pointer dark:bg-secondary bg-gray-100  dark:data-[state=active]:bg-primary data-[state=active]:bg-primary data-[state=active]:text-white py-3"
            >
              <FaBook className="h-4 w-4" />

              {t("surahs")}
            </TabsTrigger>
            <TabsTrigger
              value="reciters"
              className="flex items-center gap-2 cursor-pointer dark:bg-secondary bg-gray-100 dark:data-[state=active]:bg-primary data-[state=active]:bg-primary data-[state=active]:text-white py-3"
            >
              <FaBookReader className="h-4 w-4" />
              {t("reciters")}
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="flex items-center gap-2 cursor-pointer dark:bg-secondary bg-gray-100 dark:data-[state=active]:bg-primary data-[state=active]:bg-primary data-[state=active]:text-white py-3"
            >
              <StickyNote className="h-4 w-4" />
              {t("notes")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="surahs">
            <SurahContent
              surahs={surahs}
              surahText={t("no-surahs")}
              isClient={isClient}
            />
          </TabsContent>
          <TabsContent value="reciters">
            <ReciterContent
              reciters={reciters}
              reciterText={t("no-reciters")}
            />
          </TabsContent>
          <TabsContent value="notes">
            <NotesContent
              noNotesText={t("no-notes")}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FavoritesPage;
