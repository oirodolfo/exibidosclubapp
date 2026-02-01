import type { DeviceBinding } from "../../domain/entities/device-binding";
import { DeviceStatus } from "../../domain/enums/device-status";
import { DeviceBindingRepository } from "../../application/ports/device-binding.repository";

export class InMemoryDeviceBindingRepository extends DeviceBindingRepository {
  private readonly store = new Map<string, DeviceBinding>();

  private key(userId: string, deviceFingerprint: string): string {
    return `${userId}:${deviceFingerprint}`;
  }

  async save(binding: DeviceBinding): Promise<void> {
    this.store.set(this.key(binding.userId, binding.deviceFingerprint), binding);
  }

  async findByUser(userId: string): Promise<readonly DeviceBinding[]> {
    return [...this.store.values()].filter((b) => b.userId === userId);
  }

  async countByUser(userId: string): Promise<number> {
    return [...this.store.values()].filter((b) => b.userId === userId).length;
  }

  async updateStatus(
    userId: string,
    deviceFingerprint: string,
    status: DeviceStatus
  ): Promise<void> {
    const existing = await this.find(userId, deviceFingerprint);
    if (!existing) return;
    const updated: DeviceBinding = {
      ...existing,
      status,
    };
    this.store.set(this.key(userId, deviceFingerprint), updated);
  }

  async find(
    userId: string,
    deviceFingerprint: string
  ): Promise<DeviceBinding | null> {
    return this.store.get(this.key(userId, deviceFingerprint)) ?? null;
  }
}
