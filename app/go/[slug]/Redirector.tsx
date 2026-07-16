"use client";

import { useEffect } from "react";

export default function Redirector({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  useEffect(() => {
    // Brief hold so the analytics pageview beacon can fire before navigation.
    const timer = setTimeout(() => window.location.replace(href), 600);
    return () => clearTimeout(timer);
  }, [href]);

  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <p className="text-muted-foreground">Taking you to {label}…</p>
      <p className="mt-4 text-sm">
        <a
          href={href}
          className="underline underline-offset-4 hover:text-foreground"
        >
          Continue without waiting
        </a>
      </p>
    </div>
  );
}
