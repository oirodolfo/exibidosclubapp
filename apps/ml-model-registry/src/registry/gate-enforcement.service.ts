import { Injectable } from "@nestjs/common";
import type { GateDecisionArtifact } from "@exibidos/ml-contracts";

@Injectable()
export class GateEnforcementService {
  /**
   * No model may reach production without passing gates.
   * Returns true only when decision is "approve".
   */
  canPromote(gateDecision: GateDecisionArtifact): boolean {
    return gateDecision.decision === "approve";
  }

  getReason(gateDecision: GateDecisionArtifact): string {
    return gateDecision.reason;
  }
}
