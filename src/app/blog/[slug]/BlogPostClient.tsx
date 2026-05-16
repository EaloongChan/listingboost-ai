"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BlogPost as BlogPostType } from "@/lib/blog";

interface BlogPostClientProps {
  post: BlogPostType;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const tagColors: Record<string, string> = {
  amazon: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  seo: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ecommerce: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  marketing: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  templates: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  copywriting: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  "ai tools": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  automation: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  "listing optimization": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  "product descriptions": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export function BlogPostClient({ post }: BlogPostClientProps) {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <article className="pt-32 pb-20 sm:pt-40 sm:pb-28">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            {/* Back link */}
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 mb-8 group"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="group-hover:-translate-x-0.5 transition-transform duration-200"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Blog
            </Link>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                    tagColors[tag.toLowerCase()] || "bg-muted text-muted-foreground"
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-[1.15] mb-4">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-10 pb-10 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-primary">
                    <path
                      d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className="font-medium text-foreground">{post.author}</span>
              </div>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
              <span>{post.readingTime}</span>
            </div>

            {/* Content */}
            <div
              className="prose prose-neutral dark:prose-invert max-w-none
                prose-headings:scroll-mt-20
                prose-h2:text-2xl prose-h2:font-bold prose-h2:tracking-tight prose-h2:mt-10 prose-h2:mb-4
                prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3
                prose-p:text-base prose-p:leading-relaxed prose-p:text-muted-foreground
                prose-strong:text-foreground prose-strong:font-semibold
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-ul:my-4 prose-ul:pl-6
                prose-ol:my-4 prose-ol:pl-6
                prose-li:text-muted-foreground prose-li:leading-relaxed
                prose-li:mb-1
                prose-code:text-sm prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md
                prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-xl
                prose-blockquote:border-l-primary prose-blockquote:border-l-4 prose-blockquote:pl-4
                prose-hr:border-border prose-hr:my-10
                prose-img:rounded-xl prose-img:shadow-sm"
              dangerouslySetInnerHTML={{
                __html: markdownToHtml(post.content),
              }}
            />

            {/* Bottom CTA */}
            <div className="mt-16 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-violet-500/5 border border-primary/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary">
                    <path
                      d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Try ListingBoost AI for Free
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Generate high-converting product listings in seconds. No signup required.
                  </p>
                </div>
                <Link
                  href="/#workspace"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary-hover rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-primary/20 whitespace-nowrap"
                >
                  Start Free
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}

/**
 * Simple Markdown to HTML converter
 * Handles: headings, bold, italic, links, lists, code, blockquotes, hr, paragraphs
 */
function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const result: string[] = [];
  let inList = false;
  let listType: "ul" | "ol" = "ul";
  let inCodeBlock = false;
  let inBlockquote = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        result.push("</code></pre>");
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        const lang = line.trim().slice(3).trim();
        result.push(`<pre${lang ? ` class="language-${lang}"` : ""}><code>`);
      }
      continue;
    }

    if (inCodeBlock) {
      result.push(escapeHtml(line));
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      if (inList) {
        result.push(listType === "ul" ? "</ul>" : "</ol>");
        inList = false;
      }
      if (inBlockquote) {
        result.push("</blockquote>");
        inBlockquote = false;
      }
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
      result.push("<hr />");
      continue;
    }

    // Blockquote
    if (line.trim().startsWith("> ")) {
      if (!inBlockquote) {
        result.push("<blockquote>");
        inBlockquote = true;
      }
      result.push(`<p>${inlineFormat(line.trim().slice(2))}</p>`);
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      result.push(`<h${level}>${inlineFormat(headingMatch[2])}</h${level}>`);
      continue;
    }

    // Unordered list
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      if (!inList || listType !== "ul") {
        if (inList) result.push(listType === "ul" ? "</ul>" : "</ol>");
        result.push("<ul>");
        inList = true;
        listType = "ul";
      }
      result.push(`<li>${inlineFormat(line.trim().slice(2))}</li>`);
      continue;
    }

    // Ordered list
    const olMatch = line.trim().match(/^\d+\.\s+(.+)/);
    if (olMatch) {
      if (!inList || listType !== "ol") {
        if (inList) result.push(listType === "ul" ? "</ul>" : "</ol>");
        result.push("<ol>");
        inList = true;
        listType = "ol";
      }
      result.push(`<li>${inlineFormat(olMatch[1])}</li>`);
      continue;
    }

    // Close list if we hit non-list content
    if (inList) {
      result.push(listType === "ul" ? "</ul>" : "</ol>");
      inList = false;
    }
    if (inBlockquote) {
      result.push("</blockquote>");
      inBlockquote = false;
    }

    // Paragraph
    result.push(`<p>${inlineFormat(line)}</p>`);
  }

  // Close any remaining open tags
  if (inList) result.push(listType === "ul" ? "</ul>" : "</ol>");
  if (inCodeBlock) result.push("</code></pre>");
  if (inBlockquote) result.push("</blockquote>");

  return result.join("\n");
}

function inlineFormat(text: string): string {
  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Italic
  text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
  // Inline code
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  // Links [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  return text;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
