"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { addDays, toISODate } from "@/lib/dates";
import { goalSentence } from "@/lib/phrases";
import type { Goal, GoalType } from "@/lib/types";
import {
  dailyPreview,
  validateGoal,
  type GoalDraft,
  type GoalField,
  type GoalValidation,
  type GoalValues,
} from "@/lib/validate";

const FIELD_ORDER: GoalField[] = ["verb", "unit", "target", "deadline", "link"];

const TYPE_OPTIONS: { value: GoalType; label: string }[] = [
  { value: "daily", label: "Every day" },
  { value: "by-date", label: "A total by a date" },
];

export const BLANK_DRAFT: GoalDraft = {
  verb: "",
  unit: "",
  type: "daily",
  target: "",
  deadline: "",
  link: "",
};

export function draftFromGoal(goal: Goal): GoalDraft {
  return {
    verb: goal.verb,
    unit: goal.unit,
    type: goal.type,
    target: String(goal.target),
    deadline: goal.deadline ?? "",
    link: goal.link ?? "",
  };
}

interface GoalSetupProps {
  initial: GoalDraft;
  /** "numbers": only how many and by when (a starter). "full": every field. */
  fields: "numbers" | "full";
  submitLabel: string;
  submitHint?: string;
  onSubmit: (values: GoalValues) => void;
  footer?: ReactNode;
  /** Under the button, apart from it (Remove goal on Edit goal); after Save in reading and tab order. */
  after?: ReactNode;
  /** On a desktop: the page heading at the top of the form column. */
  header?: ReactNode;
  /** On a desktop: Titi and a short note in the right column, above the live sentence and the button. */
  aside?: ReactNode;
}

function validNumber(text: string): number | null {
  return /^\d+$/.test(text.trim()) && Number(text) > 0 ? Number(text) : null;
}

/** The goal as a live sentence on top, with one column of labelled fields below. */
export function GoalSetup({
  initial,
  fields,
  submitLabel,
  submitHint,
  onSubmit,
  footer,
  after,
  header,
  aside,
}: GoalSetupProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [draft, setDraft] = useState<GoalDraft>(initial);
  const [errors, setErrors] = useState<GoalValidation["errors"]>({});
  const today = toISODate(new Date());
  // Typing into a field that shows an error re-checks just that field, so the error leaves as soon as it is fixed.
  const set = (field: GoalField) => (value: string) =>
    setDraft((d) => {
      const next = { ...d, [field]: value };
      if (errors[field])
        setErrors((e) => ({
          ...e,
          [field]: validateGoal(next, today).errors[field],
        }));
      return next;
    });
  const preview =
    draft.type === "by-date"
      ? dailyPreview(draft.target, draft.deadline, draft.unit, today)
      : null;
  const sentence = goalSentence({
    verb: draft.verb,
    unit: draft.unit.trim().toLowerCase() || "times",
    type: draft.type,
    target: validNumber(draft.target),
    deadline: draft.deadline || null,
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = validateGoal(draft, today);
    setErrors(result.errors); // the draft stays exactly as typed
    if (!result.value) {
      const first = FIELD_ORDER.find((field) => result.errors[field]);
      formRef.current?.querySelector<HTMLElement>(`#goal-${first}`)?.focus();
      return;
    }
    onSubmit(result.value);
  }

  const summary = (
    <div aria-live="polite" className="flex flex-col gap-2">
      <p className="font-display text-xl font-semibold leading-snug text-muted lg:text-2xl lg:text-ink">
        {sentence}
      </p>
      {preview && (
        <p
          className={`text-lg font-bold ${preview.perDay > 50 ? "text-ink" : "text-muted"}`}
        >
          {preview.message}
        </p>
      )}
    </div>
  );
  const button = (
    <Button
      type="submit"
      size="lg"
      className="w-full sm:w-auto sm:self-start lg:w-full"
    >
      {submitLabel}
    </Button>
  );

  // On a phone: the sentence on top, the fields, the button. On a desktop the fields are the left seven columns and the
  // right five hold Titi, the live sentence and the button, staying in view while the fields scroll, like the first
  // visit (user, 2026-10-19: one long form beside a small Titi was unbalanced). Only one of each copy is ever shown.
  return (
    <form
      ref={formRef}
      onSubmit={submit}
      noValidate
      className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-8"
    >
      {/* The page heading sits in the form so, on a desktop, the right column can start level with it */}
      {header && (
        <div className="mb-2 lg:col-span-7 lg:row-start-1 lg:mb-0">
          {header}
        </div>
      )}
      <div className="lg:hidden">{summary}</div>
      <div className="flex flex-col gap-6 lg:col-span-7 lg:row-start-2">
        {fields === "full" && (
          <>
            <Field
              id="goal-verb"
              label="What will you do?"
              hint='One or two words, like "Send" or "Practice"'
              error={errors.verb}
            >
              {(control) => (
                <TextInput
                  {...control}
                  value={draft.verb}
                  onChange={(e) => set("verb")(e.target.value)}
                  className="max-w-64"
                  autoComplete="off"
                />
              )}
            </Field>
            <Field
              id="goal-unit"
              label="What are you counting? (optional)"
              hint='Like "applications" or "interview questions", or blank to count times'
              error={errors.unit}
            >
              {(control) => (
                <TextInput
                  {...control}
                  value={draft.unit}
                  onChange={(e) => set("unit")(e.target.value)}
                  className="max-w-80"
                  autoComplete="off"
                />
              )}
            </Field>
            <RadioGroup
              name="goal-type"
              legend="How often?"
              options={TYPE_OPTIONS}
              value={draft.type}
              onChange={(v) => set("type")(v)}
            />
          </>
        )}

        <Field
          id="goal-target"
          label={
            draft.type === "by-date"
              ? "How many in total?"
              : "How many each day?"
          }
          error={errors.target}
        >
          {(control) => (
            <TextInput
              {...control}
              inputMode="numeric"
              value={draft.target}
              onChange={(e) => set("target")(e.target.value)}
              className="max-w-32"
              autoComplete="off"
            />
          )}
        </Field>

        {draft.type === "by-date" && (
          <Field id="goal-deadline" label="By when?" error={errors.deadline}>
            {(control) => (
              <TextInput
                {...control}
                type="date"
                min={addDays(today, 1)}
                value={draft.deadline}
                onChange={(e) => set("deadline")(e.target.value)}
                className="max-w-52"
              />
            )}
          </Field>
        )}

        {fields === "full" && (
          <Field
            id="goal-link"
            label="Page you'll work on (optional)"
            hint="Like https://www.linkedin.com/mynetwork/"
            error={errors.link}
          >
            {(control) => (
              <TextInput
                {...control}
                type="url"
                inputMode="url"
                value={draft.link}
                onChange={(e) => set("link")(e.target.value)}
                autoComplete="url"
              />
            )}
          </Field>
        )}

        <div className="flex flex-col gap-2 lg:hidden">
          {button}
          {submitHint && <p className="text-sm text-muted">{submitHint}</p>}
          {after && (
            <div className="mt-6 border-t-2 border-wash-strong pt-4">
              {after}
            </div>
          )}
        </div>
        {footer}
      </div>
      <div className="hidden lg:sticky lg:top-6 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 lg:flex lg:flex-col lg:gap-4 lg:pt-4">
        {aside}
        {summary}
        <div className="mt-2 flex flex-col gap-2">
          {button}
          {submitHint && <p className="text-sm text-muted">{submitHint}</p>}
          {after && (
            <div className="mt-4 border-t-2 border-wash-strong pt-3">
              {after}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
