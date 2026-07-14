import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";
import LanguageToggle from "@/components/LanguageToggle";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(session.role === "ADMIN" ? "/admin/orders" : "/");
  const lang = await getLang();

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-medium text-neutral-900">
            {t(lang, "appName")}
          </h1>
          <LanguageToggle lang={lang} />
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          <LoginForm lang={lang} />
        </div>
        <p className="text-xs text-neutral-500 mt-4 text-center leading-relaxed">
          {t(lang, "loginHint")}
        </p>
      </div>
    </main>
  );
}
