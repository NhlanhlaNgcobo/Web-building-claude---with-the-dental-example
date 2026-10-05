'use client';

import { Field } from '@base-ui/react/field';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Form fields built on Base UI's Field, which wires the label, description and
 * error to the control with the right ids and aria attributes. Doing that by
 * hand is where accessible forms usually go wrong, so it is not done by hand.
 *
 * Every field has a real, visible label. Placeholder text is only ever a
 * supplement, never the label, because it disappears the moment someone types.
 */

const controlClasses =
  'h-12 w-full rounded-panel border bg-white px-3.5 text-[0.9375rem] text-ink ' +
  'placeholder:text-grey-light ' +
  'transition-[border-color,box-shadow] duration-[--duration-feedback] ease-out ' +
  'focus:outline-none focus:border-blue focus:shadow-[0_0_0_3px_rgb(20_92_255/0.12)] ' +
  'disabled:bg-canvas disabled:text-grey ' +
  'data-[invalid]:border-[--color-critical] ' +
  'data-[invalid]:focus:shadow-[0_0_0_3px_rgb(180_35_24/0.12)]';

interface FieldShellProps {
  readonly label: string;
  readonly description?: string;
  readonly error?: string;
  readonly required?: boolean;
  readonly className?: string;
  readonly children: React.ReactNode;
  readonly name: string;
}

function FieldShell({
  label,
  description,
  error,
  required,
  className,
  children,
  name,
}: FieldShellProps) {
  return (
    <Field.Root
      name={name}
      invalid={Boolean(error)}
      className={cn('flex flex-col gap-1.5', className)}
    >
      <Field.Label className="text-[0.8125rem] font-medium text-charcoal">
        {label}
        {required ? (
          <span className="ml-1 text-grey-strong" aria-hidden="true">
            (required)
          </span>
        ) : (
          <span className="ml-1 text-grey-strong">(optional)</span>
        )}
      </Field.Label>

      {children}

      {description && !error && (
        <Field.Description className="text-xs text-grey-strong">
          {description}
        </Field.Description>
      )}

      {/* match={true} hands visibility to our own validation rather than the
          browser's ValidityState, since the server is the authority. */}
      {error && (
        <Field.Error
          match
          className="flex items-start gap-1.5 text-xs font-medium text-[--color-critical]"
        >
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </Field.Error>
      )}
    </Field.Root>
  );
}

type TextFieldProps = Omit<FieldShellProps, 'children'> & {
  readonly type?: 'text' | 'email' | 'tel';
  readonly placeholder?: string;
  readonly autoComplete?: string;
  readonly inputMode?: 'text' | 'email' | 'tel';
  readonly defaultValue?: string;
  readonly value?: string;
  readonly onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  readonly maxLength?: number;
};

export function TextField({
  type = 'text',
  placeholder,
  autoComplete,
  inputMode,
  defaultValue,
  value,
  onChange,
  maxLength,
  ...shell
}: TextFieldProps) {
  return (
    <FieldShell {...shell}>
      <Field.Control
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        required={shell.required}
        className={controlClasses}
      />
    </FieldShell>
  );
}

type TextAreaFieldProps = Omit<FieldShellProps, 'children'> & {
  readonly placeholder?: string;
  readonly rows?: number;
  readonly defaultValue?: string;
  readonly value?: string;
  readonly onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  readonly maxLength?: number;
};

export function TextAreaField({
  placeholder,
  rows = 4,
  defaultValue,
  value,
  onChange,
  maxLength,
  ...shell
}: TextAreaFieldProps) {
  return (
    <FieldShell {...shell}>
      <Field.Control
        // Textarea-only attributes belong on the rendered element rather than
        // on Field.Control, whose prop type is the shared control surface.
        render={<textarea rows={rows} />}
        placeholder={placeholder}
        defaultValue={defaultValue}
        value={value}
        // Field.Control types its handlers against an input element even when
        // rendering a textarea, so the cast reconciles the render prop with
        // the element actually in the DOM. The runtime event is a genuine
        // textarea change event.
        onChange={
          onChange as unknown as React.ChangeEventHandler<HTMLInputElement>
        }
        maxLength={maxLength}
        required={shell.required}
        className={cn(controlClasses, 'h-auto resize-y py-3 leading-relaxed')}
      />
    </FieldShell>
  );
}

/**
 * A checkbox with its label, used for consent. Built on a native input because
 * a native checkbox already has the keyboard behaviour and the correct
 * semantics, and there is nothing here that needs more.
 */
interface CheckboxFieldProps {
  readonly name: string;
  readonly label: React.ReactNode;
  readonly error?: string;
  readonly checked?: boolean;
  readonly onChange?: (checked: boolean) => void;
  readonly className?: string;
}

export function CheckboxField({
  name,
  label,
  error,
  checked,
  onChange,
  className,
}: CheckboxFieldProps) {
  const errorId = `${name}-error`;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-charcoal">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={(event) => onChange?.(event.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'mt-0.5 size-[1.125rem] shrink-0 cursor-pointer rounded-[3px]',
            'border border-line-strong text-blue accent-blue',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue',
            error && 'border-[--color-critical]',
          )}
        />
        <span>{label}</span>
      </label>
      {error && (
        <p
          id={errorId}
          className="flex items-start gap-1.5 pl-[1.875rem] text-xs font-medium text-[--color-critical]"
        >
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
