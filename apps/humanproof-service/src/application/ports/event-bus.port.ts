/**
 * Domain event payloads (Kafka-ready structure).
 */
export type HumanproofVerificationStarted = {
  type: "humanproof.verification.started";
  userId: string;
  deviceFingerprint: string;
  sessionId: string;
  timestamp: string;
};

export type HumanproofVerificationSucceeded = {
  type: "humanproof.verification.succeeded";
  userId: string;
  deviceFingerprint: string;
  timestamp: string;
};

export type HumanproofVerificationFailed = {
  type: "humanproof.verification.failed";
  userId: string;
  deviceFingerprint: string;
  failureReasons: readonly string[];
  timestamp: string;
};

export type HumanproofDeviceBound = {
  type: "humanproof.device.bound";
  userId: string;
  deviceFingerprint: string;
  deviceId: string;
  timestamp: string;
};

export type HumanproofDomainEvent =
  | HumanproofVerificationStarted
  | HumanproofVerificationSucceeded
  | HumanproofVerificationFailed
  | HumanproofDeviceBound;

/**
 * Port for emitting domain events (Kafka-ready adapter can implement).
 */
export abstract class EventBusPort {
  abstract emit(event: HumanproofDomainEvent): Promise<void>;
}
