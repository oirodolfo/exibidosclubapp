import { Module } from "@nestjs/common";
import { DeviceBindingRepository } from "../../application/ports/device-binding.repository.js";
import { InMemoryDeviceBindingRepository } from "../../infra/persistence/in-memory-device-binding.repository.js";
import { DeviceService } from "./device.service.js";

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
