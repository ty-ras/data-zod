import * as data from "@ty-ras/data";
import type * as dataBE from "@ty-ras/data-backend";
import * as common from "@ty-ras/data-zod";
import * as stringDecoder from "./string-decoder-generic";
import * as stringEncoder from "./string-encoder-generic";

export const headers = <TValidation extends stringDecoder.TDecoderBase>(
  validation: TValidation,
): dataBE.RequestHeaderDataValidatorSpec<
  stringDecoder.GetDecoderData<TValidation>,
  common.Decoder<unknown>
> => stringDecoder.stringDecoder(validation, "Header");

export const responseHeaders = <TValidation extends stringEncoder.TEncoderBase>(
  validation: TValidation,
): dataBE.ResponseHeaderDataValidatorSpec<
  stringEncoder.GetEncoderData<TValidation>,
  common.Encoder<unknown, data.HeaderValue>
> => stringEncoder.stringEncoder(validation, "Header");
