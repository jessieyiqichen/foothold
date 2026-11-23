// House style: no full stops in the interface.
import { describe, expect, it } from "vitest";
import { SIGNALS_COPY } from "./copy";

describe("signal lines", () => {
  it("have no full stop", () => {
    for (const line of Object.values(SIGNALS_COPY)) expect(line, line).not.toMatch(/\.(\s|$)/);
  });
});
