"use client";

import { deleteOrder } from "@/app/actions/admin";

export default function DeleteOrderButton({
  orderId,
  label,
  confirmText,
}: {
  orderId: number;
  label: string;
  confirmText: string;
}) {
  return (
    <form
      action={deleteOrder}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      <input type="hidden" name="orderId" value={orderId} />
      <button
        type="submit"
        className="text-xs border border-red-200 text-red-700 rounded-md px-3 py-1.5 hover:bg-red-50 whitespace-nowrap"
      >
        {label}
      </button>
    </form>
  );
}
