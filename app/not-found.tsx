import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-5xl flex-col items-start px-6 py-24 sm:py-32">
      <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4">
        404
      </p>
      <h1 className="font-[family-name:var(--font-fraunces)] text-4xl sm:text-5xl font-medium leading-tight tracking-tight">
        This page doesn&apos;t exist
      </h1>
      <p className="mt-5 text-lg text-muted-foreground max-w-xl leading-relaxed">
        The link may be old, or the address has a typo. Everything on this
        site is reachable from the home page.
      </p>
      <Link href="/" className={`${buttonVariants({ size: "lg" })} mt-8`}>
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Back to home
      </Link>
    </section>
  );
}
