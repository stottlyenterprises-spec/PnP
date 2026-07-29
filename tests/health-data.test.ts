import assert from "node:assert/strict";
import test from "node:test";

import { mergeNativeHealthDays } from "../lib/health-data.ts";

type Entry = {
  date: string;
  sleep: string;
  weight: string;
  sources?: { sleep?: string; weight?: string };
};

const blank = (date: string): Entry => ({ date, sleep: "", weight: "" });

test("connected health fills blank sleep and weight with source labels", () => {
  const result = mergeNativeHealthDays([], [{
    date: "2026-07-29",
    sleepHours: 7.42,
    weightPounds: 212.16,
    sleepSource: "Apple Health",
    weightSource: "Apple Health",
  }], blank);

  assert.deepEqual(result, [{
    date: "2026-07-29",
    sleep: "7.4",
    weight: "212.2",
    sources: { sleep: "Apple Health", weight: "Apple Health" },
  }]);
});

test("manual values are never replaced by connected health", () => {
  const result = mergeNativeHealthDays([
    { date: "2026-07-29", sleep: "8", weight: "210" },
  ], [{
    date: "2026-07-29",
    sleepHours: 6.5,
    weightPounds: 215,
    sleepSource: "Health Connect",
    weightSource: "Health Connect",
  }], blank);

  assert.equal(result[0].sleep, "8");
  assert.equal(result[0].weight, "210");
});

test("Oura sleep keeps priority over platform sleep while platform weight can fill", () => {
  const result = mergeNativeHealthDays([
    {
      date: "2026-07-29",
      sleep: "7.8",
      weight: "",
      sources: { sleep: "Oura" },
    },
  ], [{
    date: "2026-07-29",
    sleepHours: 7.1,
    weightPounds: 211,
    sleepSource: "Apple Health",
    weightSource: "Apple Health",
  }], blank);

  assert.equal(result[0].sleep, "7.8");
  assert.equal(result[0].sources?.sleep, "Oura");
  assert.equal(result[0].weight, "211");
  assert.equal(result[0].sources?.weight, "Apple Health");
});
