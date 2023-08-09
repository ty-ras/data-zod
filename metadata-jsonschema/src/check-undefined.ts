/**
 * @file This internal file contains callback to check for `undefined` possibility, used by other places in the code.
 */

import * as common from "@ty-ras/metadata-jsonschema";
import * as t from "zod";
import type * as data from "@ty-ras/data-zod";

/**
 * Given either {@link t.ZodType} or protocol validation object, checks whether `undefined` is a valid value.
 *
 * Notice that when given the protocol validation object, this uses the `decoder` property to check for undefined being possible.
 * @param validation The validation to check.
 * @returns The {@link common.UndefinedPossibility} for given `validation`.
 */
const getUndefinedPossibility: common.GetUndefinedPossibility<
  data.AnyEncoder | data.AnyDecoder
> = (validation) => {
  let retVal: boolean | undefined = validation instanceof t.ZodUndefined;
  if (!retVal) {
    if (validation instanceof t.ZodEffects) {
      retVal = getUndefinedPossibility(
        (validation as t.ZodEffects<t.ZodType>).innerType(),
      );
    } else {
      retVal = validation.safeParse(undefined).success ? undefined : false;
    }
  }
  return retVal;
};

export default getUndefinedPossibility;
