import { ClipboardList } from "lucide-react";

/**
 * The hiring questionnaire (Google Forms), the single application step for
 * every role. Submissions land in the form's Google Sheet/inbox, not in the
 * site database — the old in-site ApplicationForm and /api/apply remain in
 * the codebase but are no longer rendered anywhere.
 *
 * The 3417px height matches the full form at the embed's 640px width so the
 * page scrolls as one surface; if Google grows the form past that, the
 * iframe scrolls internally rather than clipping.
 */
const FORM_SRC =
  "https://docs.google.com/forms/d/e/1FAIpQLSfNmsgg7LVTkcv8-XYlcfqNrojOXq7MggnpfqIZWpTm95UPQw/viewform?embedded=true";

export function ApplicationQuestionnaire() {
  return (
    <section id="apply" className="container-max scroll-mt-24 py-12">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
          <ClipboardList className="h-6 w-6" aria-hidden />
        </div>
        <h2 className="heading-section mt-4 text-balance">
          Apply here: fill out the questionnaire
        </h2>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Every application starts with this short questionnaire. No résumé
          needed to start. Answer honestly and we respond to qualified
          applicants within a few business days.
        </p>
      </div>

      <div className="mx-auto mt-8 w-full max-w-[680px] overflow-hidden rounded-2xl border border-surface-border bg-white p-2 sm:p-4">
        <iframe
          src={FORM_SRC}
          title="PVS job application questionnaire"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          className="block w-full border-0"
          style={{ height: 3417 }}
        >
          Loading…
        </iframe>
      </div>

      <p className="mx-auto mt-4 max-w-[680px] text-center text-xs text-muted-foreground">
        Form not loading?{" "}
        <a
          href={FORM_SRC.replace("?embedded=true", "")}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Open the questionnaire in a new tab
        </a>
        .
      </p>
    </section>
  );
}
