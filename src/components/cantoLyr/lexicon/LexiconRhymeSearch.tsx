import type { ReactElement } from "react";
import { z } from "zod";

import { cantonesePinyinTable } from "../../../data/cantonesePinyinTable";
import { LexiconSearchBase } from "./LexiconSearchBase";

const RhymeQuerySchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, { message: "cantoLyr.errors.rhyme.missingQuery" })
    .refine(
      (val) => cantonesePinyinTable.rhymes.includes(val as typeof cantonesePinyinTable.rhymes[number]),
      { message: "cantoLyr.errors.rhyme.invalidRhyme" }
    ),
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
