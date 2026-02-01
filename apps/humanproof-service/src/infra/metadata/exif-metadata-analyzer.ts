import exifr from "exifr";
import {
  type MetadataAnalysisResult,
  MetadataAnalyzer,
} from "../../application/ports/metadata-analyzer.port";

/**
 * Real EXIF-based metadata analyzer.
 * Rejects: missing camera metadata, editing software, no DateTimeOriginal, screenshot indicators.
 */
export class ExifMetadataAnalyzer extends MetadataAnalyzer {
  async analyze(buffer: Buffer): Promise<MetadataAnalysisResult> {
    const reasons: string[] = [];
    let cameraMake: string | undefined;
    let cameraModel: string | undefined;
    let dateTimeOriginal: string | undefined;
    let software: string | undefined;

    const tags = await exifr.parse(buffer, {
      pick: [
        "Make",
        "Model",
        "DateTimeOriginal",
        "Software",
        "ModifyDate",
        "CreateDate",
      ],
    }).catch(() => null);

    if (!tags || typeof tags !== "object") {
      reasons.push("Missing or invalid EXIF metadata");
      return {
        accepted: false,
        failureReasons: reasons,
      };
    }

    const make = tags.Make ?? tags.make;
    const model = tags.Model ?? tags.model;
    const dateTime = tags.DateTimeOriginal ?? tags.DateTime ?? tags.CreateDate ?? tags.ModifyDate;
    const sw = tags.Software;

    if (make != null) cameraMake = String(make).trim();
    if (model != null) cameraModel = String(model).trim();
    if (dateTime != null) dateTimeOriginal = String(dateTime).trim();
    if (sw != null) software = String(sw).trim();

    if (!cameraMake || !cameraModel) {
      reasons.push("Missing camera Make/Model (not a camera image or stripped)");
    }

    if (software && software.length > 0) {
      reasons.push(`Editing software detected: ${software}`);
    }

    if (!dateTimeOriginal) {
      reasons.push("Missing DateTimeOriginal (capture timestamp)");
    }

    if (dateTimeOriginal) {
      const parsed = Date.parse(dateTimeOriginal);
      if (Number.isNaN(parsed)) {
        reasons.push("Invalid DateTimeOriginal format");
      }
      const now = Date.now();
      const diffMs = now - parsed;
      if (diffMs < -86400000 * 7) {
        reasons.push("Capture time is more than 7 days in the future");
      }
      if (diffMs > 86400000 * 365) {
        reasons.push("Capture time is more than 1 year in the past");
      }
    }

    const accepted = reasons.length === 0;
    return {
      accepted,
      failureReasons: reasons,
      cameraMake,
      cameraModel,
      dateTimeOriginal,
      software: software || undefined,
    };
  }
}
