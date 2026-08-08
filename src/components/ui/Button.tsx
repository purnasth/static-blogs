import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "destructive";
type Size = "sm" | "md";

const VARIANT: Record<Variant, string> = {
  primary: "border-transparent bg-accent text-accent-contrast hover:opacity-90",
  secondary: "border-line bg-raised text-foreground hover:border-line-strong hover:bg-inset",
  ghost: "border-transparent text-muted hover:bg-inset hover:text-foreground",
  /** Quiet entry point to a destructive action — the button that opens a dialog. */
  danger: "border-transparent text-danger hover:bg-danger-soft",
  /** The confirming button inside that dialog. Loud on purpose. */
  destructive: "border-transparent bg-danger text-white hover:opacity-90",
};

const SIZE: Record<Size, string> = {
  sm: "h-7 gap-1 px-2.5 text-meta",
  md: "h-9 gap-1.5 px-3.5 text-sm",
};

const BASE =
  "inline-flex items-center justify-center rounded-lg border font-medium transition-colors disabled:pointer-events-none disabled:opacity-40";

function classes(variant: Variant, size: Size, className = "") {
  return `${BASE} ${SIZE[size]} ${VARIANT[variant]} ${className}`;
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export default function Button({
  variant = "secondary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return <button type={type} className={classes(variant, size, className)} {...props} />;
}

type ButtonLinkProps = React.ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
};

/** Same shape as Button, for things that are genuinely navigation. */
export function ButtonLink({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: ButtonLinkProps) {
  return <Link className={classes(variant, size, className)} {...props} />;
}
