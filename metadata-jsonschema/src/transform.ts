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
    }
    if (retVal === undefined) {
      retVal = transformZodType(recursion, validation, topLevel);
      // retVal = transformUsingZod2JsonSchema(validation);
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

const transformZodType = (
  recursion: Recursion,
  decoder: types.AnyEncoder | types.AnyDecoder,
  topLevel: boolean,
  // eslint-disable-next-line sonarjs/cognitive-complexity
): common.JSONSchema | undefined => {
  // The reason why there are so many "as t.ZodSomething" is because type of "def" will end up having "any" as all generic arguments of all generic types of the type union.
  // That's how classes and/or types work in TS I guess in this case.
  const def = (decoder as t.ZodFirstPartySchemaTypes)._def;
  switch (def.typeName) {
    case t.ZodFirstPartyTypeKind.ZodString:
      return makeTypedSchema("string");
    case t.ZodFirstPartyTypeKind.ZodBoolean:
      return makeTypedSchema("boolean");
    case t.ZodFirstPartyTypeKind.ZodNever:
      return false;
    case t.ZodFirstPartyTypeKind.ZodAny:
      return true;
    case t.ZodFirstPartyTypeKind.ZodNumber:
      return makeTypedSchema("number");
    case t.ZodFirstPartyTypeKind.ZodNull:
    case t.ZodFirstPartyTypeKind.ZodUndefined:
    case t.ZodFirstPartyTypeKind.ZodVoid:
      return makeTypedSchema("null");
    case t.ZodFirstPartyTypeKind.ZodLiteral: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { value } = def;
      return value === null || value === undefined
        ? makeTypedSchema("null")
        : typeof value === "string" ||
          typeof value === "boolean" ||
          typeof value === "number"
        ? transformLiteral(value)
        : undefined;
    }
    case t.ZodFirstPartyTypeKind.ZodArray:
      return makeTypedSchema("array", {
        items: recursion((def as t.ZodArrayDef<t.ZodType>).type),
      });
    case t.ZodFirstPartyTypeKind.ZodObject: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const entries = Object.entries(
        (def as t.ZodObjectDef<t.ZodRawShape>).shape(),
      );
      const retVal = makeTypedSchema("object", {
        properties: Object.fromEntries(
          entries.map(([propertyName, propertyValidation]) => [
            propertyName,
            recursion(propertyValidation),
          ]),
        ),
      });
      const required = entries.filter(
        ([, validation]) =>
          !(validation instanceof t.ZodOptional || validation.isOptional()),
      );
      if (required.length > 0) {
        retVal.required = required.map(([propertyName]) => propertyName);
      }
      if (def.unknownKeys === "strict") {
        retVal.minProperties = retVal.maxProperties = entries.length;
      }
      return retVal;
    }
    case t.ZodFirstPartyTypeKind.ZodRecord:
      return {
        type: "object",
        propertyNames: recursion((def as t.ZodRecordDef<t.ZodString>).keyType),
        additionalProperties: recursion(
          (def as t.ZodRecordDef<t.ZodString, t.ZodType>).valueType,
        ),
      };
    case t.ZodFirstPartyTypeKind.ZodOptional:
      return recursion((def as t.ZodOptionalDef<t.ZodType>).innerType);
    case t.ZodFirstPartyTypeKind.ZodEffects:
      return recursion((def as t.ZodEffectsDef<t.ZodType>).schema);
    case t.ZodFirstPartyTypeKind.ZodTuple: {
      const items = (def as t.ZodTupleDef<t.ZodTupleItems>).items;
      return {
        type: "array",
        items: items.map(recursion),
        minItems: items.length,
        maxItems: items.length,
      };
    }
    case t.ZodFirstPartyTypeKind.ZodUnion:
    case t.ZodFirstPartyTypeKind.ZodDiscriminatedUnion: {
      const components = Array.from(
        common.flattenDeepStructures(
          (
            def as
              | t.ZodUnionDef<[t.ZodType, t.ZodType]>
              | t.ZodDiscriminatedUnionDef<
                  string,
                  Array<t.ZodDiscriminatedUnionOption<string>>
                >
          ).options,
          (subType) =>
            subType instanceof t.ZodUnion ||
            subType instanceof t.ZodDiscriminatedUnion
              ? (
                  subType as
                    | t.ZodUnion<[t.ZodType, t.ZodType]>
                    | t.ZodDiscriminatedUnion<
                        string,
                        Array<t.ZodDiscriminatedUnionOption<string>>
                      >
                ).options
              : undefined,
        ),
      );

      let retVal: common.JSONSchema | undefined;
      if (topLevel) {
        retVal = tryTransformTopLevelSchema(recursion, components);
      }

      if (retVal === undefined) {
        retVal = tryGetCommonTypeName("anyOf", components.map(recursion));
      }
      return common.tryToCompressUnionOfMaybeEnums(retVal);
    }
    case t.ZodFirstPartyTypeKind.ZodIntersection:
      return tryGetCommonTypeName("allOf", [
        recursion((def as t.ZodIntersectionDef<t.ZodType>).left),
        recursion((def as t.ZodIntersectionDef<t.ZodType, t.ZodType>).right),
      ]);
  }
};

type JSONSchemaObject = Exclude<common.JSONSchema, boolean>;

const tryTransformTopLevelSchema = (
  recursion: Recursion,
  components: ReadonlyArray<t.ZodType>,
) => {
  const nonUndefineds = components.filter(
    (c) => getUndefinedPossibility(c) !== true,
  );
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

const transformLiteral = (value: string | number | boolean) =>
  makeTypedSchema(
    typeof value === "string"
      ? "string"
      : typeof value === "number"
      ? "number"
      : "boolean",
    {
      const: value,
    },
  );

const makeTypedSchema = (
  type: JSONSchemaObject["type"],
  rest: Omit<JSONSchemaObject, "type"> = {},
): JSONSchemaObject => ({
  type,
  ...rest,
});
