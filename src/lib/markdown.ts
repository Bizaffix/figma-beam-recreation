// Tiny markdown renderer for blog/news (from quilt-match + images).
// Supports: ## / ###, paragraphs, **bold**, *italic*, [link](url), ![alt](url), lists, blockquotes.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInline(s: string): string {
  let out = escapeHtml(s);
  // Images before links so ![alt](url) is not parsed as a link
  out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, url) =>
    `<img src="${url}" alt="${alt}" loading="lazy" class="inline-block max-w-full my-2 rounded-sm border border-border" />`);
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, t, u) =>
    `<a href="${u}" class="underline hover:text-rust">${t}</a>`);
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return out;
}

const IMAGE_LINE = /^!\[([^\]]*)\]\(([^)]+)\)\s*$/;

export function renderMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let para: string[] = [];
  let list: string[] = [];

  const flushPara = () => {
    if (para.length) {
      out.push(`<p class="mb-5 leading-relaxed text-foreground/85">${renderInline(para.join(" "))}</p>`);
      para = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      out.push(
        `<ul class="list-disc pl-6 mb-5 space-y-2 text-foreground/85">${list
          .map((i) => `<li>${renderInline(i)}</li>`)
          .join("")}</ul>`,
      );
      list = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushPara();
      flushList();
      continue;
    }
    if (line.startsWith("### ")) {
      flushPara();
      flushList();
      out.push(
        `<h3 class="font-display text-xl mt-8 mb-3 text-foreground">${renderInline(line.slice(4))}</h3>`,
      );
    } else if (line.startsWith("## ")) {
      flushPara();
      flushList();
      out.push(
        `<h2 class="font-display text-2xl md:text-3xl mt-10 mb-4 text-foreground">${renderInline(line.slice(3))}</h2>`,
      );
    } else if (line.startsWith("> ")) {
      flushPara();
      flushList();
      out.push(
        `<blockquote class="border-l-2 border-rust pl-4 italic my-6 text-foreground/80">${renderInline(line.slice(2))}</blockquote>`,
      );
    } else if (/^[-*]\s+/.test(line)) {
      flushPara();
      list.push(line.replace(/^[-*]\s+/, ""));
    } else if (IMAGE_LINE.test(line.trim())) {
      flushPara();
      flushList();
      const m = line.trim().match(IMAGE_LINE)!;
      const alt = escapeHtml(m[1]);
      const src = escapeHtml(m[2]);
      out.push(
        `<figure class="my-8"><img src="${src}" alt="${alt}" loading="lazy" class="w-full aspect-[16/10] object-cover border border-border" />${alt ? `<figcaption class="mt-2 text-sm text-muted-foreground italic text-center">${alt}</figcaption>` : ""}</figure>`,
      );
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return out.join("\n");
}
