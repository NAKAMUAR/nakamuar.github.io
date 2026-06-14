import Link from "next/link";

import { SignOutButton } from "@/components/SignOutButton";

export function Nav({
  active,
  email,
}: {
  active: "memo" | "calendar";
  email: string;
}) {
  const tab = (href: string, label: string, key: string) => (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active === key
          ? "bg-neutral-900 text-white"
          : "text-neutral-600 hover:bg-neutral-100"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="mb-6 flex items-center justify-between gap-4">
      <nav className="flex items-center gap-1">
        {tab("/", "メモ", "memo")}
        {tab("/calendar", "カレンダー", "calendar")}
      </nav>
      <div className="flex items-center gap-2">
        <span className="hidden truncate text-xs text-neutral-500 sm:inline">
          {email}
        </span>
        <SignOutButton />
      </div>
    </header>
  );
}
