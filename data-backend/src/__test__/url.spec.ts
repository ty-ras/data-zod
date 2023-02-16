/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import test from "ava";
import * as spec from "../url";
import * as t from "zod";
import * as dataBE from "@ty-ras/data-backend";
import * as data from "@ty-ras/data";

test("Validate query works", (c) => {
  c.plan(5);
  const queryParamValue = t.string();
  const { validators, metadata } = spec.query({
    queryParam: queryParamValue,
  });
  c.deepEqual(metadata, {
    queryParam: {
      required: true,
      decoder: queryParamValue,
    },
  });
  c.deepEqual(Object.keys(validators), ["queryParam"]);
  c.deepEqual(validators.queryParam("123"), { error: "none", data: "123" });
  c.like(validators.queryParam(undefined), {
    error: "error",
    errorInfo: 'Query parameter "queryParam" is mandatory.',
  });
  c.like(validators.queryParam(123 as any), {
    error: "error",
    // Zod errors are annoying to validate - the ZodError class contains methods for mutability and thus equality comparison or things like that simply won't work easily.
  });
});

test("Validate urlParameter works", (c) => {
  c.plan(7);
  const urlParamDefaultRegExp = t.string();
  const numberRegExp = /\d+/;
  const urlParamCustomRegExp = t
    .string()
    .refine((str) => numberRegExp.test(str));
  const defaultRegExp = spec.urlParameter(
    "urlParamDefaultRegExp",
    urlParamDefaultRegExp,
  );
  const customRegExp = spec.urlParameter(
    "urlParamCustomRegExp",
    urlParamCustomRegExp,
    numberRegExp,
  );
  c.deepEqual(data.omit(defaultRegExp, "validator"), {
    name: "urlParamDefaultRegExp",
    decoder: urlParamDefaultRegExp,
    regExp: dataBE.defaultParameterRegExp(),
  });
  c.deepEqual(data.omit(customRegExp, "validator"), {
    name: "urlParamCustomRegExp",
    decoder: urlParamCustomRegExp,
    regExp: numberRegExp,
  });
  const notANumber = "not-a-number";
  c.deepEqual(defaultRegExp.validator(notANumber), {
    error: "none",
    data: notANumber,
  });
  c.like(customRegExp.validator(notANumber), {
    error: "error",
    // Zod errors are annoying to validate - the ZodError class contains methods for mutability and thus equality comparison or things like that simply won't work easily.
  });
  c.deepEqual(customRegExp.validator("123"), {
    error: "none",
    data: "123",
  });
  c.like(defaultRegExp.validator(123 as any), {
    error: "error",
    // Zod errors are annoying to validate - the ZodError class contains methods for mutability and thus equality comparison or things like that simply won't work easily.
  });
  c.like(customRegExp.validator(123 as any), {
    error: "error",
    // Zod errors are annoying to validate - the ZodError class contains methods for mutability and thus equality comparison or things like that simply won't work easily.
  });
});
