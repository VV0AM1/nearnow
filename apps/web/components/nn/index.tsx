"use client";

/**
 * NearNow web component kit — the web counterpart of apps/mobile/design.
 * Every colour comes from the theme tokens in app/globals.css.
 */
import Link from "next/link";
import { forwardRef, useEffect, useId, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, Check, Loader2, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/config";

/* ── Button ─────────────────────────────────────────────────────────────── */

type ButtonVariant = "filled" | "tinted" | "plain" | "outline" | "destructive" | "destructiveTinted";
type ButtonSize = "sm" | "md" | "lg";

const VARIANT: Record<ButtonVariant, string> = {
    filled: "bg-primary text-primary-foreground hover:brightness-110 active:brightness-95 shadow-[0_8px_20px_-8px_var(--nn-accent)]",
    tinted: "bg-primary-soft text-primary hover:bg-primary/15",
    plain: "text-primary hover:bg-primary-soft",
    outline: "border border-border bg-surface text-foreground hover:bg-surface-2",
    destructive: "bg-danger text-white hover:brightness-110 active:brightness-95 shadow-sm",
    destructiveTinted: "bg-danger-soft text-danger hover:bg-danger/15",
};
const SIZE: Record<ButtonSize, string> = {
    sm: "h-9 px-4 text-[13px] gap-1.5 rounded-full",
    md: "h-11 px-5 text-[15px] gap-2 rounded-full",
    lg: "h-13 px-7 text-base gap-2 rounded-full",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: LucideIcon;
    loading?: boolean;
    block?: boolean;
    href?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    { variant = "filled", size = "md", icon: IconC, loading, block, href, className, children, disabled, type = "button", ...rest },
    ref,
) {
    const classes = cn(
        "inline-flex select-none items-center justify-center font-semibold whitespace-nowrap transition-[filter,background-color,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45",
        VARIANT[variant],
        SIZE[size],
        block && "w-full",
        className,
    );
    const content = (
        <>
            {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : IconC ? <IconC className={size === "sm" ? "size-4" : "size-[18px]"} aria-hidden /> : null}
            {children}
        </>
    );
    if (href) {
        return (
            <Link href={href} className={classes}>
                {content}
            </Link>
        );
    }
    return (
        <button ref={ref} type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
            {content}
        </button>
    );
});

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon: LucideIcon;
    label: string;
    variant?: "plain" | "filled" | "material";
    selected?: boolean;
    badge?: number;
    size?: "sm" | "md";
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
    { icon: IconC, label, variant = "plain", selected, badge, size = "md", className, ...rest },
    ref,
) {
    return (
        <button
            ref={ref}
            type="button"
            aria-label={badge ? `${label}, ${badge}` : label}
            aria-pressed={selected}
            title={label}
            className={cn(
                "relative inline-flex shrink-0 items-center justify-center rounded-full transition-colors active:scale-95",
                size === "sm" ? "size-9" : "size-10",
                variant === "plain" && "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                variant === "filled" && "bg-surface-2 text-foreground hover:brightness-95",
                variant === "material" && "material border border-border text-foreground shadow-[var(--shadow-float)]",
                selected && "text-primary",
                className,
            )}
            {...rest}
        >
            <IconC className={size === "sm" ? "size-[18px]" : "size-5"} aria-hidden />
            {badge ? (
                <span aria-hidden className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[11px] font-bold text-white ring-2 ring-surface">
                    {badge > 99 ? "99+" : badge}
                </span>
            ) : null}
        </button>
    );
});

/* ── Surfaces ───────────────────────────────────────────────────────────── */

export function Card({ children, className, padded = true, as: As = "div" }: { children: ReactNode; className?: string; padded?: boolean; as?: "div" | "section" | "article" }) {
    return <As className={cn("rounded-[22px] bg-surface shadow-[var(--shadow-card)] ring-1 ring-border/60", padded && "p-5", className)}>{children}</As>;
}

export function PageHeader({ title, subtitle, actions, className }: { title: string; subtitle?: ReactNode; actions?: ReactNode; className?: string }) {
    return (
        <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
            <div className="min-w-0">
                <h1 className="display text-[34px] leading-[1.02] sm:text-[44px]">{title}</h1>
                {subtitle ? <p className="mt-1 text-[15px] text-muted-foreground">{subtitle}</p> : null}
            </div>
            {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
    );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
    return (
        <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">{children}</h2>
            {action}
        </div>
    );
}

/* ── Badges, chips, banners ─────────────────────────────────────────────── */

export type Tone = "neutral" | "accent" | "success" | "warning" | "danger";
const TONE: Record<Tone, string> = {
    neutral: "bg-surface-2 text-muted-foreground",
    accent: "bg-primary-soft text-primary",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
};

/** Small status pill. A custom `color` tints only the icon; text stays the label colour for contrast. */
export function Badge({ label, tone = "neutral", icon: IconC, color, className }: { label: string; tone?: Tone; icon?: LucideIcon; color?: string; className?: string }) {
    return (
        <span
            className={cn("inline-flex h-6 max-w-full items-center gap-1 rounded-full px-2.5 text-xs font-semibold", color ? "text-foreground" : TONE[tone], className)}
            style={color ? { backgroundColor: `${color}1f` } : undefined}
        >
            {IconC ? <IconC className="size-3.5 shrink-0" style={color ? { color } : undefined} aria-hidden /> : null}
            <span className="truncate">{label}</span>
        </span>
    );
}

export function Chip({ label, selected, onClick, icon: IconC, color }: { label: string; selected: boolean; onClick: () => void; icon?: LucideIcon; color?: string }) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={onClick}
            className={cn(
                "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-colors active:scale-[0.97]",
                selected ? "bg-primary text-primary-foreground" : "border border-border bg-surface text-foreground hover:bg-surface-2",
            )}
        >
            {selected ? <Check className="size-3.5" aria-hidden /> : IconC ? <IconC className="size-3.5" style={{ color: color ?? "var(--nn-accent)" }} aria-hidden /> : null}
            {label}
        </button>
    );
}

export function Banner({ message, tone = "neutral", icon: IconC = AlertCircle, action }: { message: ReactNode; tone?: Tone; icon?: LucideIcon; action?: ReactNode }) {
    const fg = { neutral: "text-muted-foreground", accent: "text-primary", success: "text-success", warning: "text-warning", danger: "text-danger" }[tone];
    return (
        <div role="status" className="flex items-center gap-3 rounded-[14px] bg-surface px-4 py-3 shadow-[var(--shadow-card)]">
            <IconC className={cn("size-5 shrink-0", fg)} aria-hidden />
            <div className="min-w-0 flex-1 text-sm">{message}</div>
            {action}
        </div>
    );
}

/* ── Segmented control ──────────────────────────────────────────────────── */

export function Segmented<T extends string>({ options, value, onChange, label, className }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string; className?: string }) {
    return (
        <div role="radiogroup" aria-label={label} className={cn("inline-flex rounded-[12px] bg-surface-2 p-1", className)}>
            {options.map((o) => (
                <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={value === o.value}
                    onClick={() => onChange(o.value)}
                    className={cn(
                        "h-8 flex-1 whitespace-nowrap rounded-[9px] px-3 text-[13px] font-semibold transition-all",
                        value === o.value ? "bg-surface text-foreground shadow-[var(--shadow-card)]" : "text-muted-foreground hover:text-foreground",
                    )}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

/* ── Form fields ────────────────────────────────────────────────────────── */

interface FieldBase {
    label: string;
    hint?: string;
    error?: string | null;
    max?: number;
}

function FieldFrame({ id, label, hint, error, max, length, children, right }: FieldBase & { id: string; length: number; children: ReactNode; right?: ReactNode }) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
                <label htmlFor={id} className="text-[13px] font-semibold">
                    {label}
                </label>
                {max ? (
                    <span aria-hidden className={cn("text-xs tabular-nums", length > max * 0.9 ? "text-warning" : "text-subtle")}>
                        {length}/{max}
                    </span>
                ) : null}
            </div>
            <div className="relative">
                {children}
                {right ? <div className="absolute inset-y-0 right-1 flex items-center">{right}</div> : null}
            </div>
            {error ? (
                <p id={`${id}-error`} role="alert" className="flex items-center gap-1.5 text-[13px] text-danger">
                    <AlertCircle className="size-3.5" aria-hidden />
                    {error}
                </p>
            ) : hint ? (
                <p id={`${id}-hint`} className="text-[13px] text-muted-foreground">
                    {hint}
                </p>
            ) : null}
        </div>
    );
}

const fieldClass = (error?: string | null) =>
    cn(
        "w-full rounded-xl border bg-surface px-3.5 text-[15px] text-foreground placeholder:text-subtle transition-colors focus:outline-none focus:ring-4",
        error ? "border-danger focus:ring-danger/15" : "border-border focus:border-primary focus:ring-primary/15",
    );

export const TextField = forwardRef<HTMLInputElement, FieldBase & InputHTMLAttributes<HTMLInputElement> & { right?: ReactNode }>(function TextField(
    { label, hint, error, max, right, className, id: idProp, value, ...rest },
    ref,
) {
    const auto = useId();
    const id = idProp ?? auto;
    return (
        <FieldFrame id={id} label={label} hint={hint} error={error} max={max} length={String(value ?? "").length} right={right}>
            <input
                ref={ref}
                id={id}
                value={value}
                maxLength={max}
                aria-invalid={!!error || undefined}
                aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
                className={cn(fieldClass(error), "h-12", right && "pr-12", className)}
                {...rest}
            />
        </FieldFrame>
    );
});

export const TextArea = forwardRef<HTMLTextAreaElement, FieldBase & TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextArea(
    { label, hint, error, max, className, id: idProp, value, ...rest },
    ref,
) {
    const auto = useId();
    const id = idProp ?? auto;
    return (
        <FieldFrame id={id} label={label} hint={hint} error={error} max={max} length={String(value ?? "").length}>
            <textarea
                ref={ref}
                id={id}
                value={value}
                maxLength={max}
                aria-invalid={!!error || undefined}
                className={cn(fieldClass(error), "min-h-[120px] resize-y py-3 leading-relaxed", className)}
                {...rest}
            />
        </FieldFrame>
    );
});

/* ── Avatar, skeleton, states ───────────────────────────────────────────── */

export function avatarUrl(path?: string | null): string | null {
    if (!path) return null;
    if (/^https?:\/\//.test(path)) return path;
    return path.startsWith("/uploads/") ? `${API_URL}${path}` : null;
}

export function Avatar({ src, name, size = 40, className }: { src?: string | null; name?: string | null; size?: number; className?: string }) {
    const url = avatarUrl(src);
    const initial = (name ?? "?").trim().slice(0, 1).toUpperCase() || "?";
    return (
        <span
            className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft font-semibold text-primary", className)}
            style={{ width: size, height: size, fontSize: size * 0.42 }}
        >
            {url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" className="size-full object-cover" />
            ) : (
                <span aria-hidden>{initial}</span>
            )}
        </span>
    );
}

export function Skeleton({ className }: { className?: string }) {
    return <div aria-hidden className={cn("animate-pulse rounded-lg bg-surface-2 motion-reduce:animate-none", className)} />;
}

export function EmptyState({ icon: IconC, title, body, action, tone = "accent" }: { icon: LucideIcon; title: string; body?: ReactNode; action?: ReactNode; tone?: "accent" | "warning" }) {
    return (
        <div className="flex flex-col items-center px-6 py-14 text-center">
            <span className={cn("mb-4 flex size-16 items-center justify-center rounded-full", tone === "warning" ? "bg-warning-soft text-warning" : "bg-primary-soft text-primary")}>
                <IconC className="size-7" aria-hidden />
            </span>
            <h3 className="text-[17px] font-semibold">{title}</h3>
            {body ? <p className="mt-1 max-w-sm text-[15px] text-muted-foreground">{body}</p> : null}
            {action ? <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div> : null}
        </div>
    );
}

/* ── Settings-style grouped list ────────────────────────────────────────── */

export function ListGroup({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn("divide-y divide-border overflow-hidden rounded-[16px] bg-surface shadow-[var(--shadow-card)]", className)}>{children}</div>;
}

export function ListRow({
    title,
    subtitle,
    icon: IconC,
    iconColor,
    value,
    href,
    onClick,
    right,
    destructive,
}: {
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    iconColor?: string;
    value?: ReactNode;
    href?: string;
    onClick?: () => void;
    right?: ReactNode;
    destructive?: boolean;
}) {
    const inner = (
        <>
            {IconC ? (
                <span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] text-white" style={{ backgroundColor: iconColor ?? (destructive ? "var(--nn-danger)" : "var(--nn-accent)") }}>
                    <IconC className="size-[17px]" aria-hidden />
                </span>
            ) : null}
            <span className="min-w-0 flex-1">
                <span className={cn("block text-[15px]", destructive ? "text-danger" : "text-foreground")}>{title}</span>
                {subtitle ? <span className="mt-0.5 block text-[13px] text-muted-foreground">{subtitle}</span> : null}
            </span>
            {value ? <span className="text-[15px] text-muted-foreground">{value}</span> : null}
            {right}
        </>
    );
    const cls = "flex min-h-[52px] w-full items-center gap-3 px-4 py-2.5 text-left transition-colors";
    if (href)
        return (
            <Link href={href} className={cn(cls, "hover:bg-surface-2")}>
                {inner}
            </Link>
        );
    if (onClick)
        return (
            <button type="button" onClick={onClick} className={cn(cls, "hover:bg-surface-2")}>
                {inner}
            </button>
        );
    return <div className={cls}>{inner}</div>;
}

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cn("relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors disabled:opacity-45", checked ? "bg-success" : "bg-surface-2 ring-1 ring-inset ring-border")}
        >
            <span aria-hidden className={cn("absolute left-0 top-[2px] size-[27px] rounded-full bg-white shadow transition-transform", checked ? "translate-x-[22px]" : "translate-x-[2px]")} />
        </button>
    );
}

/* ── Dialog: centred on desktop, bottom sheet on phones ─────────────────── */

export function Dialog({ open, onClose, title, children, footer, size = "md", dismissible = true }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; size?: "sm" | "md" | "lg"; dismissible?: boolean }) {
    const panel = useRef<HTMLDivElement>(null);
    const titleId = useId();

    useEffect(() => {
        if (!open) return;
        const previous = document.activeElement as HTMLElement | null;
        const overflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        panel.current?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && dismissible) onClose();
            if (e.key !== "Tab" || !panel.current) return;
            const focusables = panel.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])');
            if (!focusables.length) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = overflow;
            previous?.focus?.();
        };
    }, [open, onClose, dismissible]);

    if (!open || typeof document === "undefined") return null;
    return createPortal(
        <div className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center sm:p-6">
            <div className="absolute inset-0 bg-[var(--nn-scrim)] animate-in" onClick={dismissible ? onClose : undefined} aria-hidden />
            <div
                ref={panel}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className={cn(
                    "relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[24px] bg-elevated shadow-[var(--shadow-float)] outline-none animate-in sm:rounded-[24px]",
                    size === "sm" && "sm:max-w-sm",
                    size === "md" && "sm:max-w-lg",
                    size === "lg" && "sm:max-w-2xl",
                )}
            >
                <div className="mx-auto mt-2 h-1.5 w-9 rounded-full bg-border sm:hidden" aria-hidden />
                <div className="flex items-center justify-between gap-3 px-6 pb-2 pt-4 sm:pt-5">
                    <h2 id={titleId} className="text-[19px] font-bold">
                        {title}
                    </h2>
                    {dismissible ? <IconButton icon={X} label="Close" variant="filled" size="sm" onClick={onClose} /> : null}
                </div>
                <div className="custom-scrollbar flex-1 overflow-y-auto px-6 pb-6 pt-2">{children}</div>
                {footer ? <div className="border-t border-border px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div> : null}
            </div>
        </div>,
        document.body,
    );
}
