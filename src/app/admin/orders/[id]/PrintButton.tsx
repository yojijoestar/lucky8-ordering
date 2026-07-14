"use client";

export default function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="text-xs border border-neutral-300 rounded-md px-3 py-1.5 hover:bg-neutral-100 whitespace-nowrap"
    >
      🖨 {label}
    </button>
  );
}
