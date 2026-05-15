export function AdPlaceholder({
  size = "300x250",
  className = "",
}: {
  size?: "300x250" | "728x90" | "responsive";
  className?: string;
}) {
  const sizeStyles = {
    "300x250": "w-[300px] h-[250px]",
    "728x90": "w-full max-w-[728px] h-[90px]",
    responsive: "w-full h-[250px] md:h-[90px]",
  };

  return (
    <div
      className={`relative flex items-center justify-center border-2 border-dashed border-border rounded-xl bg-muted/30 ${sizeStyles[size]} ${className}`}
      aria-label="Advertisement placeholder"
    >
      <div className="text-center">
        <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-widest">
          Advertisement
        </p>
        <p className="text-[10px] text-muted-foreground/40 mt-1">
          {size === "responsive" ? "Responsive" : size}
        </p>
      </div>
      {/* Replace this entire div with your Google AdSense ad code */}
    </div>
  );
}
