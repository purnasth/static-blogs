import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Not found</h1>
      <p className="mt-2 text-muted">That page doesn’t exist.</p>
      <Link href="/" className="mt-6 inline-block text-accent hover:underline">
        ← Back to posts
      </Link>
    </div>
  );
}
