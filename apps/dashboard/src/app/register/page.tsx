import { redirect } from "next/navigation";

// Registration is now handled automatically via OAuth.
// Redirect to login which has the OAuth sign-in buttons.
export default function RegisterPage() {
  redirect("/login");
}
