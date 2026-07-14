import { cookies } from "next/headers";
import type { Lang } from "./i18n";

export async function getLang(): Promise<Lang> {
  const jar = await cookies();
  return jar.get("lang")?.value === "zh" ? "zh" : "en";
}
