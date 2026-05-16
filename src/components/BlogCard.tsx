"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface BlogCardProps {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  readingTime: string;
  className?: string;
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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function BlogCard({ slug, title, description, date, tags, readingTime, className }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${slug}`}
      className={cn(
        "group block bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 no-underline",
        className
      )}
    >
      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className={cn(
              "px-2.5 py-0.5 rounded-full text-[11px] font-medium",
              tagColors[tag.toLowerCase()] || "bg-muted text-muted-foreground"
            )}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-200 mb-2 leading-snug">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
        {description}
      </p>

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <time dateTime={date}>{formatDate(date)}</time>
        <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
        <span>{readingTime}</span>
      </div>

      {/* Arrow indicator */}
      <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        Read article
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
