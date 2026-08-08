type Props = {
  className?: string;
  children: React.ReactNode;
};

export default function Panel({ className = "", children }: Props) {
  return (
    <section className={`rounded-xl border border-line bg-raised shadow-sm ${className}`}>
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div>
        <h2 className="font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-1 text-meta text-muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}
