import { FileText, Mail } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/BrandIcons";

const links = [
  {
    label: "Email",
    href: "mailto:mohamad.awad@torontomu.ca",
    display: "mohamad.awad@torontomu.ca",
    icon: Mail,
    external: false,
  },
  {
    label: "GitHub",
    href: "https://github.com/awadmohamed11129-oss",
    display: "github.com/awadmohamed11129-oss",
    icon: GithubIcon,
    external: true,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/mohamad-awad-38071239b/",
    display: "in/mohamad-awad",
    icon: LinkedinIcon,
    external: true,
  },
  {
    label: "Resume",
    href: "/pdfs/Mohamad_Awad_Resume.pdf",
    display: "Mohamad_Awad_Resume.pdf",
    icon: FileText,
    external: true,
  },
];

export function ContactStrip() {
  return (
    <section
      id="contact"
      className="mx-auto max-w-5xl px-6 py-16 sm:py-20 border-t border-border/40"
    >
      <h2 className="font-[family-name:var(--font-fraunces)] text-3xl sm:text-4xl font-medium tracking-tight mb-8">
        Get in touch
      </h2>
      <p className="text-muted-foreground mb-10 max-w-2xl">
        Civil engineering co-ops, Riipen FuturePath placements, or anything
        adjacent — happy to talk.
      </p>
      <ul className="grid gap-4 sm:grid-cols-2">
        {links.map(({ label, href, display, icon: Icon, external }) => (
          <li key={label}>
            <a
              href={href}
              {...(external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="group flex items-center gap-4 rounded-lg border border-border/60 bg-card/30 px-5 py-4 transition-colors hover:border-primary/40 hover:bg-card/60"
            >
              <Icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {label}
                </span>
                <span className="text-sm sm:text-base">{display}</span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
