import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="container-max py-32 text-center">
      <p className="eyebrow text-primary justify-center mb-3">404</p>
      <h1 className="heading-section">Page not found</h1>
      <p className="mt-4 text-muted-foreground max-w-md mx-auto">
        That page took an unexpected route. Head back home, or jump straight to
        a quote.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild size="lg">
          <Link href="/quote">Get a Quote</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </section>
  );
}
