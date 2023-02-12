import type * as data from "@ty-ras/data";
import * as t from "zod";
import * as utils from "./utils";

export type Decoder<TData, TInput = unknown> = t.ZodType<
  TData,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  TInput
>;
export type Encoder<TOutput, TSerialized> = t.ZodType<
  TSerialized,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  TOutput
>;

export const plainValidator =
  <TData>(validation: Decoder<TData>): data.DataValidator<unknown, TData> =>
  (input) =>
    utils.transformLibraryResultToModelResult(validation.safeParse(input));

export const plainValidatorEncoder =
  <TOutput, TSerialized>(
    validation: Encoder<TOutput, TSerialized>,
  ): data.DataValidator<TOutput, TSerialized> =>
  (input) =>
    utils.transformLibraryResultToModelResult(validation.safeParse(input));
