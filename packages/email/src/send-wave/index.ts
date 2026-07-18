export type { Candidate, ArmDef, Wave, ScheduledChild, RunWaveSendOptions } from "./types";
export {
    assertNoEmDash,
    assertNoPlaceholders,
    assertScheduledFresh,
    isValidEmail,
    canonicalEmail,
} from "./guards";
export { chunkArm, interleaveWaves } from "./chunker";
export { createAgentClient, type SendWaveClient, type CreateAgentClientOptions } from "./api-client";
export { ensureAllSubscribers } from "./ensure-pool";
export {
    applyDoneMarkers,
    finalizeWaveSend,
    getDoneTagged,
    type ApplyDoneMarkersResult,
} from "./done-markers";
export { runWaveSend } from "./scheduler";
