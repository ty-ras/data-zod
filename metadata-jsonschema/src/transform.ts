import * as z2j from "zod-to-json-schema";
import * as t from "zod";
import * as common from "@ty-ras/metadata-jsonschema";
import type * as types from "./types";
import getUndefinedPossibility from "./check-undefined";

export const transformToJSONSchema = (
  validation: types.AnyEncoder | types.AnyDecoder,
  cutOffTopLevelUndefined: boolean,
  override: types.Override | undefined,
  fallbackValue: types.FallbackValue,
): common.JSONSchema => {
  const recursion: Recursion = (
    innerValidation: types.AnyEncoder | types.AnyDecoder,
  ) =>
    transformToJSONSchemaImpl(
      false,
      recursion,
      innerValidation,
      cutOffTopLevelUndefined,
      override,
      fallbackValue,
    );

  return transformToJSONSchemaImpl(
    true,
    recursion,
    validation,
    cutOffTopLevelUndefined,
    override,
    fallbackValue,
  );
};

const transformToJSONSchemaImpl = (
  topLevel: boolean,
  recursion: Recursion,
  ...[validation, cutOffTopLevelUndefined, override, fallbackValue]: Parameters<
    typeof transformToJSONSchema
  >
): common.JSONSchema => {
  let retVal = override?.(validation, cutOffTopLevelUndefined);
  if (retVal === undefined) {
    if (topLevel && validation instanceof t.ZodUnion) {
      retVal = tryTransformTopLevelSchema(
        recursion,
        (validation as t.ZodUnion<[t.ZodTypeAny]>).options,
      );
    } else {
      // TODO figure out if this type conversion is really ok
      retVal = z2j.zodToJsonSchema(validation) as unknown as common.JSONSchema;
    }
    if (retVal && typeof retVal !== "boolean" && !retVal.description) {
      const desc = validation.description;
      if (desc !== undefined) {
        retVal.description = desc;
      }
    }
  }
  return retVal ?? common.getFallbackValue(validation, fallbackValue);
};

type JSONSchemaObject = Exclude<common.JSONSchema, boolean>;

const tryTransformTopLevelSchema = (
  recursion: Recursion,
  components: ReadonlyArray<t.ZodType>,
) => {
  const nonUndefineds = components.filter(getUndefinedPossibility);
  return nonUndefineds.length !== components.length
    ? // This is top-level optional schema -> just transform the underlying non-undefineds
      nonUndefineds.length === 1
      ? recursion(nonUndefineds[0])
      : tryGetCommonTypeName("anyOf", nonUndefineds.map(recursion))
    : undefined;
};

type Recursion = (
  item: types.AnyEncoder | types.AnyDecoder,
) => common.JSONSchema;

const tryGetCommonTypeName = <TName extends "anyOf" | "allOf">(
  name: TName,
  schemas: ReadonlyArray<common.JSONSchema>,
): JSONSchemaObject => {
  const types = Array.from(
    new Set(
      schemas.map((s) =>
        typeof s === "object" && typeof s.type === "string"
          ? s.type
          : undefined,
      ),
    ).values(),
  );
  const retVal: JSONSchemaObject = { [name]: schemas };
  if (types.length === 1 && types[0] !== undefined) {
    retVal.type = types[0];
  }
  return retVal;
};
