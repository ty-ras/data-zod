import test from "ava";
import * as spec from "../utils";
import * as t from "zod";
import * as error from "../error";

test("Validate transformLibraryResultToModelResult works for successful case", (c) => {
  c.plan(1);
  c.deepEqual(
    spec.transformLibraryResultToModelResult(t.number().safeParse(123)),
    {
      error: "none",
      data: 123,
    },
  );
});

test("Validate transformLibraryResultToModelResult works for invalid case", (c) => {
  c.plan(2);
  const errorInfo: error.ValidationError = [
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
  const result = spec.transformLibraryResultToModelResult(
    t.number().safeParse("123"),
  );
  if (result.error === "error") {
    c.deepEqual(
      (result.errorInfo as Array<t.ZodError>)[0].issues,
      errorInfo[0].issues,
    );
    c.deepEqual(
      result.getHumanReadableMessage(),
      error.getHumanReadableErrorMessage(errorInfo),
    );
  }
});
