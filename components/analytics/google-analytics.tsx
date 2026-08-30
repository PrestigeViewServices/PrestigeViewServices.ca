import Script from "next/script";

/**
 * Loads GA4 only when NEXT_PUBLIC_GA_MEASUREMENT_ID is set, so dev/preview
 * environments don't pollute production property data.
 *
 * GA4 captures pageviews, referrer, and utm_* automatically, no extra
 * code needed for source/medium/campaign attribution.
 */
export function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!id) return null;

  return (
    <>
      {/* lazyOnload keeps gtag off the critical path on mobile; page views
          and utm attribution still record, just a beat later. */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="lazyOnload"
      />
      <Script id="ga4-init" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}', { send_page_view: true });
        `}
      </Script>
    </>
  );
}
