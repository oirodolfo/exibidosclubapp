import { Injectable } from "@nestjs/common";
import type {
  ConfidenceDistribution,
  ClassFrequencySnapshot,
  AnnotationCorrectionRate,
  ModelPerformanceSnapshot,
} from "@exibidos/ml-contracts";

@Injectable()
export class MetricsService {
  private confidenceSnapshots: ConfidenceDistribution[] = [];
  private classFrequencySnapshots: ClassFrequencySnapshot[] = [];
  private correctionRates: AnnotationCorrectionRate[] = [];
  private performanceSnapshots: ModelPerformanceSnapshot[] = [];

  recordConfidence(snapshot: ConfidenceDistribution): void {
    this.confidenceSnapshots.push(snapshot);
    if (this.confidenceSnapshots.length > 1000) this.confidenceSnapshots.shift();
  }

  recordClassFrequency(snapshot: ClassFrequencySnapshot): void {
    this.classFrequencySnapshots.push(snapshot);
    if (this.classFrequencySnapshots.length > 500) this.classFrequencySnapshots.shift();
  }

  recordCorrectionRate(rate: AnnotationCorrectionRate): void {
    this.correctionRates.push(rate);
    if (this.correctionRates.length > 500) this.correctionRates.shift();
  }

  recordPerformance(snapshot: ModelPerformanceSnapshot): void {
    this.performanceSnapshots.push(snapshot);
    if (this.performanceSnapshots.length > 100) this.performanceSnapshots.shift();
  }

  getLatestConfidence(): ConfidenceDistribution | null {
    return this.confidenceSnapshots[this.confidenceSnapshots.length - 1] ?? null;
  }

  getLatestPerformance(): ModelPerformanceSnapshot | null {
    return this.performanceSnapshots[this.performanceSnapshots.length - 1] ?? null;
  }
}
