/**
 * @dreamplay/ab — first-class A/B experimentation (Phase 4), the belgium
 * proxy pattern generalized to a typed multi-experiment registry.
 *
 * Entry points:
 *   "."          — registry + assignment + cookie readers (this file)
 *   "./react"    — <ExperimentProvider/>, useVariant(), <Variant/>
 *   "./sync"     — syncExperimentsToDb() (server-side, admin client)
 *
 * See README.md for the "how to launch an experiment" runbook.
 */

export {
  defineExperiments,
  isVariantOf,
  experimentMatchesPath,
  activeVariants,
  abCookieName,
  type Experiment,
  type ExperimentStatus,
  type Variant,
  type PathMatcher,
  type GeoPool,
  type GeoPoolsConfig,
} from "./experiments";

export {
  resolveAssignments,
  applyAssignments,
  getRewritePath,
  assignmentsToMap,
  weightedRandomVariant,
  AB_COOKIE_MAX_AGE,
  type Assignment,
  type AssignmentCookie,
  type AssignmentSource,
  type ResolveOptions,
  type RequestLike,
  type ResponseLike,
  type CookiesLike,
  type HeadersLike,
  type ResponseCookiesLike,
} from "./assign";

export {
  readAbAssignmentsFromCookieString,
  createGetAbAssignments,
  abAssignmentsToMetadata,
  hasAssignment,
} from "./cookies";
