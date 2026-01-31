import { Injectable } from "@nestjs/common";
import { detectDrift, type DriftInput, type DriftSignal } from "@exibidos/ml";
import {
  DEFAULT_OBSERVABILITY_CONFIG,
  type ObservabilityConfig,
} from "@exibidos/ml-contracts";

@Injectable()
export class DriftDetectionService {
  private config: ObservabilityConfig = { ...DEFAULT_OBSERVABILITY_CONFIG };

  setConfig(config: Partial<ObservabilityConfig>): void {
    this.config = { ...this.config, ...config };
  }

  run(input: DriftInput): DriftSignal[] {
    return detectDrift({ ...input, config: this.config });
  }
}
