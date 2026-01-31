/**
 * Device binding status.
 * Pure domain enum — no framework decorators.
 */
export const DeviceStatus = {
  UNBOUND: "UNBOUND",
  VERIFIED_DEVICE: "VERIFIED_DEVICE",
  RESTRICTED: "RESTRICTED",
  BLOCKED: "BLOCKED",
} as const;

export type DeviceStatus =
  (typeof DeviceStatus)[keyof typeof DeviceStatus];
