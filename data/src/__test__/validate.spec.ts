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
  c.plan(2);
  const validator = spec.fromDecoder(t.number());
  c.deepEqual(validator(123), {
    error: "none",
    data: 123,
  });
  c.like(validator("123"), {
    error: "error",
  });
});

test("Validate fromEncoder works", (c) => {
  c.plan(2);
  const encoder = spec.fromEncoder(t.number().transform((n) => `${n}`));
  c.deepEqual(encoder(123), {
    error: "none",
    data: "123",
  });
  c.like(encoder("123" as any), {
    error: "error",
  });
});
