import type { Metadata, Viewport } from "next";
import { Cairo, Tajawal } from "next/font/google";
import "../globals.css";

import { NextIntlClientProvider } from "next-intl";

import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "@/components/header/Navbar";
import NextTopLoader from "nextjs-toploader";

import StoreProvider from "@/lib/store/StoreProvider";
import PlayerWrapper from "@/components/audio/PlayerWrapper";
import { Toaster } from "@/components/ui/sonner";

import SettingsHydrator from "@/components/SettingsHydrator";
import LanguageRouteSync from "@/components/LanguageRouteSync";
import { getSession } from "@/lib/oauth/auth";

import { getKhatmaPlan } from "@/server/db/khatmaPlan";
import PWAInstallPrompt from "@/components/pwa/PWAInstallPrompt";

const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cairo",
});

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-tajawal",
});

export function generateStaticParams(): { locale: "en" | "ar" }[] {
  return [{ locale: "en" }, { locale: "ar" }];
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#7c3aed" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = (await params) as { locale: "en" | "ar" };
  const baseUrl = process.env.SITE_URL!;

  const commonMetadata: Metadata = {
    metadataBase: new URL(baseUrl),
    authors: [{ name: "Salah Eldin" }],
    publisher: "Salah Eldin",
    applicationName: "Sakinah Streams",
    manifest: `/${locale}/manifest.webmanifest`,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
      },
    },
    verification: {
      google: process.env.GOOGLE_VERIFICATION_CODE,
    },
  };

  if (locale === "ar") {
    return {
      ...commonMetadata,
      title: {
        default: "Sakinah Streams | تلاوات قرآنية خاشعة",
        template: "%s | Sakinah Streams",
      },
      description:
        "استمع لتلاوات القرآن الكريم بجودة عالية تبعث السكينة والطمأنينة في قلبك. يمكنك الاستماع في أي وقت ومن أي مكان.",
      keywords: [
        "قرآن",
        "تلاوات قرآنية",
        "سكينة",
        "طمأنينة",
        "استماع للقرآن",
        "تلاوة عالية الجودة",
        "القرآن الكريم",
        "تلاوة",
        "قراءة القرآن",
        "استماع قرآن",
      ].join(", "),
      alternates: {
        canonical: `${baseUrl}/${locale}`,
        languages: {
          en: `${baseUrl}/en`,
          ar: `${baseUrl}/ar`,
        },
      },
      openGraph: {
        type: "website",
        title: "Sakinah Streams | تلاوات قرآنية خاشعة",
        locale: "ar_EG",
        description:
          "تجربة روحانية عبر الاستماع لتلاوات القرآن الكريم المهدئة للنفس.",
        url: `${baseUrl}/${locale}`,
        siteName: "Sakinah Streams",
        images: ["/og/home.png"],
      },
    };
  }
  return {
    ...commonMetadata,
    title: {
      default: "Sakinah Streams | Peaceful Quran Recitations",
      template: "%s | Sakinah Streams",
    },
    description:
      "Immerse yourself in the Holy Quran. Sakinah Streams offers beautiful, high-quality recitations to bring peace and tranquility (Sakinah - سكينة) to your day. Listen anytime, anywhere.",
    keywords: [
      "Quran",
      "Quran Recitations",
      "Sakinah",
      "Tranquility",
      "Listen to Quran",
      "High-Quality Recitations",
      "Holy Quran",
      "Quran Listening",
      "Islamic Content",
      "Spiritual Peace",
    ].join(", "),
    alternates: {
      canonical: `${baseUrl}/en`,
      languages: {
        en: `${baseUrl}/en`,
        ar: `${baseUrl}/ar`,
      },
    },
    openGraph: {
      type: "website",
      title: "Sakinah Streams | Peaceful Quran Recitations",
      locale: "en_US",
      description:
        "Listen to the Holy Quran recited beautifully to bring calm and spiritual peace to your day.",
      url: `${baseUrl}/en`,
      siteName: "Sakinah Streams",
      images: ["/og/home.png"],
    },
  };
}

export default async function RootLayout({
  children,
  modal,
  khatma,
  params,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
  khatma: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = (await params) as { locale: "en" | "ar" };
  const user = await getSession();
  let initialkhatma = null;

  if (user?.id) {
    initialkhatma = await getKhatmaPlan(user.id);
  }
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Sakinah Streams",
    url: process.env.SITE_URL,
  };
  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <meta name="google" content="notranslate" />
      </head>
      <body
        className={`${cairo.variable} ${tajawal.variable} dark:bg-background bg-gray-100`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextTopLoader color="#7c3aed" showSpinner={false} />
          <StoreProvider
            initialKhatma={initialkhatma}
            user={
              user
                ? {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    createdAt: user.createdAt.toISOString(),
                    completedKhatmas: user.completedKhatmas,
                  }
                : null
            }
          >
            <NextIntlClientProvider locale={locale}>
              <SettingsHydrator>
                <LanguageRouteSync />
                <Navbar />
                {children}
                {modal}
                {khatma}
                <PWAInstallPrompt />
                <PlayerWrapper />
              </SettingsHydrator>
            </NextIntlClientProvider>
          </StoreProvider>
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
