import { Module } from "@nestjs/common";
import { ImsModule } from "./ims.module";
import { JobsModule } from "./jobs/jobs.module";

@Module({
  imports: [ImsModule, JobsModule],
})
export class AppModule {}
