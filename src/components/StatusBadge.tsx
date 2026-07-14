const styles: Record<string, string> = {
  SUBMITTED: "bg-amber-50 text-amber-800 border-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-800 border-blue-200",
  FULFILLED: "bg-green-50 text-green-800 border-green-200",
  CANCELLED: "bg-neutral-100 text-neutral-500 border-neutral-200",
  UNPAID: "bg-amber-50 text-amber-800 border-amber-200",
  PARTIAL: "bg-blue-50 text-blue-800 border-blue-200",
  PAID: "bg-green-50 text-green-800 border-green-200",
  OVERDUE: "bg-red-50 text-red-800 border-red-200",
};

export default function StatusBadge({
  label,
  status,
}: {
  label: string;
  status: string;
}) {
  return (
    <span
      className={`text-[11px] px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
        styles[status] ?? styles.CANCELLED
      }`}
    >
      {label}
    </span>
  );
}
