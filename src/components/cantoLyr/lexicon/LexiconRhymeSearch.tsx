import type { ReactElement } from "react";
import { z } from "zod";

import { LexiconSearchBase } from "./LexiconSearchBase";

const RhymeQuerySchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, { message: "cantoLyr.errors.rhyme.missingQuery" }),
});

export function LexiconRhymeSearch(): ReactElement {
  return (
    <LexiconSearchBase
      kind="rhyme"
      querySchema={RhymeQuerySchema}
      groupSize={50}
      inputProps={{ autoCapitalize: "off", autoCorrect: "off" }}
    />
  );
}

export default LexiconRhymeSearch;
