import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pausableTimer } from "./timer";

describe("pausableTimer", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("fires once after the time runs out", () => {
    const done = vi.fn();
    pausableTimer(8000, done);
    vi.advanceTimersByTime(7999);
    expect(done).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("does not fire while paused, however long", () => {
    const done = vi.fn();
    const timer = pausableTimer(8000, done);
    vi.advanceTimersByTime(3000);
    timer.pause();
    vi.advanceTimersByTime(60_000);
    expect(done).not.toHaveBeenCalled();
  });

  it("gives back the full time on resume, so a reader who looked away is not rushed", () => {
    const done = vi.fn();
    const timer = pausableTimer(8000, done);
    vi.advanceTimersByTime(7000);
    timer.pause();
    timer.resume();
    vi.advanceTimersByTime(7999);
    expect(done).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("ignores a second pause or a resume while running", () => {
    const done = vi.fn();
    const timer = pausableTimer(8000, done);
    timer.resume();
    timer.pause();
    timer.pause();
    timer.resume();
    vi.advanceTimersByTime(8000);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("does not start again once it has fired", () => {
    const done = vi.fn();
    const timer = pausableTimer(8000, done);
    vi.advanceTimersByTime(8000);
    timer.resume();
    vi.advanceTimersByTime(20_000);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("never fires after cancel", () => {
    const done = vi.fn();
    const timer = pausableTimer(8000, done);
    timer.cancel();
    timer.resume();
    vi.advanceTimersByTime(20_000);
    expect(done).not.toHaveBeenCalled();
  });
});
