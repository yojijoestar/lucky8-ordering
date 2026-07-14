"use client";

import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/i18n";

export default function LanguageToggle({ lang }: { lang: Lang }) {
  const router = useRouter();

  function setLang(next: Lang) {
    if (next === lang) return;
    document.cookie = `lang=${next};path=/;max-age=${60 * 60 * 24 * 365}`;
    router.refresh();
  }

  const base = "px-2.5 py-1 text-xs transition-colors";
  return (
    <div className="flex rounded-md border border-neutral-300 overflow-hidden shrink-0">
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`${base} ${lang === "en" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-100"}`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("zh")}
        className={`${base} ${lang === "zh" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-100"}`}
      >
        中文
      </button>
    </div>
  );
}
