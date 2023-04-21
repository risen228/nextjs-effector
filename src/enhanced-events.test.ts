import { describe, it, expect } from "vitest";
import { allSettled, createEvent, createStore, fork } from "effector";

import { enhancePageEvent } from "./enhanced-events";

describe("enhancePageEvent", () => {
  describe("options: runOnce", () => {
    it('when "true", should run the event only once', async () => {
      const event = createEvent();

      const $times = createStore(0).on(event, (count) => count + 1);

      const scope = fork();

      const enhanced = enhancePageEvent(event, { runOnce: true });

      await allSettled(enhanced, { scope });
      await allSettled(enhanced, { scope });

      expect(scope.getState($times)).toBe(1);
    });

    it('when "false", should run the event the same amount of times', async () => {
      const event = createEvent();

      const $times = createStore(0).on(event, (count) => count + 1);

      const scope = fork();

      const enhanced = enhancePageEvent(event);

      await allSettled(enhanced, { scope });
      await allSettled(enhanced, { scope });

      expect(scope.getState($times)).toBe(2);
    });
  });

  describe("caching", () => {
    it("should return the same enhanced event on multiple calls", async () => {
      const event = createEvent();

      const enhanced1 = enhancePageEvent(event);
      const enhanced2 = enhancePageEvent(event);
      expect(enhanced1).toBe(enhanced2);

      const enhanced3 = enhancePageEvent(event, { runOnce: true });
      const enhanced4 = enhancePageEvent(event, { runOnce: true });
      expect(enhanced3).not.toBe(enhanced1);
      expect(enhanced3).toBe(enhanced4);
    });
  });
});
