import * as common from "@ty-ras/metadata-jsonschema";
import * as t from "zod";
import type * as types from "./types";

const getUndefinedPossibility: common.GetUndefinedPossibility<
  types.AnyEncoder | types.AnyDecoder
> = (validation) => {
  let retVal: boolean | undefined = validation instanceof t.ZodUndefined;
  if (!retVal) {
    if (validation instanceof t.ZodEffects) {
      retVal = getUndefinedPossibility(validation);
    } else if (validation instanceof t.ZodType) {
      retVal = validation.safeParse(undefined).success ? undefined : false;
    }
  }
  return retVal;
};

export default getUndefinedPossibility;
