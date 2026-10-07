import { Fragment } from "react";

/**
 * Vienkāršs, drošs teksta formatētājs administrēšanas panelī ievadītajam saturam.
 * Atbalsta:  tukšu rindu starp rindkopām · "## Virsraksts" · "- saraksta punkts" · **treknraksts**
 * HTML netiek interpretēts, tāpēc XSS nav iespējams.
 */
export default function RichText({ text, className }: { text: string; className?: string }) {
  if (!text.trim()) return null;
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/);

  return (
    <div className={className ?? "prose-sd"}>
      {blocks.map((block, i) => {
        const lines = block.split("\n").filter((l) => l.trim());
        if (lines.length === 0) return null;

        // Blokā var būt virsraksts, kam seko saraksts bez tukšas rindas
        const parts: React.ReactNode[] = [];
        let list: string[] = [];
        const flushList = () => {
          if (list.length) {
            parts.push(
              <ul key={`ul-${parts.length}`}>
                {list.map((item, k) => (
                  <li key={k}>{inline(item)}</li>
                ))}
              </ul>,
            );
            list = [];
          }
        };
        let paragraph: string[] = [];
        const flushParagraph = () => {
          if (paragraph.length) {
            parts.push(<p key={`p-${parts.length}`}>{inline(paragraph.join(" "))}</p>);
            paragraph = [];
          }
        };

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("## ")) {
            flushList();
            flushParagraph();
            parts.push(<h2 key={`h-${parts.length}`}>{trimmed.slice(3)}</h2>);
          } else if (/^[-•*]\s+/.test(trimmed)) {
            flushParagraph();
            list.push(trimmed.replace(/^[-•*]\s+/, ""));
          } else {
            flushList();
            paragraph.push(trimmed);
          }
        }
        flushList();
        flushParagraph();
        return <Fragment key={i}>{parts}</Fragment>;
      })}
    </div>
  );
}

function inline(text: string): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i} className="text-ink">{part.slice(2, -2)}</strong> : part,
  );
}
