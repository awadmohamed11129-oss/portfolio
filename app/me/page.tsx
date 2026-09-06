import type { Metadata } from "next";
import OptOut from "./OptOut";

export const metadata: Metadata = {
  title: "Analytics opt-out",
  robots: { index: false, follow: false },
};

export default function MePage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-24">
      <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-medium tracking-tight">
        Analytics opt-out
      </h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        Use the button below to mark the current browser so its visits and clicks are not
        counted in this site&apos;s analytics. The setting is stored on the
        device, so enable it in every browser you use.
      </p>
      <OptOut />
    </div>
  );
}
