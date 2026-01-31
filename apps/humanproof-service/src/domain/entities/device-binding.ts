import type { DeviceStatus } from "../enums/device-status.js";
import type { UserVerificationStatus } from "../enums/user-verification-status.js";

/**
 * Device bound to a user.
 * Pure domain entity — no framework decorators.
 */
export interface DeviceBinding {
  readonly id: string;
  readonly userId: string;
  readonly deviceFingerprint: string;
  readonly status: DeviceStatus;
  readonly boundAt: Date;
  readonly lastSeenAt?: Date;
}

/**
 * Aggregated verification status for a user.
 */
export interface VerificationStatusResponse {
  readonly userId: string;
  readonly userVerificationStatus: UserVerificationStatus;
  readonly devices: readonly {
    deviceFingerprint: string;
    status: DeviceStatus;
    boundAt: string;
  }[];
}
