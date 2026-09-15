"use client";

/**
 * CREATE YOUR IDENTITY — one screen, no wizard.
 * Name · date of birth · birth time (or "I don't know") · where in the world
 * you are now · avatar (initials for this phase).
 *
 * Validation is inline and quiet, against the prototype clock. An unknown
 * birth time is a valid answer, never an error, and is never stored as a
 * time. Everything stays in this browser.
 */

import { useId, useMemo, useRef, useState, type FormEvent } from "react";
import { now } from "@/lib/clock";
import { GEO_BY_ID, GLOBE_GEO_LABELS } from "@/lib/earth/globe-geo";
import { placeFromGeo } from "@/lib/identity/demo-seed";
import { isValidBirthTime, validateBirthDate } from "@/lib/identity/birth";
import type { IdentityInput, PrototypePlace } from "@/lib/identity/types";
import { Avatar } from "@/components/ui/Avatar";
import { CHIP_BASE } from "@/components/cosmos/overlays";

const FIELD =
  "min-h-11 w-full rounded-xl border border-white/15 bg-white/10 px-3 text-sm text-white outline-none placeholder:text-white/40 focus-visible:outline-[#8fc2ff] [color-scheme:dark]";
const LABEL = "text-xs font-semibold tracking-wide text-white/80";
const HINT = "text-xs leading-relaxed text-white/55";
const ERROR = "text-xs leading-relaxed text-[#ff9a92]";

/** Curated places a person can anchor on: cities as "City, Country", plus countries. */
const PLACE_OPTIONS: { label: string; geoId: string }[] = GLOBE_GEO_LABELS.filter(
  (l) => l.kind === "city" || l.kind === "country",
).map((l) => {
  const country = l.kind === "city" && l.parent ? GEO_BY_ID[l.parent] : undefined;
  return { label: country ? `${l.name}, ${country.name}` : l.name, geoId: l.id };
});

function resolvePlace(text: string): PrototypePlace | undefined {
  const label = text.trim();
  if (!label) return undefined;
  const key = label.toLowerCase();
  const hit = PLACE_OPTIONS.find(
    (o) =>
      o.label.toLowerCase() === key ||
      GEO_BY_ID[o.geoId].name.toLowerCase() === key,
  );
  return hit ? placeFromGeo(hit.geoId, hit.label) ?? { label } : { label };
}

function todayISO(): string {
  const d = now();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const DATE_MESSAGES = {
  empty: "Your date of birth anchors your Life. It's required.",
  invalid: "That isn't a real date.",
  future: "That date is in the future.",
} as const;

export function CreateIdentityForm({
  chip,
  onSubmit,
  onCancel,
}: {
  /** Cosmos chip material for the secondary action. */
  chip: string;
  onSubmit: (input: IdentityInput) => void;
  onCancel: () => void;
}) {
  const uid = useId();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [placeText, setPlaceText] = useState("");
  const [errors, setErrors] = useState<{ name?: string; birthDate?: string }>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const maxDate = useMemo(() => todayISO(), []);

  const timeKnown = !timeUnknown && isValidBirthTime(birthTime);
  const timeHint = timeUnknown
    ? "Recorded as unknown — never as midnight. Your Life Counter will count in days."
    : birthTime
      ? null
      : "No time entered — it will be recorded as unknown, not as midnight.";

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Your name is needed to enter.";
    const dateProblem = validateBirthDate(birthDate, now());
    if (dateProblem) next.birthDate = DATE_MESSAGES[dateProblem];
    setErrors(next);
    if (next.name) {
      nameRef.current?.focus();
      return;
    }
    if (next.birthDate) {
      dateRef.current?.focus();
      return;
    }
    onSubmit({
      name: name.trim(),
      birthDate: birthDate.trim(),
      birthTime: timeKnown ? birthTime : undefined,
      birthTimeKnown: timeKnown,
      currentPlace: resolvePlace(placeText),
    });
  };

  return (
    <form noValidate onSubmit={submit} className="mt-4 flex flex-col gap-4">
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${uid}-name`} className={LABEL}>
          Name
        </label>
        <input
          ref={nameRef}
          id={`${uid}-name`}
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? `${uid}-name-err` : undefined}
          className={FIELD}
          placeholder="How should SYSTEMBOOM call you?"
        />
        {errors.name && (
          <p id={`${uid}-name-err`} className={ERROR}>
            {errors.name}
          </p>
        )}
      </div>

      {/* Date of birth */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${uid}-dob`} className={LABEL}>
          Date of birth
        </label>
        <input
          ref={dateRef}
          id={`${uid}-dob`}
          type="date"
          max={maxDate}
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          aria-invalid={errors.birthDate ? true : undefined}
          aria-describedby={errors.birthDate ? `${uid}-dob-err` : `${uid}-dob-hint`}
          className={FIELD}
        />
        {errors.birthDate ? (
          <p id={`${uid}-dob-err`} className={ERROR}>
            {errors.birthDate}
          </p>
        ) : (
          <p id={`${uid}-dob-hint`} className={HINT}>
            Your Life Counter and Circle of Life grow from this date.
          </p>
        )}
      </div>

      {/* Birth time */}
      <fieldset className="flex flex-col gap-1.5">
        <legend className={LABEL}>Birth time</legend>
        <input
          id={`${uid}-time`}
          type="time"
          aria-label="Birth time"
          value={timeUnknown ? "" : birthTime}
          disabled={timeUnknown}
          onChange={(e) => setBirthTime(e.target.value)}
          aria-describedby={`${uid}-time-hint`}
          className={`${FIELD} disabled:opacity-40`}
        />
        <label className="mt-1 flex min-h-9 items-center gap-2.5 text-sm text-white/90">
          <input
            type="checkbox"
            checked={timeUnknown}
            onChange={(e) => setTimeUnknown(e.target.checked)}
            className="h-4 w-4 accent-[#d92a20]"
          />
          I don&apos;t know my birth time
        </label>
        {timeHint && (
          <p id={`${uid}-time-hint`} className={HINT}>
            {timeHint}
          </p>
        )}
      </fieldset>

      {/* Current place */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${uid}-place`} className={LABEL}>
          Where in the world are you now?
        </label>
        <input
          id={`${uid}-place`}
          type="text"
          list={`${uid}-places`}
          autoComplete="off"
          value={placeText}
          onChange={(e) => setPlaceText(e.target.value)}
          aria-describedby={`${uid}-place-hint`}
          className={FIELD}
          placeholder="Kathmandu, Nepal"
        />
        <datalist id={`${uid}-places`}>
          {PLACE_OPTIONS.map((o) => (
            <option key={o.geoId} value={o.label} />
          ))}
        </datalist>
        <p id={`${uid}-place-hint`} className={HINT}>
          City or country is enough — SYSTEMBOOM never asks your device where you are.
        </p>
      </div>

      {/* Avatar — initials for this phase; curated marks can join this group later. */}
      <fieldset className="flex flex-col gap-2">
        <legend className={LABEL}>Avatar</legend>
        <div className="flex items-center gap-3">
          <Avatar name={name.trim() || "You"} size="md" />
          <label className="flex min-h-9 items-center gap-2.5 text-sm text-white/90">
            <input
              type="radio"
              name={`${uid}-avatar`}
              value="initials"
              defaultChecked
              className="h-4 w-4 accent-[#d92a20]"
            />
            Your initials
          </label>
        </div>
        <p className={HINT}>More marks arrive with your Identity Horizon in a later phase.</p>
      </fieldset>

      <div className="mt-1 flex flex-col gap-2">
        <button
          type="submit"
          className="sb-transition inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#d92a20] px-6 font-semibold text-white hover:bg-[#f04136] focus-visible:outline-[#8fc2ff]"
        >
          Enter SYSTEMBOOM
        </button>
        <button type="button" onClick={onCancel} className={`${CHIP_BASE} ${chip} w-full`}>
          Back
        </button>
      </div>
      <p className={HINT}>Stored only in this browser. Nothing is sent anywhere.</p>
    </form>
  );
}
