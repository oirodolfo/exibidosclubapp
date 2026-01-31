import { Module } from "@nestjs/common";
import { ImsModule } from "./ims.module.js";

@Module({
  imports: [ImsModule],
})
export class AppModule {}
