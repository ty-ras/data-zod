import type * as data from "@ty-ras/data";
import * as t from "zod";

export type ValidationError = Array<t.ZodError<unknown>>;

export const getHumanReadableErrorMessage = (errors: ValidationError) =>
  errors
    .flatMap((e) => e.issues)
    .map((i) => i.message)
    .join("\n");

export const createErrorObject = (
  errorInfo: ValidationError,
): data.DataValidatorResultError => ({
  error: "error",
  errorInfo,
  getHumanReadableMessage: () => getHumanReadableErrorMessage(errorInfo),
});
