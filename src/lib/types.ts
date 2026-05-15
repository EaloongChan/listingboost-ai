export interface ListingFormData {
  productName: string;
  keySellingPoints: string;
  targetAudience: string;
  tone: string;
  platform: string;
}

export interface GeneratedListing {
  title: string;
  bulletPoints: string[];
  productDescription: string;
}

export const AUDIENCE_OPTIONS = [
  { value: "amazon-shoppers", label: "Amazon Shoppers" },
  { value: "shopify-owners", label: "Shopify Store Owners" },
  { value: "wholesale-buyers", label: "Wholesale / B2B Buyers" },
  { value: "dropshippers", label: "Dropshippers" },
  { value: "etsy-buyers", label: "Etsy Handmade Buyers" },
  { value: "general-ecommerce", label: "General E-commerce Shoppers" },
];

export const TONE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual & Friendly" },
  { value: "luxury", label: "Luxury / Premium" },
  { value: "technical", label: "Technical / Spec-focused" },
  { value: "emotional", label: "Emotional / Story-driven" },
];

export const PLATFORM_OPTIONS = [
  { value: "amazon", label: "Amazon" },
  { value: "shopify", label: "Shopify" },
  { value: "etsy", label: "Etsy" },
  { value: "ebay", label: "eBay" },
  { value: "independent", label: "Independent Website" },
  { value: "alibaba", label: "Alibaba / 1688" },
];

export function generateMockListing(data: ListingFormData): GeneratedListing {
  const productName = data.productName || "Premium Wireless Earbuds";
  const sellingPoints =
    data.keySellingPoints || "Noise cancellation, long battery life, comfortable fit";
  const audience =
    AUDIENCE_OPTIONS.find((a) => a.value === data.targetAudience)?.label ||
    "Amazon Shoppers";
  const tone =
    TONE_OPTIONS.find((t) => t.value === data.tone)?.label || "Professional";

  return {
    title: `${productName} - Premium ${sellingPoints.split(",")[0]?.trim() || "Quality"} for ${audience} | Top Rated 2026`,
    bulletPoints: [
      `\u2714 ENHANCED ${sellingPoints.split(",")[0]?.trim().toUpperCase() || "PERFORMANCE"} \u2014 Engineered with cutting-edge technology to deliver an unmatched ${tone.toLowerCase()} experience that ${audience.toLowerCase()} love and trust.`,
      `\u2714 PREMIUM BUILD QUALITY \u2014 Crafted from high-grade materials with meticulous attention to detail. Each ${productName.toLowerCase()} undergoes rigorous quality testing to ensure long-lasting durability.`,
      `\u2714 SMART ${sellingPoints.split(",")[1]?.trim().toUpperCase() || "DESIGN"} \u2014 Intelligently designed to seamlessly integrate into your daily routine. Compatible with all major devices and platforms for maximum versatility.`,
      `\u2714 CUSTOMER-FIRST GUARANTEE \u2014 Backed by our 30-day money-back guarantee and 24/7 customer support. Join 10,000+ satisfied customers who have made the switch to ${productName}.`,
      `\u2714 VERSATILE COMPATIBILITY \u2014 Whether you're at home, in the office, or on the go, ${productName.toLowerCase()} adapts to your lifestyle. Perfect for work, travel, fitness, and everyday use.`,
    ],
    productDescription: `Discover the next generation of ${tone.toLowerCase()} excellence with the ${productName}. Designed specifically for discerning ${audience.toLowerCase()}, this product represents the perfect fusion of innovation, quality, and value.

KEY FEATURES THAT SET US APART:

${sellingPoints
  .split(",")
  .map(
    (point, i) =>
      `\u2022 ${point.trim()}: Our proprietary technology ensures ${point.trim().toLowerCase()} that exceeds industry standards by 300%.`
  )
  .join("\n")}

WHAT'S IN THE BOX:
\u2022 1x ${productName}
\u2022 1x Premium Carrying Case
\u2022 1x Quick Start Guide
\u2022 1x USB-C Charging Cable
\u2022 1x Warranty Card (2-Year Extended Warranty Included)

WHY CHOOSE ${productName.toUpperCase()}?
With over 10,000 five-star reviews and counting, ${productName} has become the go-to choice for ${audience.toLowerCase()} worldwide. Our commitment to quality, innovation, and customer satisfaction is unmatched in the industry.

\u2605\u2605\u2605\u2605\u2605 "Best purchase I've made this year. The quality is outstanding!" \u2014 Verified Buyer

Order now and experience the difference that premium ${tone.toLowerCase()} quality can make. Free shipping on all orders over $35.`,
  };
}
