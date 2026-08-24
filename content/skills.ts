import type { SkillGroup } from "./types";

/**
 * Skills, grouped. Ordered so the engineering-software group leads for a civil
 * reader and the ML group leads for a technical one.
 */
export const skillGroups: readonly SkillGroup[] = [
  {
    label: "Engineering software",
    items: ["AutoCAD", "Civil 3D", "Autodesk Revit", "SolidWorks", "Microsoft Project"],
  },
  {
    label: "Computer vision and ML",
    items: [
      "PyTorch",
      "Ultralytics YOLO11",
      "Instance segmentation",
      "SAHI tiled inference",
      "ONNX Runtime",
      "OpenCV",
      "Model ensembling",
      "Cloud GPU training (Colab Pro)",
    ],
  },
  {
    label: "Python",
    items: ["Python 3.12", "Pydantic", "Jinja2", "Streamlit", "pytest", "Playwright", "ruff"],
  },
  {
    label: "Data and infrastructure",
    items: [
      "PostgreSQL",
      "psycopg2",
      "ETL pipeline design",
      "Data contracts",
      "CKAN open-data APIs",
      "Google Sheets API",
      "Git",
      "GitHub",
      "Vercel",
    ],
  },
  {
    label: "Web",
    items: ["TypeScript", "Next.js (App Router)", "React", "Tailwind CSS", "Zod"],
  },
  {
    label: "AI tooling",
    items: ["Anthropic Claude SDK", "Gemini API", "Local LLM inference (llama.cpp)", "Agentic workflows"],
  },
  {
    label: "Standards and documentation",
    items: ["ASTM D6433", "Microsoft Excel (advanced)", "Word", "PowerPoint"],
  },
];
