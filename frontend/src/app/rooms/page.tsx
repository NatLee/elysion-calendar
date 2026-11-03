import { redirect } from "next/navigation";

// The schedule used to live at /rooms behind a landing page; it is the home page now.
// Kept so old bookmarks still work.
export default function RoomsPage() {
  redirect("/");
}
