import { Module } from "@nestjs/common";
import { ImsModule } from "./ims.module";

@Module({
  imports: [ImsModule],
})
export class AppModule {}
