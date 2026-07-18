import { describe, expect, it } from "vitest";
import { HttpStatusError, withRetry } from "../retry";

const noSleep = async () => {};

describe("withRetry", () => {
    it("retries on 500 and succeeds", async () => {
        let calls = 0;
        const result = await withRetry(
            async () => {
                calls++;
                if (calls < 3) throw new HttpStatusError(500, "boom");
                return "ok";
            },
            { sleep: noSleep, baseDelayMs: 1 }
        );
        expect(result).toBe("ok");
        expect(calls).toBe(3);
    });

    it("retries on 429", async () => {
        let calls = 0;
        await withRetry(
            async () => {
                calls++;
                if (calls === 1) throw new HttpStatusError(429, "rate limited");
                return "ok";
            },
            { sleep: noSleep, baseDelayMs: 1 }
        );
        expect(calls).toBe(2);
    });

    it("does NOT retry on 400", async () => {
        let calls = 0;
        await expect(
            withRetry(
                async () => {
                    calls++;
                    throw new HttpStatusError(400, "bad request");
                },
                { sleep: noSleep, baseDelayMs: 1 }
            )
        ).rejects.toThrow("bad request");
        expect(calls).toBe(1);
    });

    it("gives up after maxAttempts", async () => {
        let calls = 0;
        await expect(
            withRetry(
                async () => {
                    calls++;
                    throw new HttpStatusError(503, "down");
                },
                { sleep: noSleep, baseDelayMs: 1, maxAttempts: 5 }
            )
        ).rejects.toThrow("down");
        expect(calls).toBe(5);
    });

    it("retries network-style errors", async () => {
        let calls = 0;
        const result = await withRetry(
            async () => {
                calls++;
                if (calls === 1) throw new TypeError("fetch failed");
                return "ok";
            },
            { sleep: noSleep, baseDelayMs: 1 }
        );
        expect(result).toBe("ok");
        expect(calls).toBe(2);
    });
});
