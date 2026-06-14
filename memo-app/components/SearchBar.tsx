"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function SearchBar({
  defaultQuery,
  showArchived,
}: {
  defaultQuery: string;
  showArchived: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultQuery);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set("q", value.trim());
    } else {
      params.delete("q");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const archiveParams = new URLSearchParams(searchParams.toString());
  if (showArchived) {
    archiveParams.delete("archived");
  } else {
    archiveParams.set("archived", "1");
  }

  return (
    <div className="flex items-center gap-2">
      <form onSubmit={submit} className="flex-1">
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="メモを検索…"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
        />
      </form>
      <Link
        href={`${pathname}?${archiveParams.toString()}`}
        className={`whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-medium transition ${
          showArchived
            ? "border-neutral-900 bg-neutral-900 text-white"
            : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
        }`}
      >
        {showArchived ? "通常メモ" : "アーカイブ"}
      </Link>
    </div>
  );
}
