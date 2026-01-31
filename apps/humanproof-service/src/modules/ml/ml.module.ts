import { Module } from "@nestjs/common";
import { MlClassifierPort } from "../../application/ports/ml-classifier.port.js";
import { TfjsClassifierService } from "./tfjs-classifier.service.js";

@Module({
  providers: [
    {
      provide: MlClassifierPort,
      useClass: TfjsClassifierService,
    },
  ],
  exports: [MlClassifierPort],
})
export class MlModule {}
