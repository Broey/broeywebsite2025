import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isSitePrivate, sanitizeGateNext } from "@/lib/site-visibility";

type GatePageProps = {
  searchParams?: {
    next?: string | string[];
    error?: string | string[];
  };
};

export const metadata: Metadata = {
  title: "Private Preview",
  description: "Private Broey. website preview access.",
  robots: {
    index: false,
    follow: false,
  },
};

const errorMessages: Record<string, string> = {
  invalid: "That passcode did not match. Try it again.",
  "missing-config": "Private preview is enabled, but no passcode is configured yet.",
};

const firstValue = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

export default function GatePage({ searchParams }: GatePageProps) {
  const nextPath = sanitizeGateNext(searchParams?.next);
  const error = firstValue(searchParams?.error);
  const errorMessage = error ? errorMessages[error] : undefined;

  if (!isSitePrivate()) {
    redirect(nextPath);
  }

  return (
    <section className="gate-page" aria-labelledby="gate-page-title">
      <div className="gate-panel">
        <p className="gate-kicker">Broey. private preview</p>
        <h1 id="gate-page-title" className="gate-title">
          Passcode
        </h1>
        <p className="gate-copy">
          This staging version is tucked away while the site is being reviewed.
        </p>

        <form className="gate-form" action="/api/gate" method="post">
          <input type="hidden" name="next" value={nextPath} />
          <label className="gate-label" htmlFor="site-passcode">
            Preview passcode
          </label>
          <input
            id="site-passcode"
            className="gate-input"
            name="passcode"
            type="password"
            autoComplete="current-password"
            required
          />
          <button className="gate-button" type="submit">
            Enter Preview
          </button>
          {errorMessage ? (
            <p className="gate-error" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
