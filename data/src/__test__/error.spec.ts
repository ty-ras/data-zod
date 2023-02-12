/* eslint-disable sonarjs/no-duplicate-string */
import test from "ava";
import * as spec from "../error";
import * as t from "zod";

test("Validate getHumanReadableErrorMessage works", (c) => {
  c.plan(1);
  c.deepEqual(
    transformZodError(
      t.number().safeParse("not-a-number"),
      spec.getHumanReadableErrorMessage,
    ),
    "Expected number, received string",
  );
});

test("Validate createErrorObject works", (c) => {
  c.plan(2);
  const result = transformZodError(
    t.number().safeParse("not-a-number"),
    spec.createErrorObject,
  );
  const errorInfo: spec.ValidationError = [
    new t.ZodError([
      {
        code: "invalid_type",
        expected: "number",
        received: "string",
        path: [],
        message: "Expected number, received string",
      },
    ]),
  ];
  c.deepEqual(
    (result.errorInfo as Array<t.ZodError>)[0].issues,
    errorInfo[0].issues,
  );
  c.deepEqual(
    result.getHumanReadableMessage(),
    spec.getHumanReadableErrorMessage(errorInfo),
  );
});

const transformZodError = <T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  retVal: t.SafeParseReturnType<any, any>,
  transform: (errorObject: spec.ValidationError) => T,
) => {
  if (retVal.success) {
    throw new Error("The return value should've been error");
  }
  return transform([retVal.error]);
};
