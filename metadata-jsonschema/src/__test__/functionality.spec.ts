/**
 * @file This file contains unit tests for functionality in file `../functionality.ts`.
 */

import test, { ExecutionContext } from "ava";
import * as md from "@ty-ras/metadata-jsonschema";
import * as t from "zod";
import * as common from "./common";
import * as spec from "../functionality";
import type * as types from "../md.types";

test("Validate createJsonSchemaFunctionality works for non-schema-transformation things", (c) => {
  c.plan(5);
  const { decoders, encoders, getUndefinedPossibility } =
    spec.createJsonSchemaFunctionality({
      contentTypes,
      transformSchema: (schema) => schema,
    });

  c.deepEqual(getUndefinedPossibility(t.undefined()), true);
  c.deepEqual(
    getUndefinedPossibility(t.union([common.stringValidator, t.undefined()])),
    undefined,
  );
  c.deepEqual(getUndefinedPossibility(common.stringValidator), false);

  c.deepEqual(Object.keys(decoders), contentTypes);
  c.deepEqual(Object.keys(encoders), contentTypes);
});

const testDecodersAndEncoders = (
  c: ExecutionContext,
  override: md.JSONSchema | undefined,
  fallbackValue: md.JSONSchema | undefined,
) => {
  let plan = 9;
  if (override !== undefined) {
    plan += 2;
  }
  if (fallbackValue !== undefined) {
    plan += 1;
  }
  c.plan(plan);
  const seenOverrideArgs: Array<types.AnyEncoder | types.AnyDecoder> = [];
  const seenFallbackArgs: Array<types.AnyEncoder | types.AnyDecoder> = [];
  const {
    stringDecoder,
    stringEncoder,
    decoders: { [contentType]: decoder },
    encoders: { [contentType]: encoder },
  } = spec.createJsonSchemaFunctionality({
    contentTypes,
    transformSchema: (schema) => schema,
    override:
      override !== undefined
        ? (arg) => (seenOverrideArgs.push(arg), override)
        : undefined,
    fallbackValue:
      fallbackValue !== undefined
        ? (arg) => (seenFallbackArgs.push(arg), fallbackValue)
        : undefined,
  });

  const stringInput = common.stringValidator;
  const expectedString = override ?? stringSchema;
  c.deepEqual(stringDecoder(stringInput, true), expectedString);
  c.deepEqual(stringEncoder(stringInput, true), expectedString);
  c.deepEqual(decoder(stringInput, true), expectedString);
  c.deepEqual(encoder(stringInput, true), expectedString);
  if (override !== undefined) {
    c.deepEqual(seenOverrideArgs, [
      stringInput,
      stringInput,
      stringInput,
      stringInput,
    ]);
  }

  seenOverrideArgs.length = 0;
  const unknownInput = t.unknown();
  const expectedUnknown = override ?? unknownSchema;
  c.deepEqual(stringDecoder(unknownInput, true), expectedUnknown);
  c.deepEqual(stringEncoder(unknownInput, true), expectedUnknown);
  c.deepEqual(decoder(unknownInput, true), expectedUnknown);
  c.deepEqual(encoder(unknownInput, true), expectedUnknown);
  if (override !== undefined) {
    c.deepEqual(seenOverrideArgs, [
      unknownInput,
      unknownInput,
      unknownInput,
      unknownInput,
    ]);
  }

  if (fallbackValue !== undefined) {
    const invalid = "hello" as unknown as t.ZodType;
    c.deepEqual(stringDecoder(invalid, true), override ?? fallbackValue);
    c.deepEqual(seenFallbackArgs, override !== undefined ? [] : ["hello"]);
  } else {
    c.deepEqual(seenFallbackArgs, []);
  }
};

test(
  "Validate createJsonSchemaFunctionality transformation works without override and without fallback",
  testDecodersAndEncoders,
  undefined,
  undefined,
);
test(
  "Validate createJsonSchemaFunctionality transformation works with override and without fallback",
  testDecodersAndEncoders,
  true,
  undefined,
);

test(
  "Validate createJsonSchemaFunctionality transformation works without override and with fallback",
  testDecodersAndEncoders,
  undefined,
  true,
);
test(
  "Validate createJsonSchemaFunctionality transformation works with override and with fallback",
  testDecodersAndEncoders,
  true,
  false,
);

const contentType = "application/json" as const;
const contentTypes = [contentType];

const stringSchema: md.JSONSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "string",
  description: "string",
};

const unknownSchema: md.JSONSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
};
