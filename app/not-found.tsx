import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SamImage } from "@/components/sam";

export default function NotFound() {
  return (
    <section className="container-max py-24 sm:py-28 text-center">
      <SamImage
        pose="hero"
        size={220}
        priority
        className="mx-auto w-44 sm:w-56 drop-shadow-xl"
      />
      <p className="eyebrow text-primary justify-center mt-6 mb-3">404</p>
      <h1 className="heading-section">Well, this page is gone.</h1>
      <p className="mt-4 text-muted-foreground max-w-md mx-auto leading-relaxed">
        Sam checked behind the hedge, under the tarp, and in the truck. It&apos;s
        not there. Head back home, or grab a free quote while you&apos;re here.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild size="lg">
          <Link href="/quote">Get a Free Quote</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
        <Link href="/services" className="hover:text-foreground">
          All services
        </Link>
        <Link href="/seasonal-planner" className="hover:text-foreground">
          Seasonal planner
        </Link>
        <Link href="/guides" className="hover:text-foreground">
          Tips &amp; guides
        </Link>
        <Link href="/faq" className="hover:text-foreground">
          FAQ
        </Link>
      </div>
    </section>
  );
}
