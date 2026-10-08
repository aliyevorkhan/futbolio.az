import { redirect } from "next/navigation";

/**
 * `/admin` itself has no content of its own — applications is the
 * default landing page for a logged-in admin. The `(protected)` layout
 * (and middleware's cookie fast-path) handle the auth guard.
 */
export default function AdminHomePage() {
  redirect("/admin/applications");
}
