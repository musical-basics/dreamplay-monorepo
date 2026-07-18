import type { ArmDef, Candidate, Wave } from "./types";

/** Split one arm's audience into chunks of at most `chunkSize`. */
export function chunkArm(audience: Candidate[], chunkSize: number): Candidate[][] {
    if (chunkSize <= 0) throw new Error(`chunkSize must be > 0 (got ${chunkSize})`);
    const out: Candidate[][] = [];
    for (let i = 0; i < audience.length; i += chunkSize) {
        out.push(audience.slice(i, i + chunkSize));
    }
    return out;
}

/**
 * Interleave waves across arms: L1, M1, N1, L2, M2, N2, ... so all arms start
 * receiving at roughly the same time and time-of-day effects cancel out in
 * per-arm comparisons.
 */
export function interleaveWaves(arms: ArmDef[], chunksByArm: Record<string, Candidate[][]>): Wave[] {
    const waves: Wave[] = [];
    const maxChunks = Math.max(0, ...arms.map((a) => chunksByArm[a.key]?.length ?? 0));
    for (let w = 0; w < maxChunks; w++) {
        for (const arm of arms) {
            const c = chunksByArm[arm.key]?.[w];
            if (c && c.length) waves.push({ arm, chunkIdx: w, chunk: c });
        }
    }
    return waves;
}
