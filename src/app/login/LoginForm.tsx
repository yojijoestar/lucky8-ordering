"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { t, type Lang, type TKey } from "@/lib/i18n";

export default function LoginForm({ lang }: { lang: Lang }) {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm text-neutral-600 mb-1" htmlFor="email">
          {t(lang, "email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="store@example.com"
          className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
        />
      </div>
      <div>
        <label className="block text-sm text-neutral-600 mb-1" htmlFor="password">
          {t(lang, "password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-red-700">{t(lang, state.error as TKey)}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-neutral-900 text-white rounded-md py-2 text-sm hover:bg-neutral-700 disabled:opacity-60"
      >
        {t(lang, "login")}
      </button>
    </form>
  );
}
