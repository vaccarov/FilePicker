import { DictionaryProvider } from "@/context/DictionaryContext";
import { JSX } from "react";
import HomePageClient from "./HomePageClient";
import { Dictionary } from "@/types";

const dictionaries: { [key: string]: () => Promise<Dictionary> } = {
  en: () => import('@/locales/en/common.json').then((module) => module.default),
  fr: () => import('@/locales/fr/common.json').then((module) => module.default),
};

export default async function Home({params}: {params: Promise<{ locale: string }> }): Promise<JSX.Element> {
  const { locale }: { locale: string } = await params;
  const dictionary: Dictionary = await dictionaries[locale]();
  return (
    <DictionaryProvider dictionary={dictionary}>
      <HomePageClient />
    </DictionaryProvider>
  );
}