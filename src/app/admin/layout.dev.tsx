import Link from "next/link";

export const metadata = { title: "Admin" };

/** Dev-only: excluded from the production build (see next.config.ts). */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-5 sm:-mx-6">
      <div className="mb-8 flex items-center justify-between rounded-lg border border-line bg-accent/5 px-4 py-3 text-sm">
        <Link href="/admin/" className="font-semibold hover:text-accent">
          ✎ Writing desk
        </Link>
        <span className="text-muted">local only · never deployed</span>
      </div>
      {children}
    </div>
  );
}
