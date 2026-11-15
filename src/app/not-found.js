import Link from "next/link";
export default function NotFound() {
  return (
    <section className="wrap flex min-h-[70svh] flex-col items-start justify-center gap-5 pt-24">
      <p className="eyebrow">404</p>
      <h1 className="h-section">This page doesn't exist</h1>
      <Link href="/" className="btn btn-fire">Back to the live overview</Link>
    </section>
  );
}
