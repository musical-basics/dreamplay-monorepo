import { Inngest } from "inngest";

/**
 * Inngest client for the monorepo email pipeline. Event names keep the legacy
 * `agent.*` namespace so existing agent tooling carries over unchanged.
 */
export const inngest = new Inngest({ id: "dreamplay-monorepo" });
