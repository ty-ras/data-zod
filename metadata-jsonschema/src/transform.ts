/**
 * @file This file contains code related to transforming `zod` validators to JSON schema objects using `zod-to-json-schema` library.
 */

import * as t from "zod";
import * as z2j from "zod-to-json-schema";
import * as common from "@ty-ras/metadata-jsonschema";
import type * as types from "./md.types";
import getUndefinedPossibility from "./check-undefined";
import type * as data from "@ty-ras/data-zod";

/**
 * This function will transform the given {@link t.ZodType} into {@link common.JSONSchema} value.
 * @param validation The `zod` decoder or encoder.
 * @param cutOffTopLevelUndefined When traversing validators hierarchically, set to `true` to consider top-level `X | undefined` value as just `X`.
 * @param override The optional callback to override certain decoders or encoders.
 * @param fallbackValue The callback to get fallback value when this transformation fails to construct the {@link common.JSONSchema} value.
 * @param opts The {@link Z2JOptions} to use.
 * @returns The {@link common.JSONSchema}
 */
export const transformToJSONSchema = (
  validation: data.AnyDecoder | data.AnyEncoder,
  cutOffTopLevelUndefined: boolean,
  override: types.Override | undefined,
  fallbackValue: types.FallbackValue,
  opts: Z2JOptions,
): common.JSONSchema => {
  const recursion: Recursion = (innerValidation: t.ZodType) =>
    transformToJSONSchemaImpl(
      false,
      recursion,
      innerValidation,
      cutOffTopLevelUndefined,
      override,
      fallbackValue,
      opts,
    );

  return transformToJSONSchemaImpl(
    true,
    recursion,
    validation,
    cutOffTopLevelUndefined,
    override,
    fallbackValue,
    opts,
  );
};

/**
 * This the options type, as 2nd parameter of {@link z2j.zodToJsonSchema}.
 * The library unfortunately does not expose them directly, so have to use like this.
 */
export type Z2JOptions = Parameters<typeof z2j.zodToJsonSchema>[1];

const transformToJSONSchemaImpl = (
  topLevel: boolean,
  recursion: Recursion,
  ...[
    validation,
    cutOffTopLevelUndefined,
    override,
    fallbackValue,
    opts,
  ]: Parameters<typeof transformToJSONSchema>
): common.JSONSchema => {
  let retVal = override?.(validation, cutOffTopLevelUndefined);
  if (retVal === undefined) {
    retVal = transformUsingZod2JsonSchema(
      recursion,
      validation,
      topLevel,
      opts,
    );

    if (retVal && typeof retVal !== "boolean" && !retVal.description) {
      const desc = validation.description;
      if (desc !== undefined) {
        retVal.description = desc;
      }
    }
  }
  return retVal ?? common.getFallbackValue(validation, fallbackValue);
};

const tryTransformTopLevelSchema = (
  recursion: Recursion,
  original: t.ZodType,
  components: ReadonlyArray<t.ZodType>,
) => {
  const nonUndefineds = components.filter(
    (c) => getUndefinedPossibility(c) !== true,
  );
  return nonUndefineds.length !== components.length
    ? // This is top-level optional schema -> just transform the underlying non-undefineds
      nonUndefineds.length <= 1
      ? recursion(nonUndefineds[0])
      : recursion(
          t.union(nonUndefineds as [t.ZodTypeAny, t.ZodTypeAny], {
            description: original.description,
            errorMap: original._def.errorMap,
          }),
        )
    : undefined;
};

type Recursion = (item: t.ZodType) => common.JSONSchema;

const transformUsingZod2JsonSchema = (
  recursion: Recursion,
  validation: t.ZodType,
  topLevel: boolean,
  opts: Z2JOptions,
) => {
  let retVal: common.JSONSchema | undefined;
  if (topLevel && validation instanceof t.ZodUnion) {
    // Special case: top-level schema with undefined as union component -> will be marked as optional and schema being everything except undefined
    retVal = tryTransformTopLevelSchema(
      recursion,
      validation,
      (validation as t.ZodUnion<[t.ZodType, t.ZodType]>).options,
    );
  }

  if (retVal === undefined) {
    // TODO figure out if this type conversion is really ok
    try {
      retVal = z2j.zodToJsonSchema(
        validation,
        opts,
      ) as unknown as common.JSONSchema;
    } catch {
      // Ignore
    }
  }

  return retVal;
};
