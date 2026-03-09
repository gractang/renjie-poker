from pathlib import Path

out_path = Path("output/pdf/renjie-poker-app-summary.pdf")
out_path.parent.mkdir(parents=True, exist_ok=True)

PAGE_W = 612
PAGE_H = 792
LEFT = 48
TOP = 742
LINE_H = 14

lines = [
    ("title", "Renjie Poker - App Summary"),
    ("sp", ""),
    ("h", "What It Is"),
    ("p", "Renjie Poker is a browser-based React game where the player builds a 5-card hand by selecting subsets from the remaining deck."),
    ("p", "The dealer receives all non-matching cards dealt during each turn; final hands are scored with poker rules and ties go to dealer."),
    ("sp", ""),
    ("h", "Who It Is For"),
    ("b", "Primary persona (explicit): Not found in repo."),
    ("b", "Likely user (inferred from UI/rules): players practicing probability and decision-making in a custom poker variant."),
    ("sp", ""),
    ("h", "What It Does"),
    ("b", "Interactive card subset selection by suit, rank, select-all, and clear actions."),
    ("b", "Deals one player card per turn when a selected card appears; dealer takes prior dealt cards in that turn."),
    ("b", "Tracks remaining deck and disables cards already dealt."),
    ("b", "Evaluates best poker hands for player and dealer, including straight/flush/full house/quads logic."),
    ("b", "Completes showdown when player reaches 5 cards; dealer auto-tops to at least 8 cards."),
    ("b", "Supports keyboard shortcuts for selection and game actions (Enter, S/H/C/D, 2-9/T/J/Q/K/A, 0, X, N, ?)."),
    ("b", "Includes theme toggle with localStorage persistence and a modal How to Play guide."),
    ("sp", ""),
    ("h", "How It Works (Repo Evidence)"),
    ("b", "UI layer: React components in src/app and src/components render controls, hands, selection grid, modal, and theme toggle."),
    ("b", "Game state/service layer: useRenjiePokerEngine hook in src/engine manages state, turn logic, and endgame transitions."),
    ("b", "Domain logic: src/lib/deck builds/shuffles cards; src/lib/poker-eval scores and compares hands."),
    ("b", "Data flow: UI events -> engine actions (select/deal/reset) -> state update -> derived hand evaluations -> re-render + message updates."),
    ("b", "Backend/API/database: Not found in repo."),
    ("sp", ""),
    ("h", "How To Run (Minimal)"),
    ("n", "1. Install dependencies: npm install"),
    ("n", "2. Start dev server: npm run dev"),
    ("n", "3. Open the local Vite URL shown in terminal (typically http://localhost:5173)."),
]

# Text helpers

def esc(s: str) -> str:
    return s.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')

content = []
content.append("1 1 1 rg")
content.append("0 0 612 792 re f")
content.append("0 0 0 rg")
content.append("BT")
content.append(f"/F2 20 Tf {LEFT} {TOP} Td")
content.append(f"({esc(lines[0][1])}) Tj")
content.append("ET")

y = TOP - 30
for kind, text in lines[1:]:
    if kind == "sp":
        y -= 6
        continue
    if kind == "h":
        content.append("BT")
        content.append(f"/F2 12 Tf {LEFT} {y} Td")
        content.append(f"({esc(text)}) Tj")
        content.append("ET")
        y -= LINE_H
        continue
    if kind == "p":
        content.append("BT")
        content.append(f"/F1 10 Tf {LEFT} {y} Td")
        content.append(f"({esc(text)}) Tj")
        content.append("ET")
        y -= LINE_H
        continue
    if kind == "b":
        content.append("BT")
        content.append(f"/F1 10 Tf {LEFT + 12} {y} Td")
        content.append(f"(- {esc(text)}) Tj")
        content.append("ET")
        y -= LINE_H
        continue
    if kind == "n":
        content.append("BT")
        content.append(f"/F1 10 Tf {LEFT + 12} {y} Td")
        content.append(f"({esc(text)}) Tj")
        content.append("ET")
        y -= LINE_H

# footer evidence note
content.append("BT")
content.append(f"/F1 8 Tf {LEFT} 30 Td")
content.append("(Evidence sources: src/app/App.jsx, src/engine/useRenjiePokerEngine.js, src/lib/deck.js, src/lib/poker-eval.js, src/components/*.jsx, package.json.) Tj")
content.append("ET")

stream = "\n".join(content).encode("latin-1", errors="replace")

objects = []

def add_obj(data: bytes) -> int:
    objects.append(data)
    return len(objects)

# 1 Catalog
add_obj(b"<< /Type /Catalog /Pages 2 0 R >>")
# 2 Pages
add_obj(b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
# 3 Page
add_obj(b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>")
# 4 Font regular
add_obj(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
# 5 Font bold
add_obj(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")
# 6 Content
add_obj(b"<< /Length " + str(len(stream)).encode("ascii") + b" >>\nstream\n" + stream + b"\nendstream")

pdf = bytearray()
pdf.extend(b"%PDF-1.4\n")

offsets = [0]
for i, obj in enumerate(objects, start=1):
    offsets.append(len(pdf))
    pdf.extend(f"{i} 0 obj\n".encode("ascii"))
    pdf.extend(obj)
    pdf.extend(b"\nendobj\n")

xref_pos = len(pdf)
pdf.extend(f"xref\n0 {len(objects)+1}\n".encode("ascii"))
pdf.extend(b"0000000000 65535 f \n")
for off in offsets[1:]:
    pdf.extend(f"{off:010d} 00000 n \n".encode("ascii"))

pdf.extend(
    f"trailer\n<< /Size {len(objects)+1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode("ascii")
)

out_path.write_bytes(pdf)
print(out_path)
