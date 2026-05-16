import fs from "fs";
import path from "path";

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  image: string;
  readingTime: string;
  content: string;
}

interface Frontmatter {
  title: string;
  slug: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  image: string;
}

function parseFrontmatter(raw: string): { frontmatter: Frontmatter; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: { title: "", slug: "", description: "", date: "", author: "", tags: [], image: "" }, content: raw };
  }

  const fmStr = match[1];
  const content = match[2].trim();

  const frontmatter: Record<string, unknown> = {};
  fmStr.split("\n").forEach((line) => {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) return;
    const key = line.slice(0, colonIdx).trim();
    let val: unknown = line.slice(colonIdx + 1).trim();
    // Strip quotes
    if (typeof val === "string" && (val.startsWith('"') && val.endsWith('"') || val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    // Parse array
    if (typeof val === "string" && val.startsWith("[") && val.endsWith("]")) {
      val = val
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""));
    }
    frontmatter[key] = val;
  });

  return {
    frontmatter: frontmatter as unknown as Frontmatter,
    content,
  };
}

function estimateReadingTime(text: string): string {
  const words = text.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

function getAllFiles(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .sort()
    .reverse(); // newest first
}

export function getAllPosts(): Omit<BlogPost, "content">[] {
  const files = getAllFiles();
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
    const { frontmatter, content } = parseFrontmatter(raw);
    const slug = file.replace(/\.mdx?$/, "");
    return {
      slug: frontmatter.slug || slug,
      title: frontmatter.title,
      description: frontmatter.description,
      date: frontmatter.date,
      author: frontmatter.author || "ListingBoost AI Team",
      tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
      image: frontmatter.image || `/blog/${slug}.svg`,
      readingTime: estimateReadingTime(content),
    };
  });
}

export function getPostBySlug(slug: string): BlogPost | null {
  const files = getAllFiles();
  const file = files.find((f) => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, f), "utf-8");
    const { frontmatter } = parseFrontmatter(raw);
    return (frontmatter.slug || f.replace(/\.mdx?$/, "")) === slug;
  });

  if (!file) return null;

  const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
  const { frontmatter, content } = parseFrontmatter(raw);
  const slugFromFm = frontmatter.slug || file.replace(/\.mdx?$/, "");

  return {
    slug: slugFromFm,
    title: frontmatter.title,
    description: frontmatter.description,
    date: frontmatter.date,
    author: frontmatter.author || "ListingBoost AI Team",
    tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
    image: frontmatter.image || `/blog/${slugFromFm}.svg`,
    readingTime: estimateReadingTime(content),
    content,
  };
}

export function getAllSlugs(): string[] {
  const files = getAllFiles();
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
    const { frontmatter } = parseFrontmatter(raw);
    return frontmatter.slug || file.replace(/\.mdx?$/, "");
  });
}
