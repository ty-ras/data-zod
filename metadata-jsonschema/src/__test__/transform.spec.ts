/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import test, { ExecutionContext } from "ava";
import type * as md from "@ty-ras/metadata-jsonschema";
import * as t from "zod";
import * as common from "./common";
import * as spec from "../transform";
import type * as types from "../types";

test("Validate transformToJSONSchema basic usages work", (c) => {
  c.plan(8);
  simpleTransformToJSONSchema(c, t.null().describe("null"), "null");
  simpleTransformToJSONSchema(c, common.undefined, { not: {} }, "undefined");
  simpleTransformToJSONSchema(c, t.void().describe("void"), {}, "void");
  simpleTransformToJSONSchema(c, common.stringValidator, "string");
  simpleTransformToJSONSchema(c, t.boolean().describe("boolean"), "boolean");
  simpleTransformToJSONSchema(c, common.number, "number");
  simpleTransformToJSONSchema(c, common.literal(null), "object", "null");
  simpleTransformToJSONSchema(
    c,
    common.literal(undefined),
    "object",
    "undefined",
  );
});

test("Validate transformToJSONSchema complex non-hierarchical usages work", (c) => {
  c.plan(6);
  c.deepEqual(rawTransformToJSONSchema(common.literal("literal")), {
    type: "string",
    const: "literal",
    description: '"literal"',
  });
  c.deepEqual(rawTransformToJSONSchema(common.literal(true)), {
    type: "boolean",
    const: true,
    description: "true",
  });
  c.deepEqual(rawTransformToJSONSchema(common.literal("literal")), {
    type: "string",
    const: "literal",
    description: '"literal"',
  });
  c.deepEqual(rawTransformToJSONSchema(t.never()), { not: {} });
  c.deepEqual(
    rawTransformToJSONSchema(
      common.union([
        common.literal("literal"),
        common.literal("anotherLiteral"),
      ]),
    ),
    {
      type: "string",
      enum: ["literal", "anotherLiteral"],
      description: '("literal" | "anotherLiteral")',
    },
  );
  c.deepEqual(rawTransformToJSONSchema(t.any()), {});
});

test("Validate transformToJSONSchema simple hierarchical usages work", (c) => {
  c.plan(3);
  simpleTransformToJSONSchema(
    c,
    t
      .string()
      .describe("string")
      .refine(() => true),
    "string",
  );
  const expectedArray: md.JSONSchema = {
    type: "array",
    items: {
      type: "string",
      description: "string",
    },
  };
  c.deepEqual(rawTransformToJSONSchema(common.array(common.stringValidator)), {
    ...expectedArray,
    description: "Array<string>",
  });
  c.deepEqual(
    rawTransformToJSONSchema(
      common.union([common.literal("one"), common.literal("two")]),
    ),
    {
      type: "string",
      enum: ["one", "two"],
      description: '("one" | "two")',
    },
  );
});

test("Validate transformToJSONSchema record types work", (c) => {
  c.plan(4);
  const expectedObject: md.JSONSchema = {
    type: "object",
    properties: {
      property: {
        type: "string",
        description: "string",
      },
    },
    description: "{ property: string }",
  };
  c.deepEqual(
    rawTransformToJSONSchema(
      common.object({
        property: common.stringValidator,
      }),
    ),
    {
      ...expectedObject,
      required: ["property"],
      additionalProperties: false,
    },
  );
  c.deepEqual(
    rawTransformToJSONSchema(
      common.object({
        property: common.stringValidator.optional(),
      }),
    ),
    {
      ...expectedObject,
      description: `{ property?: string }`,
      additionalProperties: false,
    },
  );
  c.deepEqual(
    rawTransformToJSONSchema(
      t
        .record(common.stringValidator, common.number)
        .describe("{ [K in string]: number }"),
    ),
    {
      type: "object",
      additionalProperties: {
        description: "number",
        type: "number",
      },

      description: "{ [K in string]: number }",
    },
  );
  c.deepEqual(
    rawTransformToJSONSchema(
      t
        .strictObject({
          property: common.stringValidator,
        })
        .describe("{ property: string }"),
    ),
    {
      ...expectedObject,
      required: ["property"],
      additionalProperties: false,
    },
  );
});

test("Validate transformToJSONSchema complex hierarchical usages work", (c) => {
  c.plan(7);
  // Union
  const stringAndNumber: Array<Exclude<md.JSONSchema, boolean>> = [
    {
      type: "string",
      description: "string",
    },
    {
      type: "number",
      description: "number",
    },
  ];
  c.deepEqual(
    rawTransformToJSONSchema(
      common.union([common.stringValidator, common.undefined]),
    ),
    // Top level `| undefined` type gets cut out, as it is handled specially in OpenAPI plugin
    stringAndNumber[0],
  );
  c.deepEqual(
    rawTransformToJSONSchema(
      common.union([
        common.stringValidator,
        common.undefined.refine(() => true),
      ]),
    ),
    // Top level `| undefined` type gets cut out, as it is handled specially in OpenAPI plugin
    stringAndNumber[0],
  );
  c.deepEqual(
    rawTransformToJSONSchema(
      common.union([common.stringValidator, common.number, common.undefined]),
    ),
    {
      // Same thing happens here as above
      type: stringAndNumber.map((s) => s.type),
      // TODO do something about this...?
      description: "(string | number | undefined)",
    },
  );
  c.deepEqual(
    rawTransformToJSONSchema(
      common.union([common.stringValidator, common.number]),
    ),
    {
      // No undefined present -> both types must be present
      type: ["string", "number"],
      description: "(string | number)",
    },
  );

  // Intersection
  c.deepEqual(
    rawTransformToJSONSchema(
      t
        .intersection(common.stringValidator, common.number)
        .describe("(string & number)"),
    ),
    {
      allOf: stringAndNumber,
      description: "(string & number)",
    },
  );

  // Tuple
  c.deepEqual(
    rawTransformToJSONSchema(
      t
        .tuple([common.stringValidator, common.number])
        .describe("[string, number]"),
    ),
    {
      type: "array",
      minItems: 2,
      maxItems: 2,
      items: stringAndNumber,
      description: "[string, number]",
    },
  );

  // Heterogenous literal unions
  c.deepEqual(
    rawTransformToJSONSchema(
      common.union([common.literal("literal"), common.literal(1)]),
    ),
    {
      type: ["string", "number"],
      enum: ["literal", 1],
      description: '("literal" | 1)',
    },
  );
});

test("Validate that transformToJSONSchema works with override and/or fallback callbacks", (c) => {
  c.plan(3);
  const overrideValue: md.JSONSchema = true;
  c.deepEqual(
    common.removeDollarSchema(
      spec.transformToJSONSchema(
        common.stringValidator,
        true,
        () => overrideValue,
        () => undefined,
        undefined,
      ),
    ),
    overrideValue,
  );
  const fallbackValue: md.JSONSchema = false;
  c.deepEqual(
    common.removeDollarSchema(
      spec.transformToJSONSchema(
        t.unknown(),
        true,
        undefined,
        () => fallbackValue,
        undefined,
      ),
    ),
    {},
  );
  c.deepEqual(
    common.removeDollarSchema(
      spec.transformToJSONSchema(
        common.stringValidator,
        true,
        () => overrideValue,
        fallbackValue,
        undefined,
      ),
    ),
    overrideValue,
  );
});

// test("Validate that transformToJSONSchema works with union of unions", (c) => {
//   c.plan(1);
//   c.deepEqual(
//     rawTransformToJSONSchema(
//       common.union([
//         common.stringValidator,
//         common.union([common.number, t.boolean().describe("boolean")]),
//       ]),
//     ),
//     {
//       // Nested unions are flattened
//       anyOf: [
//         {
//           description: "string",
//           type: "string",
//         },
//         {
//           description: "number",
//           type: "number",
//         },
//         {
//           description: "boolean",
//           type: "boolean",
//         },
//       ],
//       description: "(string | (number | boolean))",
//     },
//   );
// });

const simpleTransformToJSONSchema = (
  c: ExecutionContext,
  validation: types.AnyDecoder | types.AnyEncoder,
  type: Exclude<md.JSONSchema, boolean>["type"] | md.JSONSchema,
  description?: string,
) =>
  c.deepEqual(
    rawTransformToJSONSchema(validation),
    typeof type === "string"
      ? {
          type,
          description: description ?? type,
        }
      : typeof type === "object"
      ? {
          ...type,
          description,
        }
      : type,
  );

const rawTransformToJSONSchema = (
  validation: types.AnyDecoder | types.AnyEncoder,
) =>
  common.removeDollarSchema(
    spec.transformToJSONSchema(
      validation,
      true,
      undefined,
      () => undefined,
      undefined,
    ),
  );
