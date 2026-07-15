"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { deleteOrder } from "@/app/actions/admin";
import { t, type Lang } from "@/lib/i18n";

export default function DeleteOrderButton({
  orderId,
  orderNumber,
  lang,
}: {
  orderId: number;
  orderNumber: string;
  lang: Lang;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = typed.trim().toUpperCase() === orderNumber.toUpperCase();

  // Always reopen empty: a stale confirmation from a previous open
  // would leave the delete button already unlocked.
  function close() {
    setOpen(false);
    setTyped("");
  }

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs border border-neutral-300 rounded-md px-3 py-1.5 hover:bg-neutral-100 whitespace-nowrap text-red-700"
      >
        {t(lang, "deleteOrder")}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 print:hidden"
          onClick={close}
          role="presentation"
        >
          <div
            className="bg-white rounded-xl w-full max-w-sm p-5 text-left"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-order-title"
          >
            <p
              id="delete-order-title"
              className="text-base font-medium text-neutral-900"
            >
              {t(lang, "deleteOrderTitle")}
            </p>
            <p className="mt-2 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md px-3 py-2 leading-snug">
              {t(lang, "deleteOrderWarning")}
            </p>

            <label
              htmlFor="confirm-order-number"
              className="block mt-4 text-sm text-neutral-600"
            >
              {t(lang, "deleteOrderTypeToConfirm")}{" "}
              <span className="font-mono text-neutral-900">{orderNumber}</span>
            </label>
            <input
              id="confirm-order-number"
              ref={inputRef}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              placeholder={orderNumber}
              className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 text-sm font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-red-400"
            />

            <form action={deleteOrder} className="mt-4 flex justify-end gap-2">
              <input type="hidden" name="orderId" value={orderId} />
              <button
                type="button"
                onClick={close}
                className="text-sm border border-neutral-300 rounded-md px-4 py-1.5 hover:bg-neutral-100"
              >
                {t(lang, "cancel")}
              </button>
              <ConfirmButton disabled={!matches} label={t(lang, "deleteOrder")} />
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function ConfirmButton({
  disabled,
  label,
}: {
  disabled: boolean;
  label: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="text-sm rounded-md px-4 py-1.5 bg-red-700 text-white hover:bg-red-800 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed"
    >
      {label}
    </button>
  );
}
