import { Injectable } from "@nestjs/common";
import type {
  MetadataAnalyzer,
  MetadataAnalysisResult,
} from "../../application/ports/metadata-analyzer.port";

@Injectable()
export class VerificationUploadService {
  constructor(private readonly metadataAnalyzer: MetadataAnalyzer) {}

  async analyzeUpload(buffer: Buffer): Promise<MetadataAnalysisResult> {
    const result = await this.metadataAnalyzer.analyze(buffer);
    return result;
  }
}
