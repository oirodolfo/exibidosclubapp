import type { DeviceBinding } from "../../domain/entities/device-binding";
import type { DeviceStatus } from "../../domain/enums/device-status";

/**
 * Port for device binding storage.
 */
export abstract class DeviceBindingRepository {
  abstract save(binding: DeviceBinding): Promise<void>;
  abstract findByUser(userId: string): Promise<readonly DeviceBinding[]>;
  abstract countByUser(userId: string): Promise<number>;
  abstract updateStatus(
    userId: string,
    deviceFingerprint: string,
    status: DeviceStatus
  ): Promise<void>;
  abstract find(
    userId: string,
    deviceFingerprint: string
  ): Promise<DeviceBinding | null>;
}
