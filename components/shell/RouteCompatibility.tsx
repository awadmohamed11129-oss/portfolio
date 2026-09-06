"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { destinationForFragment, DESTINATION_PATHS } from "@/lib/portfolio/contracts";

export function RouteCompatibility() {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    const handle = () => {
      if (window.location.pathname !== "/") return;
      const legacy = destinationForFragment(window.location.hash);
      if (legacy) router.replace(DESTINATION_PATHS[legacy] + (window.location.hash === "#skills" ? "#skills" : ""));
    };
    handle();
    window.addEventListener("hashchange", handle);
    return () => window.removeEventListener("hashchange", handle);
  }, [pathname, router]);
  return null;
}
