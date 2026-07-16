"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { OPT_OUT_KEY } from "@/components/SiteAnalytics";

export default function OptOut() {
  // null until mounted — the flag only exists client-side.
  const [excluded, setExcluded] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setExcluded(Boolean(localStorage.getItem(OPT_OUT_KEY)));
    } catch {
      setExcluded(false);
    }
  }, []);

  function update(next: boolean) {
    try {
      if (next) {
        localStorage.setItem(OPT_OUT_KEY, "1");
      } else {
        localStorage.removeItem(OPT_OUT_KEY);
      }
      setExcluded(next);
    } catch {
      // localStorage unavailable — nothing to store, tracking stays on
    }
  }

  if (excluded === null) return null;

  return (
    <div className="mt-8 rounded-lg border border-border/60 bg-card/30 p-5">
      <p className="text-sm">
        This browser is currently{" "}
        <span className="font-medium">
          {excluded
            ? "excluded — visits are not counted"
            : "counted in analytics"}
        </span>
        .
      </p>
      <div className="mt-4">
        {excluded ? (
          <Button variant="outline" onClick={() => update(false)}>
            Count my visits again
          </Button>
        ) : (
          <Button onClick={() => update(true)}>Stop counting my visits</Button>
        )}
      </div>
    </div>
  );
}
