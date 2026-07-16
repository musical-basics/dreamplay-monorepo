"use client";

/**
 * React bindings for component-level variants (the belgium
 * VariantProvider/useVariant pattern, generalized to many experiments).
 *
 * The server resolves assignments (middleware via resolveAssignments, or a
 * server component reading the ab_* cookies) and passes the plain
 * `{ experiment: variant }` map down:
 *
 * ```tsx
 * // layout.tsx (server component)
 * const assignments = readAbAssignmentsFromCookieString(
 *   (await cookies()).toString(), experiments);
 * <ExperimentProvider assignments={assignments}>{children}</ExperimentProvider>
 *
 * // any client component
 * const variant = useVariant("hero_2026");           // "b" | undefined
 * <Variant experiment="hero_2026" match="b">…</Variant>
 * ```
 */

import { createContext, useContext, type ReactNode } from "react";

export type AssignmentMap = Record<string, string>;

const ExperimentContext = createContext<AssignmentMap | null>(null);

export function ExperimentProvider({
  assignments,
  children,
}: {
  assignments: AssignmentMap;
  children: ReactNode;
}) {
  return <ExperimentContext.Provider value={assignments}>{children}</ExperimentContext.Provider>;
}

/**
 * The visitor's variant for an experiment, or undefined when unassigned
 * (experiment not matching this path, cookie missing, or provider absent —
 * callers must render a sane default for undefined).
 */
export function useVariant(experimentKey: string): string | undefined {
  const assignments = useContext(ExperimentContext);
  return assignments?.[experimentKey];
}

/**
 * Conditional renderer: children mount only when the visitor's variant for
 * `experiment` is (one of) `match`. `fallback` renders otherwise — handy for
 * control/unassigned content without a second <Variant> block.
 */
export function Variant({
  experiment,
  match,
  children,
  fallback = null,
}: {
  experiment: string;
  match: string | readonly string[];
  children?: ReactNode;
  fallback?: ReactNode;
}) {
  const variant = useVariant(experiment);
  const matches =
    variant !== undefined &&
    (typeof match === "string" ? variant === match : match.includes(variant));
  return <>{matches ? children : fallback}</>;
}
