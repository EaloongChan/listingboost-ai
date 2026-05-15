import type { Metadata } from "next";
import { PageLayout } from "@/components/PageLayout";

export const metadata: Metadata = {
  title: "Privacy Policy — ListingBoost AI",
  description:
    "Learn how ListingBoost AI collects, uses, and protects your personal information. Our privacy policy covers data collection, cookies, and user rights.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <PageLayout>
      <section className="pt-28 pb-16 sm:pt-32 sm:pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Privacy Policy
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Last updated: May 15, 2026
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-sm sm:prose max-w-none text-muted-foreground [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-4 [&_p]:leading-relaxed [&_ul]:space-y-2 [&_li]:leading-relaxed">
            <h2>1. Introduction</h2>
            <p>
              Welcome to ListingBoost AI (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your
              privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your
              information when you visit our website at{" "}
              <a
                href="https://ealoongchan.top"
                className="text-primary hover:underline"
              >
                ealoongchan.top
              </a>{" "}
              (the &quot;Site&quot;) and use our AI-powered product listing generation service (the &quot;Service&quot;).
            </p>
            <p>
              By using our Service, you agree to the collection and use of information in accordance
              with this policy. If you do not agree with the terms of this privacy policy, please do
              not access the Site.
            </p>

            <h2>2. Information We Collect</h2>

            <h3 className="text-foreground text-base font-medium mt-6 mb-2">
              2.1 Information You Provide
            </h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-foreground">Product Information:</strong> Product names,
                selling points, target audience details, and platform preferences that you input to
                generate listings.
              </li>
              <li>
                <strong className="text-foreground">Contact Information:</strong> If you contact us,
                we may collect your name, email address, and message content.
              </li>
              <li>
                <strong className="text-foreground">Usage Preferences:</strong> Language preference,
                theme settings, and interface preferences stored locally in your browser.
              </li>
            </ul>

            <h3 className="text-foreground text-base font-medium mt-6 mb-2">
              2.2 Information Collected Automatically
            </h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-foreground">Usage Data:</strong> We collect information about
                how you use our Service, including pages visited, time spent on pages, features used,
                and error reports.
              </li>
              <li>
                <strong className="text-foreground">Device Information:</strong> Browser type,
                operating system, device type, screen resolution, and language settings.
              </li>
              <li>
                <strong className="text-foreground">Log Data:</strong> IP address, access times,
                referring URLs, and standard web server log information.
              </li>
            </ul>

            <h3 className="text-foreground text-base font-medium mt-6 mb-2">
              2.3 Cookies and Tracking Technologies
            </h3>
            <p>We use cookies and similar tracking technologies to track activity on our Service:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-foreground">Essential Cookies:</strong> Required for the
                Service to function properly, including session management and security features.
              </li>
              <li>
                <strong className="text-foreground">Analytics Cookies:</strong> Help us understand how
                visitors interact with our Service (e.g., Google Analytics).
              </li>
              <li>
                <strong className="text-foreground">Advertising Cookies:</strong> Used by our
                advertising partners (e.g., Google AdSense) to display relevant advertisements.
              </li>
            </ul>
            <p>
              You can instruct your browser to refuse all cookies or to indicate when a cookie is
              being sent. However, if you do not accept cookies, you may not be able to use some
              features of our Service.
            </p>

            <h2>3. How We Use Your Information</h2>
            <p>We use the collected information for the following purposes:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To provide and maintain our AI-powered listing generation Service</li>
              <li>To improve, personalize, and expand our Service</li>
              <li>To understand and analyze how you use our Service</li>
              <li>To develop new products, services, features, and functionality</li>
              <li>To communicate with you for customer service and support</li>
              <li>To detect, prevent, and address technical issues and abuse</li>
              <li>To display advertisements relevant to your interests</li>
            </ul>

            <h2>4. Third-Party Services</h2>
            <p>We use the following third-party services that may collect information about you:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-foreground">ZhipuAI:</strong> We use ZhipuAI&apos;s API to
                generate product listing content. Product information you input is sent to ZhipuAI&apos;s
                servers for processing. ZhipuAI&apos;s privacy policy is available at{" "}
                <a
                  href="https://www.bigmodel.cn/agreement"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  bigmodel.cn/agreement
                </a>
                .
              </li>
              <li>
                <strong className="text-foreground">Google AdSense:</strong> We use Google AdSense to
                display advertisements. Google may use cookies and web beacons to serve ads based on
                your prior visits to our Site. You can opt out of personalized advertising by
                visiting{" "}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google Ads Settings
                </a>
                .
              </li>
              <li>
                <strong className="text-foreground">Vercel:</strong> Our Service is hosted on Vercel.
                Vercel may collect server logs and performance data. See{" "}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Vercel&apos;s Privacy Policy
                </a>
                .
              </li>
            </ul>

            <h2>5. Data Retention</h2>
            <p>
              We retain your personal data only for as long as necessary to fulfill the purposes
              described in this Privacy Policy. Product listing input data is processed in real-time
              and is not permanently stored on our servers. Generated listings are displayed in your
              browser session and are not saved to our database unless you explicitly save them.
            </p>

            <h2>6. Data Security</h2>
            <p>
              We implement appropriate technical and organizational security measures to protect your
              personal information. However, no method of transmission over the Internet or electronic
              storage is 100% secure. While we strive to protect your personal information, we cannot
              guarantee its absolute security.
            </p>

            <h2>7. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the following rights:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>The right to access your personal data</li>
              <li>The right to correct inaccurate personal data</li>
              <li>The right to request deletion of your personal data</li>
              <li>The right to restrict processing of your personal data</li>
              <li>The right to data portability</li>
              <li>The right to object to processing of your personal data</li>
            </ul>
            <p>
              To exercise any of these rights, please contact us at{" "}
              <a
                href="mailto:support@listingboost.ai"
                className="text-primary hover:underline"
              >
                support@listingboost.ai
              </a>
              .
            </p>

            <h2>8. Children&apos;s Privacy</h2>
            <p>
              Our Service is not intended for individuals under the age of 16. We do not knowingly
              collect personal information from children. If you are a parent or guardian and you
              become aware that your child has provided us with personal data, please contact us.
            </p>

            <h2>9. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes
              by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date at
              the top of this Privacy Policy. We encourage you to review this Privacy Policy
              periodically.
            </p>

            <h2>10. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-foreground">Email:</strong>{" "}
                <a
                  href="mailto:support@listingboost.ai"
                  className="text-primary hover:underline"
                >
                  support@listingboost.ai
                </a>
              </li>
              <li>
                <strong className="text-foreground">Website:</strong>{" "}
                <a
                  href="https://ealoongchan.top"
                  className="text-primary hover:underline"
                >
                  ealoongchan.top
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
