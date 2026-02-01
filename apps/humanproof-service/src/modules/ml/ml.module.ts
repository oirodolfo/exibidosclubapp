import { Module } from "@nestjs/common";
import { MlClassifierPort } from "../../application/ports/ml-classifier.port";
import { TfjsClassifierService } from "./tfjs-classifier.service";

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
