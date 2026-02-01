import { Injectable } from "@nestjs/common";
import { VerificationDecision } from "../../domain/enums/verification-decision";
import type { MetadataAnalysisResult } from "../../application/ports/metadata-analyzer.port";
import type { MlClassifierOutput } from "../../application/ports/ml-classifier.port";
import type { HashCheckResult } from "../hash/hash.service";
import { HumanproofConfigService } from "../../config/humanproof-config.service";

export interface AntifraudSignals {
  readonly ipRiskScore?: number;
  readonly deviceRiskScore?: number;
  readonly velocityAttempts?: number;
}

export interface DecisionInput {
  readonly metadata: MetadataAnalysisResult;
  readonly hash: HashCheckResult;
  readonly ml: MlClassifierOutput;
  readonly antifraud?: AntifraudSignals;
}

export interface DecisionResult {
  readonly decision: VerificationDecision;
  readonly confidence: number;
  readonly failureReasons: readonly string[];
}

@Injectable()
export class DecisionService {
  constructor(private readonly config: HumanproofConfigService) {}

  decide(input: DecisionInput): DecisionResult {
    const reasons: string[] = [];
    const thresholdVerified = this.config.mlConfidenceThresholdVerified;
    const thresholdReject = this.config.mlConfidenceThresholdReject;
    const shadowMode = this.config.mlShadowMode;

    if (!input.metadata.accepted) {
      reasons.push(...input.metadata.failureReasons);
    }
    if (!input.hash.accepted) {
      reasons.push(...input.hash.failureReasons);
    }

    const mlScores = [
      input.ml.handwrittenScore,
      input.ml.photoScore,
      input.ml.rawImageScore,
    ];
    const avgMl = mlScores.reduce((a, b) => a + b, 0) / mlScores.length;
    const minMl = Math.min(...mlScores);

    if (!shadowMode) {
      if (minMl < thresholdReject) {
        reasons.push(
          `ML confidence below reject threshold (${(minMl * 100).toFixed(1)}% < ${(thresholdReject * 100).toFixed(0)}%)`
        );
      }
    }

    if (input.antifraud?.ipRiskScore != null && input.antifraud.ipRiskScore > 0.8) {
      reasons.push("IP risk score too high");
    }
    if (input.antifraud?.deviceRiskScore != null && input.antifraud.deviceRiskScore > 0.8) {
      reasons.push("Device risk score too high");
    }
    if (input.antifraud?.velocityAttempts != null && input.antifraud.velocityAttempts > 10) {
      reasons.push("Velocity (attempts) too high");
    }

    const hasRejectReasons = reasons.length > 0;
    const mlVerified = avgMl >= thresholdVerified && minMl >= thresholdReject;

    let decision: VerificationDecision;
    let confidence: number;

    if (hasRejectReasons && !shadowMode) {
      decision = VerificationDecision.REJECTED;
      confidence = Math.max(0, 1 - reasons.length * 0.2);
    } else if (hasRejectReasons && shadowMode) {
      decision = VerificationDecision.REQUIRES_MANUAL_REVIEW;
      confidence = avgMl * 0.7;
    } else if (mlVerified) {
      decision = VerificationDecision.VERIFIED;
      confidence = avgMl;
    } else if (avgMl >= (thresholdVerified + thresholdReject) / 2) {
      decision = VerificationDecision.REQUIRES_MANUAL_REVIEW;
      confidence = avgMl;
    } else {
      decision = VerificationDecision.REJECTED;
      confidence = avgMl;
    }

    return {
      decision,
      confidence: Math.max(0, Math.min(1, confidence)),
      failureReasons: reasons,
    };
  }
}
