import { Injectable } from "@nestjs/common";
import { TAXONOMY_VERSION, isTaxonomyV1Export } from "@exibidos/taxonomy";
import type { TaxonomyV1Export } from "@exibidos/taxonomy";

@Injectable()
export class TaxonomyValidatorService {
  validate(data: unknown): { ok: true; export_: TaxonomyV1Export } | { ok: false; reason: string } {
    if (!isTaxonomyV1Export(data)) {
      const version = (data as { version?: string })?.version;
      if (version && version !== TAXONOMY_VERSION) {
        return {
          ok: false,
          reason: `Mixed or invalid taxonomy version: got ${version}, expected ${TAXONOMY_VERSION}. Rejecting.`,
        };
      }
      return {
        ok: false,
        reason: "Export does not match taxonomy_v1 schema. Rejecting invalid data.",
      };
    }
    return { ok: true, export_: data as TaxonomyV1Export };
  }
}
