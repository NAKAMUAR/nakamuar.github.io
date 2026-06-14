import { redirect } from "next/navigation";

import { AuthForm } from "@/components/AuthForm";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Cloud Memo</h1>
        <p className="mt-2 text-sm text-neutral-500">
          メールアドレスでログインまたは新規登録
        </p>
      </div>
      <AuthForm />
    </main>
  );
}
