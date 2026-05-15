"use client";

import { useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n/context";
import {
  type ListingFormData,
  type GeneratedListing,
  generateMockListing,
} from "@/lib/types";

export function Workspace() {
  const { t } = useI18n();

  const [formData, setFormData] = useState<ListingFormData>({
    productName: "",
    keySellingPoints: "",
    targetAudience: "amazon-shoppers",
    tone: "professional",
    platform: "amazon",
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedListing | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleChange = useCallback(
    (field: keyof ListingFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleGenerate = useCallback(async () => {
    if (!formData.productName.trim()) return;

    setIsGenerating(true);
    setResult(null);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const generated = generateMockListing(formData);
    setResult(generated);
    setIsGenerating(false);
  }, [formData]);

  const handleCopy = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  }, []);

  const handleCopyAll = useCallback(() => {
    if (!result) return;
    const fullText = `${result.title}\n\n${result.bulletPoints
      .map((bp) => bp)
      .join("\n\n")}\n\n${result.productDescription}`;
    handleCopy(fullText, "all");
  }, [result, handleCopy]);

  return (
    <section id="workspace" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
            {t.workspace.sectionTitle}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t.workspace.sectionSubtitle}
          </p>
        </div>

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* ─── LEFT: Input Form ─── */}
          <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {t.workspace.productDetails}
              </h3>
            </div>

            <div className="space-y-5">
              {/* Product Name */}
              <div>
                <label
                  htmlFor="productName"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  {t.workspace.productName}{" "}
                  <span className="text-destructive">
                    {t.workspace.productNameRequired}
                  </span>
                </label>
                <input
                  id="productName"
                  type="text"
                  placeholder={t.workspace.productNamePlaceholder}
                  value={formData.productName}
                  onChange={(e) => handleChange("productName", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Key Selling Points */}
              <div>
                <label
                  htmlFor="sellingPoints"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  {t.workspace.keySellingPoints}
                </label>
                <textarea
                  id="sellingPoints"
                  placeholder={t.workspace.keySellingPointsPlaceholder}
                  rows={3}
                  value={formData.keySellingPoints}
                  onChange={(e) =>
                    handleChange("keySellingPoints", e.target.value)
                  }
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 resize-none"
                />
              </div>

              {/* Target Audience */}
              <div>
                <label
                  htmlFor="audience"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  {t.workspace.targetAudience}
                </label>
                <div className="relative">
                  <select
                    id="audience"
                    value={formData.targetAudience}
                    onChange={(e) =>
                      handleChange("targetAudience", e.target.value)
                    }
                    className="w-full appearance-none px-4 py-3 pr-10 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 cursor-pointer"
                  >
                    {t.options.audiences.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>

              {/* Tone & Platform Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="tone"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    {t.workspace.tone}
                  </label>
                  <div className="relative">
                    <select
                      id="tone"
                      value={formData.tone}
                      onChange={(e) => handleChange("tone", e.target.value)}
                      className="w-full appearance-none px-4 py-3 pr-10 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 cursor-pointer"
                    >
                      {t.options.tones.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="platform"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    {t.workspace.platform}
                  </label>
                  <div className="relative">
                    <select
                      id="platform"
                      value={formData.platform}
                      onChange={(e) =>
                        handleChange("platform", e.target.value)
                      }
                      className="w-full appearance-none px-4 py-3 pr-10 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 cursor-pointer"
                    >
                      {t.options.platforms.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!formData.productName.trim() || isGenerating}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-primary-foreground bg-primary hover:bg-primary-hover rounded-xl transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isGenerating ? (
                  <>
                    <svg
                      className="animate-spin-slow"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="opacity-25"
                      />
                      <path
                        d="M12 2a10 10 0 019.95 9"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                    {t.workspace.generatingBtn}
                  </>
                ) : (
                  <>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    {t.workspace.generateBtn}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ─── RIGHT: Output Area ─── */}
          <div className="bg-card rounded-2xl border border-border shadow-sm flex flex-col min-h-[500px]">
            {/* Output Header */}
            <div className="flex items-center justify-between px-6 sm:px-8 pt-6 sm:pt-8 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-success"
                  >
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {t.workspace.generatedListing}
                </h3>
              </div>
              {result && (
                <button
                  onClick={handleCopyAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-accent transition-all duration-200"
                >
                  {copiedField === "all" ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      {t.workspace.copied}
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                      {t.workspace.copyAll}
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Output Body */}
            <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
              {/* Empty State */}
              {!result && !isGenerating && (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-muted-foreground"
                    >
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {t.workspace.emptyState.replace(
                      "{generateBtn}",
                      t.workspace.emptyStateBtn
                    ).split("{generateBtn}").map((part, i) =>
                      i === 0 ? (
                        <span key={i}>{part}</span>
                      ) : (
                        <span key={i}>
                          <span className="font-medium text-foreground">
                            {t.workspace.emptyStateBtn}
                          </span>
                          {part}
                        </span>
                      )
                    )}
                  </p>
                </div>
              )}

              {/* Loading State */}
              {isGenerating && (
                <div className="space-y-6 animate-fade-in-up">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      {t.workspace.labelTitle}
                    </div>
                    <div className="h-6 w-3/4 rounded-lg animate-shimmer" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                      {t.workspace.labelBullets}
                    </div>
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="h-4 rounded-lg animate-shimmer"
                          style={{ width: `${75 + Math.random() * 25}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                      {t.workspace.labelDescription}
                    </div>
                    <div className="space-y-3">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="h-4 rounded-lg animate-shimmer"
                          style={{ width: `${60 + Math.random() * 40}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Result */}
              {result && !isGenerating && (
                <div className="space-y-8 animate-fade-in-up">
                  {/* Title */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t.workspace.labelTitle}
                      </span>
                      <button
                        onClick={() => handleCopy(result.title, "title")}
                        className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                        title="Copy title"
                      >
                        {copiedField === "title" ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-base font-semibold text-foreground leading-relaxed">
                      {result.title}
                    </p>
                  </div>

                  {/* Bullet Points */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t.workspace.labelBullets}
                      </span>
                      <button
                        onClick={() =>
                          handleCopy(result.bulletPoints.join("\n\n"), "bullets")
                        }
                        className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                        title="Copy bullet points"
                      >
                        {copiedField === "bullets" ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <ul className="space-y-3">
                      {result.bulletPoints.map((bp, i) => (
                        <li
                          key={i}
                          className="text-sm text-foreground/90 leading-relaxed pl-1"
                        >
                          {bp}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Product Description */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t.workspace.labelDescription}
                      </span>
                      <button
                        onClick={() =>
                          handleCopy(result.productDescription, "desc")
                        }
                        className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                        title="Copy description"
                      >
                        {copiedField === "desc" ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line pl-1">
                      {result.productDescription}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
