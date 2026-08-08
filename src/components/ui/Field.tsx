export const inputClass =
  "w-full rounded-lg border border-line bg-background px-3 py-1.5 text-sm text-foreground outline-none transition-colors placeholder:text-subtle hover:border-line-strong focus:border-accent";

type Props = {
  label: string;
  /** Right-aligned helper: a counter, a resolved URL, a format hint. */
  hint?: React.ReactNode;
  /** Sits under the control. Use for format examples and validation. */
  help?: React.ReactNode;
  children: React.ReactNode;
};

export default function Field({ label, hint, help, children }: Props) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-meta font-medium text-muted">{label}</span>
        {hint && <span className="text-meta text-subtle">{hint}</span>}
      </span>
      {children}
      {help && <span className="mt-1.5 block text-meta text-subtle">{help}</span>}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input className={`${inputClass} ${className}`} {...rest} />;
}
