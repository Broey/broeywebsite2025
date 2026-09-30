import type { Metadata } from "next";
import { JoinPageView } from "@/components/analytics/JoinPageView";
import { EmailSignup } from "@/components/sections/EmailSignup";
import { joinPageMetadata } from "@/content/page-metadata";
import { createPageMetadata } from "@/content/seo";

export const metadata: Metadata = createPageMetadata(joinPageMetadata);

export default function JoinPage() {
  return (
    <div className="join-page inner-page">
      <JoinPageView />
      <EmailSignup
        id="join-mailing-list"
        className="email-signup--join hero-panel"
        eyebrow="DIRECT UPDATES"
        heading="Keep up with Broey."
        headingAs="h1"
        body="New music, release updates, and the occasional story behind the records. No algorithm required."
        buttonLabel="JOIN THE LIST"
        finePrint="No fixed schedule. Just meaningful updates, with an unsubscribe link in every email."
        hiddenFields={{ source: "join-page" }}
        sourceSurface="join"
        successActions={[
          { href: "/music", label: "EXPLORE THE MUSIC →" },
        ]}
        trackLifecycleEvents
      />
    </div>
  );
}
