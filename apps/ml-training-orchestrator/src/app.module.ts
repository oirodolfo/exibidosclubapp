import { Module } from "@nestjs/common";
import { TrainingModule } from "./training/training.module.js";

@Module({
  imports: [TrainingModule],
})
export class AppModule {}
