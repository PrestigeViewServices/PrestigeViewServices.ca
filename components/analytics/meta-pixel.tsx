import Script from "next/script";

/**
 * Meta (Facebook) Pixel.
 *
 * Pixel ID is baked in by default because it identifies our ad account and
 * isn't sensitive, every site using a pixel exposes it in page source. Set
 * NEXT_PUBLIC_META_PIXEL_ID in .env.local / Vercel env to override (e.g.
 * a separate dev pixel), or to "" to disable entirely.
 *
 * Renders nothing when the pixel ID is the empty string.
 */
const DEFAULT_PIXEL_ID = "765697703231945";

export function MetaPixel() {
  const raw = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const id = raw === undefined ? DEFAULT_PIXEL_ID : raw;
  if (!id) return null;

  return (
    <>
      <Script id="meta-pixel-init" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${id}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
