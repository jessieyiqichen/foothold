import type { ComponentProps, ReactNode } from "react";

interface ControlProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  /** Receives the id and aria attributes to spread onto the input. */
  children: (control: ControlProps) => ReactNode;
}

/** A label, an optional hint, the control, and an error that says what to do next. */
export function Field({ id, label, hint, error, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-mono text-xs text-ink">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {error && (
        <p id={errorId} className="flex items-start gap-1.5 text-sm font-medium text-danger">
          <span aria-hidden="true" className="mt-px inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-danger text-[11px] text-on-primary">
            !
          </span>
          {error}
        </p>
      )}
    </div>
  );
}

/** A field (Tape & Tile): the sheet's colour inside a 2px ink edge, square, straight and flat: never a key's shadow,
 *  never tilted. */
export const inputClass =
  "min-h-11 w-full border-2 border-field bg-surface px-3 text-[15px] text-ink " +
  "placeholder:text-muted focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus " +
  "aria-invalid:border-danger";

export function TextInput({ className = "", ...props }: ComponentProps<"input">) {
  return <input className={`${inputClass} ${className}`} {...props} />;
}

/** For long text (a resume): the same box, with room above and below and a reading line height. */
const textAreaClass = `${inputClass} py-2 leading-relaxed`;

export function TextArea({ className = "", ...props }: ComponentProps<"textarea">) {
  return <textarea className={`${textAreaClass} ${className}`} {...props} />;
}

export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return <select className={`${inputClass} ${className}`} {...props} />;
}
