import * as dataFE from "@ty-ras/data-frontend";
import type * as data from "@ty-ras/data-zod";

export const createAPICallFactory = (
  callHttpEndpoint: dataFE.CallHTTPEndpoint,
) => dataFE.createAPICallFactoryGeneric<data.HKTEncoded>(callHttpEndpoint);
