import { Badge } from "@/components/ui/badge";

type SkillGroup = {
  label: string;
  skills: string[];
};

const groups: SkillGroup[] = [
  {
    label: "Engineering software",
    skills: ["AutoCAD", "Civil 3D", "Autodesk Revit", "SolidWorks", "Microsoft Project"],
  },
  {
    label: "Programming & ML",
    skills: [
      "Python",
      "Pydantic",
      "Jinja2",
      "Streamlit",
      "Playwright",
      "OpenCV",
      "PyTorch",
      "Ultralytics YOLO11",
      "SAHI",
      "TypeScript",
      "Next.js (App Router)",
      "React",
      "Tailwind CSS",
      "shadcn/ui",
    ],
  },
  {
    label: "Data & infrastructure",
    skills: [
      "PostgreSQL",
      "Google Sheets API",
      "Stripe webhooks",
      "Vercel",
      "GitHub",
      "Git",
    ],
  },
  {
    label: "AI / automation tooling",
    skills: [
      "Anthropic Claude SDK",
      "Gemini API",
      "Zod",
      "HMAC-signed auth",
      "Agentic workflows",
      "Cloud GPU training (Google Colab Pro)",
    ],
  },
  {
    label: "Office & documentation",
    skills: ["Microsoft Excel (advanced)", "Word", "PowerPoint"],
  },
];

export function Skills() {
  return (
    <section
      id="skills"
      className="mx-auto max-w-5xl px-6 py-16 sm:py-20 border-t border-border/40"
    >
      <h2 className="font-[family-name:var(--font-fraunces)] text-3xl sm:text-4xl font-medium tracking-tight mb-10">
        Skills
      </h2>
      <div className="space-y-8 max-w-3xl">
        {groups.map(({ label, skills }) => (
          <div
            key={label}
            className="grid sm:grid-cols-[200px_1fr] gap-3 sm:gap-6 items-start"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground sm:pt-1.5">
              {label}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="h-7 text-sm font-normal px-3"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
