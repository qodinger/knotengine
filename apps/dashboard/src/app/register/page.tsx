import { redirect } from "next/navigation";

interface RegisterPageProps {
  searchParams: Promise<{ ref?: string }>;
}

// Registration is handled via OAuth on the login page.
// Forward the ref param so affiliate tracking cookie is set correctly.
export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const { ref } = await searchParams;
  const target = ref ? `/login?ref=${encodeURIComponent(ref)}` : "/login";
  redirect(target);
}
