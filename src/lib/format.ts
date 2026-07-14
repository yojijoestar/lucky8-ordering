export function formatMoney(cents: number | null | undefined): string | null {
  if (cents == null) return null;
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function orderNumber(id: number): string {
  return `ORD-${String(id).padStart(4, "0")}`;
}

export function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function daysOverdue(dueAt: Date | string): number {
  return Math.floor(
    (Date.now() - new Date(dueAt).getTime()) / (1000 * 60 * 60 * 24)
  );
}
