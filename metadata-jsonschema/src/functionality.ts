/**
 * @file This file contains function to invoke {@link common.createJsonSchemaFunctionalityGeneric} using `zod` lib-specific functionality (and leaving the rest to be specified as parameters.).
 */

import * as common from "@ty-ras/metadata-jsonschema";
import type * as data from "@ty-ras/data-zod";
import * as t from "zod";
import type * as types from "./md.types";
import getUndefinedPossibility from "./check-undefined";
import * as convert from "./transform";

/**
 * Creates new {@link JSONSchemaFunctionality} from given {@link Input}.
 * This function is typically meant to be used by other TyRAS libraries, and rarely directly by client code.
 * @param param0 The {@link Input} to this function.
 * @param param0.contentTypes Privately deconstructed variable.
 * @param param0.override Privately deconstructed variable.
 * @param param0.fallbackValue Privately deconstructed variable.
 * @returns The {@link JSONSchemaFunctionality} that can be used when creating metadata providers.
 */
export const createJsonSchemaFunctionality = <
  TTransformedSchema,
  TContentTypes extends string,
>({
  contentTypes,
  override,
  fallbackValue,
  ...args
}: Input<TTransformedSchema, TContentTypes>): JSONSchemaFunctionality<
  TTransformedSchema,
  TContentTypes
> =>
  common.createJsonSchemaFunctionalityGeneric({
    ...args,
    stringDecoder: {
      transform: (decoder: types.AnyDecoder, cutOffTopLevelUndefined) =>
        convert.transformToJSONSchema(
          ensureZodType(decoder, "decoder"),
          cutOffTopLevelUndefined,
          override,
          fallbackValue ?? common.getDefaultFallbackValue(),
          args.z2jOptions,
        ),
      override,
    },
    stringEncoder: {
      transform: (encoder: types.AnyEncoder, cutOffTopLevelUndefined) =>
        convert.transformToJSONSchema(
          ensureZodType(encoder, "encoder"),
          cutOffTopLevelUndefined,
          override,
          fallbackValue ?? common.getDefaultFallbackValue(),
          args.z2jOptions,
        ),
      override,
    },
    encoders: common.arrayToRecord(
      [...contentTypes],
      (): common.SchemaTransformation<types.AnyEncoder> => ({
        transform: (validation, cutOffTopLevelUndefined) =>
          convert.transformToJSONSchema(
            ensureZodType(validation, "encoder"),
            cutOffTopLevelUndefined,
            override,
            fallbackValue ?? common.getDefaultFallbackValue(),
            args.z2jOptions,
          ),
        override,
      }),
    ),
    decoders: common.arrayToRecord(
      [...contentTypes],
      (): common.SchemaTransformation<types.AnyDecoder> => ({
        transform: (validation, cutOffTopLevelUndefined) =>
          convert.transformToJSONSchema(
            ensureZodType(validation, "decoder"),
            cutOffTopLevelUndefined,
            override,
            fallbackValue ?? common.getDefaultFallbackValue(),
            args.z2jOptions,
          ),
        override,
      }),
    ),
    getUndefinedPossibility,
  });

/**
 * This interface extends {@link common.JSONSchemaFunctionalityCreationArgumentsContentTypes}, and acts as input to {@link createJsonSchemaFunctionality} function.
 */
export interface Input<TTransformedSchema, TContentTypes extends string>
  extends common.JSONSchemaFunctionalityCreationArgumentsContentTypes<
    TTransformedSchema,
    TContentTypes,
    types.AnyEncoder | types.AnyDecoder
  > {
  /**
   * Optional callback to override certain encoders or decoders, as needed.
   */
  override?: common.OverrideGeneric<types.AnyEncoder | types.AnyDecoder>;

  /**
   * The options to use when calling the `zod-to-json-schema` library to convert the Zod types to JSON schema.
   */
  z2jOptions?: convert.Z2JOptions;
}

/**
 * This type specializes {@link common.SupportedJSONSchemaFunctionality} with `zod` specific generic type arguments.
 * It is used as return value of {@link createJsonSchemaFunctionality}.
 */
export type JSONSchemaFunctionality<
  TTransformedSchema,
  TContentTypes extends string,
> = common.SupportedJSONSchemaFunctionality<
  TTransformedSchema,
  types.AnyDecoder,
  types.AnyEncoder,
  Record<TContentTypes, common.SchemaTransformation<types.AnyEncoder>>,
  Record<TContentTypes, common.SchemaTransformation<types.AnyDecoder>>
>;

const ensureZodType = (
  validation: types.AnyDecoder | types.AnyEncoder,
  propName: keyof data.ProtocolValidation<never, never>,
): t.ZodType =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  validation instanceof t.ZodType
    ? validation
    : typeof validation === "object" && propName in validation
    ? validation[propName]
    : (validation as unknown as t.ZodType); // Something completely else was given to this callback -> just let it pass thru then and pretend it's t.ZodType
