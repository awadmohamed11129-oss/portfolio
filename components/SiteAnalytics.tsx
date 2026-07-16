"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const OPT_OUT_KEY = "va-disable";

// localStorage can throw in private-browsing modes; treat that as "not opted out".
function optedOut() {
  try {
    return Boolean(localStorage.getItem(OPT_OUT_KEY));
  } catch {
    return false;
  }
}

export default function SiteAnalytics() {
  return (
    <>
      <Analytics
        beforeSend={(event: BeforeSendEvent) => (optedOut() ? null : event)}
      />
      <SpeedInsights beforeSend={(event) => (optedOut() ? null : event)} />
    </>
  );
}
