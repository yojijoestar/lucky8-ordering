import { getLang } from "@/lib/lang-server";
import CartView from "./CartView";

export default async function CartPage() {
  const lang = await getLang();
  return <CartView lang={lang} />;
}
