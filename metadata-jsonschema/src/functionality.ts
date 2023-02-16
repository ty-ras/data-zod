import * as common from "@ty-ras/metadata-jsonschema";
import type * as types from "./types";
import getUndefinedPossibility from "./check-undefined";
import * as convert from "./transform";

export const createJsonSchemaFunctionality = <
  TTransformedSchema,
  TContentTypes extends string,
>({
  contentTypes,
  override,
  fallbackValue,
  ...args
}: Input<TTransformedSchema, TContentTypes>) =>
  common.createJsonSchemaFunctionalityGeneric({
    ...args,
    stringDecoder: {
      transform: (decoder: types.AnyDecoder, cutOffTopLevelUndefined) =>
        convert.transformToJSONSchema(
          decoder,
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
          encoder,
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
            validation,
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
            validation,
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

export type Input<
  TTransformedSchema,
  TContentTypes extends string,
> = common.JSONSchemaFunctionalityCreationArgumentsContentTypes<
  TTransformedSchema,
  TContentTypes,
  types.AnyEncoder | types.AnyDecoder
> & {
  override?: common.OverrideGeneric<types.AnyEncoder | types.AnyDecoder>;
  z2jOptions?: convert.Z2JOptions;
};
