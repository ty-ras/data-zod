/**
 * @file This file contains functionality related to validation errors when using `zod` library with TyRAS.
 */

import type * as data from "@ty-ras/data";
import * as t from "zod";

/**
 * This type is the data validation error resulting from `zod` validators.
 */
export type ValidationError = Array<t.ZodError<unknown>>;

/**
 * Function to extract textual error from `zod` {@link ValidationError}.
 * @param errors The {@link ValidationError}.
 * @returns Textual representation of the error, extracting all {@link t.ZodError#issues} and further extracting all {@link t.ZodIssue#message}, and joining them with newline.
 */
export const getHumanReadableErrorMessage = (errors: ValidationError) =>
  errors
    .flatMap((e) => e.issues)
    .map((i) => i.message)
    .join("\n");

/**
 * Function to create {@link data.DataValidatorResultError} from given {@link ValidationError}.
 * @param errorInfo The {@link ValidationError}.
 * @returns The {@link data.DataValidatorResultError} with given error as `errorInfo` property, and `getHumanREadableMessage` being {@link getHumanReadableErrorMessage}.
 */
export const createErrorObject = (
  errorInfo: ValidationError,
): data.DataValidatorResultError => ({
  error: "error",
  errorInfo,
  getHumanReadableMessage: () => getHumanReadableErrorMessage(errorInfo),
});
