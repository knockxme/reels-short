"use client";

import { inputCls } from "./fields";

/** A <select> inside a GET filter form that applies the filter as soon as it changes. */
export function AutoSubmitSelect({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue: string;
  options: [value: string, label: string][];
}) {
  return (
    <label className="block min-w-0 flex-1 sm:flex-none">
      <span className="sr-only">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        aria-label={label}
        className={`${inputCls} mt-0 sm:w-44`}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
