import { Module } from "@nestjs/common";
import { DeviceBindingRepository } from "../../application/ports/device-binding.repository";
import { InMemoryDeviceBindingRepository } from "../../infra/persistence/in-memory-device-binding.repository";
import { DeviceService } from "./device.service";

@Module({
  providers: [
    DeviceService,
    {
      provide: DeviceBindingRepository,
      useClass: InMemoryDeviceBindingRepository,
    },
  ],
  exports: [DeviceService],
})
export class DeviceModule {}
