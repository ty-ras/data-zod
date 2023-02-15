import * as t from "zod";

export const stringValidator = t.string().describe("string");

export const literal = <TLiteral extends t.Primitive>(literal: TLiteral) =>
  t
    .literal(literal)
    .describe(typeof literal === "string" ? `"${literal}"` : String(literal));

export const array = <TType extends t.ZodType>(element: TType) =>
  t.array(element).describe(`Array<${element.description}>`);

// eslint-disable-next-line no-shadow-restricted-names
export const undefined = t.undefined().describe("undefined");

export const number = t.number().describe("number");

export const union = <
  T extends readonly [t.ZodTypeAny, t.ZodTypeAny, ...t.ZodTypeAny[]],
>(
  components: T,
) =>
  t
    .union(components)
    .describe(`(${components.map((c) => c.description).join(" | ")})`);
