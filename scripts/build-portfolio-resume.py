"""Rebuild the public general resume from verified portfolio content (September 2026).

Sources: content/profile.ts, content/experience.ts, content/case/*, and the
existing resume's education/contact details. No new employment/results claims.
"""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import KeepTogether, Paragraph, SimpleDocTemplate, Spacer

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public/pdfs/Mohamad_Awad_Resume.pdf"
styles = getSampleStyleSheet()
ink = colors.HexColor("#142b3b")
styles.add(
    ParagraphStyle(
        name="Name",
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=27,
        textColor=ink,
        spaceAfter=6,
    )
)
styles.add(
    ParagraphStyle(
        name="Contact",
        fontName="Helvetica",
        fontSize=8.7,
        leading=12,
        spaceAfter=4,
        textColor=colors.HexColor("#3d4c58"),
    )
)
styles.add(
    ParagraphStyle(
        name="Section",
        fontName="Helvetica-Bold",
        fontSize=10.6,
        leading=14,
        textColor=ink,
        spaceBefore=8,
        spaceAfter=4,
    )
)
styles.add(
    ParagraphStyle(
        name="Role", fontName="Helvetica-Bold", fontSize=9.7, leading=12, spaceAfter=2
    )
)
styles.add(
    ParagraphStyle(
        name="Copy",
        fontName="Helvetica",
        fontSize=9.3,
        leading=12,
        spaceAfter=3,
        alignment=TA_LEFT,
    )
)
styles.add(
    ParagraphStyle(
        name="BulletCopy", parent=styles["Copy"], leftIndent=10, firstLineIndent=-8
    )
)

story = []


def p(text, style="Copy"):
    return Paragraph(text, styles[style])


def section(title):
    story.append(p(title, "Section"))


def entry(title, details, bullets):
    story.append(
        KeepTogether(
            [
                p(title, "Role"),
                p(details, "Contact"),
                *[p("- " + item, "BulletCopy") for item in bullets],
            ]
        )
    )


story.extend(
    [
        p("Mohamad Awad", "Name"),
        p(
            'Toronto, ON | 647-507-2423 | <link href="mailto:mohamad.awad@torontomu.ca">mohamad.awad@torontomu.ca</link><br/>'
            '<link href="https://mohamadawad.vercel.app">mohamadawad.vercel.app</link> | '
            '<link href="https://www.linkedin.com/in/mohamad-awad-38071239b/">LinkedIn</link> | '
            '<link href="https://github.com/awadmohamed11129-oss">GitHub</link>',
            "Contact",
        ),
        p(
            "Civil engineering student at Toronto Metropolitan University. I build software for pavement inspection, public data and document automation, with an emphasis on traceable results and clear limitations."
        ),
    ]
)
section("Education")
story.extend(
    [
        p(
            "Bachelor of Engineering, Civil Engineering | Toronto Metropolitan University",
            "Role",
        ),
        p("September 2024 to June 2028 (expected) | Toronto, Ontario"),
    ]
)
section("Experience")
entry(
    "Data Engineer, work placement | Toronto smart-city startup",
    "May to July 2026",
    [
        "Developed Python ingestors for six City of Toronto mobility datasets, with data contracts, tests and documentation; submitted the work for technical review.",
        "Built a signal engine over eight years of Toronto 311 data, investigating category renames and missing-month artifacts before reporting trends.",
    ],
)
entry(
    "Document Automation Workstream Lead | Pop-Up Chapel Co. (Riipen)",
    "April to May 2026",
    [
        "Led document automation within a student consulting engagement: a prototype generates eight branded documents in about ten seconds per booking, against an estimated eight hours of manual preparation.",
        "Built the Python generation pipeline and a Next.js companion tool; mapped client communication touchpoints and identified missing messages.",
    ],
)
entry(
    "Fitness Centre Desk Supervisor | Toronto Metropolitan University",
    "May 2025 to July 2026",
    [
        "Coordinated daily floor operations for a team of 35 and inspected 30 or more pieces of equipment per shift, filing maintenance requests when needed.",
    ],
)
entry(
    "Project Coordinator | BrandEQ",
    "June to August 2024",
    [
        "Tracked timelines and deliverables across six client accounts and prepared weekly client progress updates.",
    ],
)
section("Selected projects")
entry(
    "PaveScan AI | Independent project",
    "2026",
    [
        "Built a dashcam inspection pipeline combining computer vision, GPS-linked findings, a density-based condition estimate and PDF reporting.",
        "The bundled Toronto sample covers 3,571 m of scored road and 693 frames. Its 385 model findings include 275 possible shadows; outputs are review aids, not certified field inspections.",
        "Reworked scoring around fixed sample units after finding that the retired scorer changed with reporting-segment length.",
    ],
)
entry(
    "LocalFlow | Personal software project",
    "2026",
    [
        "Built local voice dictation with Whisper and a local language model, integrating a hotkey-to-text workflow with GPU and CPU processing paths.",
    ],
)
story.append(
    p(
        "Engineering coursework: requirements, sketches and CAD concepts for a mobile storage cart and walking cane. Design work only; no physical fabrication claimed."
    )
)
section("Technical skills")
story.extend(
    [
        p(
            "<b>Engineering:</b> AutoCAD, Civil 3D, Revit, SolidWorks, Microsoft Project, Excel."
        ),
        p(
            "<b>Software and data:</b> Python, TypeScript, React, Next.js, PostgreSQL, ETL, Git, pytest, Playwright."
        ),
        p(
            "<b>Computer vision:</b> PyTorch, YOLO11, OpenCV, ONNX Runtime, segmentation and model evaluation."
        ),
        Spacer(1, 2),
    ]
)

doc = SimpleDocTemplate(
    str(OUTPUT),
    pagesize=letter,
    rightMargin=38,
    leftMargin=38,
    topMargin=32,
    bottomMargin=30,
    title="Mohamad Awad - Resume",
    author="Mohamad Awad",
)
doc.build(story)
print(OUTPUT)
