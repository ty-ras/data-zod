/* eslint-disable @typescript-eslint/no-explicit-any */
import type * as data from "@ty-ras/data-zod";
import type * as jsonSchema from "@ty-ras/metadata-jsonschema";

export type AnyEncoder = data.Encoder<any, any>;
export type AnyDecoder = data.Decoder<any>;
export type FallbackValue = jsonSchema.FallbackValueGeneric<
  AnyEncoder | AnyDecoder
>;
export type Override = jsonSchema.OverrideGeneric<AnyEncoder | AnyDecoder>;
