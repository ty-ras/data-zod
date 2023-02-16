import * as t from "zod";
import type * as md from "@ty-ras/metadata-jsonschema";
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

export const object = <T extends t.ZodRawShape>(shape: T) =>
  t.object(shape).describe(
    `{ ${Object.entries(shape)
      .map(
        ([propertyName, propertySchema]) =>
          `${propertyName}${propertySchema.isOptional() ? "?" : ""}: ${
            propertySchema.description
          }`,
      )
      .join(", ")} }`,
  );

export const removeDollarSchema = (result: md.JSONSchema) => {
  if (result && typeof result === "object") {
    delete result["$schema"];
  }
  return result;
};
