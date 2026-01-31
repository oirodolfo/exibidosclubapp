import { Injectable, ConflictException } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import type {
  DeviceBinding,
  VerificationStatusResponse,
} from "../../domain/entities/device-binding.js";
import { DeviceStatus } from "../../domain/enums/device-status.js";
import { UserVerificationStatus } from "../../domain/enums/user-verification-status.js";
import type { DeviceBindingRepository } from "../../application/ports/device-binding.repository.js";
import { HumanproofConfigService } from "../../config/humanproof-config.service.js";

@Injectable()
export class DeviceService {
  constructor(
    private readonly repo: DeviceBindingRepository,
    private readonly config: HumanproofConfigService
  ) {}

  async bindDevice(
    userId: string,
    deviceFingerprint: string
  ): Promise<{ bound: boolean; deviceId: string }> {
    const count = await this.repo.countByUser(userId);
    const max = this.config.maxDevicesPerUser;
    if (count >= max) {
      throw new ConflictException(
        `Max devices per user (${max}) reached; remove a device first`
      );
    }
    const existing = await this.repo.find(userId, deviceFingerprint);
    if (existing) {
      if (
        existing.status === DeviceStatus.BLOCKED ||
        existing.status === DeviceStatus.RESTRICTED
      ) {
        throw new ConflictException("Device is restricted or blocked");
      }
      return { bound: true, deviceId: existing.id };
    }
    const id = randomBytes(16).toString("hex");
    const now = new Date();
    const binding: DeviceBinding = {
      id,
      userId,
      deviceFingerprint,
      status: DeviceStatus.VERIFIED_DEVICE,
      boundAt: now,
      lastSeenAt: now,
    };
    await this.repo.save(binding);
    return { bound: true, deviceId: id };
  }

  async restrictDevice(
    userId: string,
    deviceFingerprint: string
  ): Promise<void> {
    await this.repo.updateStatus(
      userId,
      deviceFingerprint,
      DeviceStatus.RESTRICTED
    );
  }

  async blockDevice(
    userId: string,
    deviceFingerprint: string
  ): Promise<void> {
    await this.repo.updateStatus(
      userId,
      deviceFingerprint,
      DeviceStatus.BLOCKED
    );
  }

  async getVerificationStatus(userId: string): Promise<VerificationStatusResponse> {
    const devices = await this.repo.findByUser(userId);
    const hasVerified = devices.some(
      (d) => d.status === DeviceStatus.VERIFIED_DEVICE
    );
    const userVerificationStatus = hasVerified
      ? UserVerificationStatus.VERIFIED
      : UserVerificationStatus.UNVERIFIED;
    return {
      userId,
      userVerificationStatus,
      devices: devices.map((d) => ({
        deviceFingerprint: d.deviceFingerprint,
        status: d.status,
        boundAt: d.boundAt.toISOString(),
      })),
    };
  }
}
