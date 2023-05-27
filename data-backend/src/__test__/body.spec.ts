/**
 * @file This file contains unit tests for functionality in file `../body.ts`.
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */

import test from "ava";
import * as spec from "../body";
import * as t from "zod";
import * as stream from "stream";

test("Validate requestBody works", async (c) => {
  c.plan(5);
  const input = t.string();
  const { validator, validatorSpec } = spec.requestBody(input);
  c.deepEqual(validatorSpec, {
    contents: {
      [spec.CONTENT_TYPE]: input,
    },
  });
  const correctReadable = () => stream.Readable.from([JSON.stringify("123")]);
  c.deepEqual(
    await validator({
      contentType: spec.CONTENT_TYPE,
      input: correctReadable(),
    }),
    {
      error: "none",
      data: "123",
    },
  );
  c.deepEqual(
    await validator({
      contentType: "incorrect/applicationtype",
      input: correctReadable(),
    }),
    {
      error: "unsupported-content-type",
      supportedContentTypes: [spec.CONTENT_TYPE],
    },
  );
  c.like(
    await validator({
      contentType: spec.CONTENT_TYPE,
      input: stream.Readable.from([JSON.stringify(123)]),
    }),
    {
      error: "error",
      // Zod errors are annoying to validate - the ZodError class contains methods for mutability and thus equality comparison or things like that simply won't work easily.
    },
  );
  c.like(
    await validator({
      contentType: spec.CONTENT_TYPE,
      input: stream.Readable.from([]),
    }),
    {
      error: "error",
      // Zod errors are annoying to validate - the ZodError class contains methods for mutability and thus equality comparison or things like that simply won't work easily.
    },
  );
});

test("Validate responseBody works", (c) => {
  c.plan(3);
  const output = t.string();
  const { validator, validatorSpec } = spec.responseBody(output);
  c.deepEqual(validatorSpec, {
    contents: {
      [spec.CONTENT_TYPE]: output,
    },
  });
  c.deepEqual(validator("123"), {
    error: "none",
    data: {
      contentType: spec.CONTENT_TYPE,
      output: JSON.stringify("123"),
    },
  });
  c.like(validator(123 as any), {
    error: "error",
    // Zod errors are annoying to validate - the ZodError class contains methods for mutability and thus equality comparison or things like that simply won't work easily.
  });
});

test("Validate request body optionality works", async (c) => {
  c.plan(4);
  const { validator: forbidRequestBody } = spec.requestBody(t.undefined());
  c.deepEqual(
    await forbidRequestBody({
      contentType: spec.CONTENT_TYPE,
      input: stream.Readable.from([]),
    }),
    {
      error: "none",
      data: undefined,
    },
  );
  c.like(
    await forbidRequestBody({
      contentType: spec.CONTENT_TYPE,
      input: stream.Readable.from([JSON.stringify("123")]),
    }),
    {
      error: "error",
    },
  );
  const { validator: optionalRequestBody } = spec.requestBody(
    t.union([t.undefined(), t.string()]),
  );
  c.deepEqual(
    await optionalRequestBody({
      contentType: spec.CONTENT_TYPE,
      input: stream.Readable.from([]),
    }),
    {
      error: "none",
      data: undefined,
    },
  );
  c.deepEqual(
    await optionalRequestBody({
      contentType: spec.CONTENT_TYPE,
      input: stream.Readable.from([JSON.stringify("123")]),
    }),
    {
      error: "none",
      data: "123",
    },
  );
});

test("Validate request body detects invalid JSON", async (c) => {
  c.plan(2);
  const { validator } = spec.requestBody(t.string());
  const result = await validator({
    contentType: spec.CONTENT_TYPE,
    input: stream.Readable.from(["not-a-json"]),
  });
  c.like(result, {
    error: "error",
  });
  if (result.error === "error") {
    c.true(result.errorInfo instanceof SyntaxError);
  }
});
