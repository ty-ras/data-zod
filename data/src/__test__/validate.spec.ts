/**
 * @file This file contains unit tests for functionality in file `../validate.ts`.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import test from "ava";
import * as spec from "../validate";
import * as t from "zod";

// Zod Errors are difficult for .deepEqual or .like
// So let's just leave them out for now...

test("Validate fromDecoder works", (c) => {
  c.plan(4);
  const validator = spec.fromDecoder(t.number());
  c.deepEqual(validator(123), {
    error: "none",
    data: 123,
  });
  c.like(validator("123"), {
    error: "error",
  });

  const fromStringToDate = spec.fromDecoder(lastChanged);
  c.deepEqual(fromStringToDate(TIMESTAMP), {
    error: "none",
    data: new Date(TIMESTAMP),
  });
  c.like(fromStringToDate("invalid"), { error: "error" });
});

test("Validate fromEncoder works", (c) => {
  c.plan(4);
  const encoder = spec.fromEncoder(t.number().transform((n) => `${n}`));
  c.deepEqual(encoder(123), {
    error: "none",
    data: "123",
  });
  c.like(encoder("123" as any), {
    error: "error",
  });

  const fromDateToString = spec.fromEncoder(lastChanged);
  c.deepEqual(fromDateToString(new Date(TIMESTAMP)), {
    error: "none",
    data: TIMESTAMP,
  });
  c.like(fromDateToString("invalid" as any), { error: "error" });
});

const lastChanged = {
  decoder: t
    .string()
    .transform((timestamp) => new Date(timestamp))
    .refine(
      (date) => !isNaN(date.valueOf()),
      "Invalid timestamp string supplied",
    ),
  encoder: t.date().transform((date) => date.toISOString()),
};

const TIMESTAMP = "2020-01-01T00:00:00.000Z";
