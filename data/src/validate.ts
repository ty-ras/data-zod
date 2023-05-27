/**
 * @file This file contains functions to create TyRAS {@link data.DataValidator}s from 'native' `zod` decoders and encoders.
 */

import type * as data from "@ty-ras/data";
import * as t from "zod";
import * as utils from "./utils";
import type * as protocol from "./protocol.types";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * This is the TyRAS decoder (deserializer) type for 'native' `zod` {@link t.ZodType} type, or surrogate {@link protocol.ProtocolValidation} object.
 */
export type Decoder<TData> =
  | t.ZodType<
      TData,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any,
      any
    >
  | protocol.ProtocolValidation<TData, any>;

/**
 * This is the TyRAS encoder (serializer) type for 'native' `zod` {@link t.ZodType} type, or surrogate {@link protocol.ProtocolValidation} object.
 */
export type Encoder<TOutput, TSerialized> =
  | t.ZodType<
      TSerialized,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any,
      TOutput
    >
  | protocol.ProtocolValidation<TOutput, TSerialized>;

/**
 * Creates a new {@link data.DataValidator} from given {@link Decoder}, wrapping its 'native' `zod` API into uniform TyRAS API.
 * @param validation The {@link Decoder}.
 * @returns A {@link data.DataValidator} which behaves like given `validation`.
 */
export const fromDecoder = <TData>(
  validation: Decoder<TData>,
): data.DataValidator<unknown, TData> => {
  const zodType =
    validation instanceof t.ZodType ? validation : validation.decoder;
  return (input) =>
    utils.transformLibraryResultToModelResult(zodType.safeParse(input));
};

/**
 * Creates a new {@link data.DataValidator} from given {@link Encoder}, wrapping its 'native' `zod` API into uniform TyRAS API.
 * @param validation The {@link Encoder}.
 * @returns A {@link data.DataValidator} which behaves like given `validation`.
 */
export const fromEncoder = <TRuntime, TEncoded>(
  validation: Encoder<TRuntime, TEncoded>,
): data.DataValidator<TRuntime, TEncoded> => {
  const zodType =
    validation instanceof t.ZodType ? validation : validation.encoder;
  // We can't use decoder to check whether 'input' is of correct type, as in most typical cases (e.g. timestamp in transit, Date at runtime, with correct .transform() used) it would always produce false.
  // There is no 'is' check like in `io-ts` library.
  return (input) =>
    utils.transformLibraryResultToModelResult(zodType.safeParse(input));
};
