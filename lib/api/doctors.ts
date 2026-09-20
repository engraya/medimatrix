import "server-only";
import { cache } from "react";
import { doctorListSchema, parseResponse } from "./schemas";
import { serverApi } from "./server";
export const getDoctors = cache(async () => {
  // The live API accepts only `active` and returns the complete list.
  return parseResponse(doctorListSchema, await serverApi<unknown>("/doctors?active=true"));
});
