'use client';

import { ArrowRight, Lock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import {
  CheckboxField,
  TextAreaField,
  TextField,
} from '@/components/ui/TextField';
import { cn } from '@/lib/cn';

/**
 * Step four: who the appointment is for.
 *
 * Only what is needed to hold an appointment and get in touch about it: a
 * name, a mobile number, an email, and whether the patient has been here
 * before. No identity number, no medical aid details, no medical history.
 *
 * That restraint is a POPIA requirement, not a design preference. Personal
 * information may only be collected for a stated purpose and limited to what
 * that purpose needs. Medical history is taken at the appointment, in person,
 * where it is actually relevant and can be discussed.
 */

export interface DetailsFormValues {
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  isExistingPatient: boolean;
  notes: string;
  consentToContact: boolean;
}

export const emptyDetails: DetailsFormValues = {
  firstName: '',
  lastName: '',
  mobile: '',
  email: '',
  isExistingPatient: false,
  notes: '',
  consentToContact: false,
};

export function DetailsStep({
  values,
  errors,
  onChange,
  onContinue,
}: {
  readonly values: DetailsFormValues;
  readonly errors: Readonly<Record<string, string>>;
  readonly onChange: (patch: Partial<DetailsFormValues>) => void;
  readonly onContinue: () => void;
}) {
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onContinue();
      }}
    >
      <h2 className="text-[1.0625rem] font-semibold text-ink">Your details</h2>
      <p className="mt-1 text-sm text-grey-strong">
        We ask for as little as possible here. Anything clinical is discussed at
        your appointment.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <TextField
          name="firstName"
          label="First name"
          required
          autoComplete="given-name"
          value={values.firstName}
          onChange={(e) => onChange({ firstName: e.target.value })}
          error={errors.firstName}
        />
        <TextField
          name="lastName"
          label="Surname"
          required
          autoComplete="family-name"
          value={values.lastName}
          onChange={(e) => onChange({ lastName: e.target.value })}
          error={errors.lastName}
        />
        <TextField
          name="mobile"
          label="Mobile number"
          type="tel"
          inputMode="tel"
          required
          autoComplete="tel"
          placeholder="082 123 4567"
          description="So we can reach you about this appointment."
          value={values.mobile}
          onChange={(e) => onChange({ mobile: e.target.value })}
          error={errors.mobile}
        />
        <TextField
          name="email"
          label="Email address"
          type="email"
          inputMode="email"
          required
          autoComplete="email"
          description="Your confirmation and booking reference go here."
          value={values.email}
          onChange={(e) => onChange({ email: e.target.value })}
          error={errors.email}
        />
      </div>

      <fieldset className="mt-6">
        <legend className="text-[0.8125rem] font-medium text-charcoal">
          Have you been to the practice before?
        </legend>
        <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:gap-3">
          {[
            { label: 'I am a new patient', value: false },
            { label: 'I am an existing patient', value: true },
          ].map((option) => (
            <label
              key={String(option.value)}
              className={cn(
                'flex flex-1 cursor-pointer items-center gap-3 rounded-panel border px-4 py-3 text-sm',
                'transition-[border-color,background-color] duration-[--duration-feedback] ease-out',
                'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blue',
                values.isExistingPatient === option.value
                  ? 'border-blue bg-blue-tint text-ink'
                  : 'border-line-strong bg-white text-charcoal hover:border-blue/40',
              )}
            >
              <input
                type="radio"
                name="isExistingPatient"
                checked={values.isExistingPatient === option.value}
                onChange={() => onChange({ isExistingPatient: option.value })}
                className="size-4 shrink-0 accent-blue"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6">
        <TextAreaField
          name="notes"
          label="Anything we should know"
          rows={3}
          placeholder="For example which tooth is sore, or that you would prefer a longer appointment."
          description="Optional. Helpful but not required."
          value={values.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          error={errors.notes}
        />
      </div>

      <div className="mt-6 rounded-card border border-line bg-canvas p-4">
        <CheckboxField
          name="consentToContact"
          checked={values.consentToContact}
          onChange={(checked) => onChange({ consentToContact: checked })}
          error={errors.consentToContact}
          label={
            <>
              I agree that Harbour Dental Studio may contact me about this
              appointment, and I have read the{' '}
              <Link
                href="/legal/privacy"
                target="_blank"
                className="font-medium text-blue underline decoration-blue/30 underline-offset-2 hover:decoration-blue"
              >
                privacy notice
              </Link>
              .
            </>
          }
        />
        <p className="mt-3 flex items-start gap-2 pl-[1.875rem] text-xs leading-relaxed text-grey-strong">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>
            Your details are used to manage your appointment and nothing else.
            We do not sell them and we do not add you to a marketing list
            without asking separately.
          </span>
        </p>
      </div>

      <div className="mt-7">
        <Button type="submit" size="lg">
          Continue to confirm
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </form>
  );
}
