/**
 * @file This file contains utility function to wrap 'native' `zod` {@link t.SafeParseReturnType} into TyRAS {@link data.DataValidatorResult}.
 */

import type * as data from "@ty-ras/data";
import * as t from "zod";
import * as error from "./error";

/**
 * This function will wrap the given 'native' `zod` {@link t.SafeParseReturnType} into TyRAS {@link data.DataValidatorResult}.
 * @param validationResult The {@link t.Validation} validation result.
 * @returns The {@link data.DataValidatorResult}, either {@link data.DataValidatorResultError} or {@link data.DataValidatorResultSuccess}
 */
export const transformLibraryResultToModelResult = <TData>(
  validationResult: t.SafeParseReturnType<unknown, TData>,
): data.DataValidatorResult<TData> => {
  if (validationResult.success) {
    return {
      error: "none",
      data: validationResult.data,
    };
  } else {
    const errorInfo = [validationResult.error];
    return {
      error: "error",
      errorInfo,
      getHumanReadableMessage: () =>
        error.getHumanReadableErrorMessage(errorInfo),
    };
  }
};
