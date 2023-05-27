/**
 * @file This file contains unit tests for functionality in file `../headers.ts`.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */

import test from "ava";
import * as spec from "../headers";
import * as t from "zod";

test("Validate headers works", (c) => {
  c.plan(5);
  const headerParamValue = t.string();
  const { validators, metadata } = spec.requestHeaders({
    headerParam: headerParamValue,
  });
  c.deepEqual(metadata, {
    headerParam: {
      required: true,
      decoder: headerParamValue,
    },
  });
  c.deepEqual(Object.keys(validators), ["headerParam"]);
  c.deepEqual(validators.headerParam("123"), { error: "none", data: "123" });
  c.like(validators.headerParam(undefined), {
    error: "error",
    errorInfo: 'Header "headerParam" is mandatory.',
  });
  c.like(validators.headerParam(123 as any), {
    error: "error",
    // Zod errors are annoying to validate - the ZodError class contains methods for mutability and thus equality comparison or things like that simply won't work easily.
  });
});

test("Validate responseHeaders works", (c) => {
  c.plan(5);
  const headerParamValue = t.string();
  const { validators, metadata } = spec.responseHeaders({
    headerParam: headerParamValue,
  });
  c.deepEqual(metadata, {
    headerParam: {
      required: true,
      encoder: headerParamValue,
    },
  });
  c.deepEqual(Object.keys(validators), ["headerParam"]);
  c.deepEqual(validators.headerParam("123"), { error: "none", data: "123" });
  c.like(validators.headerParam(undefined as any), {
    error: "error",
    errorInfo: 'Header "headerParam" is mandatory.',
  });
  c.like(validators.headerParam(123 as any), {
    error: "error",
    // Zod errors are annoying to validate - the ZodError class contains methods for mutability and thus equality comparison or things like that simply won't work easily.
  });
});

test("Validate string decoding optionality detection", (c) => {
  c.plan(3);
  const headerType = t.string();
  const optionalHeaderType = t.union([headerType, t.undefined()]);
  const { validators, metadata } = spec.requestHeaders({
    requiredHeader: headerType,
    optionalHeader: optionalHeaderType,
  });
  c.deepEqual(metadata, {
    requiredHeader: {
      decoder: headerType,
      required: true,
    },
    optionalHeader: {
      decoder: optionalHeaderType,
      required: false,
    },
  });
  c.deepEqual(validators.optionalHeader(undefined), {
    error: "none",
    data: undefined,
  });
  c.like(validators.requiredHeader(undefined), {
    error: "error",
  });
});

test("Validate string encoding optionality detection", (c) => {
  c.plan(3);
  const headerType = t.string();
  const optionalHeaderType = t.union([headerType, t.undefined()]);
  const { validators, metadata } = spec.responseHeaders({
    requiredHeader: headerType,
    optionalHeader: optionalHeaderType,
  });
  c.deepEqual(metadata, {
    requiredHeader: {
      encoder: headerType,
      required: true,
    },
    optionalHeader: {
      encoder: optionalHeaderType,
      required: false,
    },
  });
  c.deepEqual(validators.optionalHeader(undefined), {
    error: "none",
    data: undefined,
  });
  c.like(validators.requiredHeader(undefined as any), {
    error: "error",
  });
});
