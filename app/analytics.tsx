"use client";

import { Analytics } from "@vercel/analytics/next";

export default function SiteAnalytics() {
  return <Analytics beforeSend={(event) => event.url.includes("/admin") ? null : event} />;
}
