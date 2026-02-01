import { Controller, Get, Param, Query, Res } from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { getMetrics } from "./observability";
import { ImsImageService } from "./ims-image.service";

@Controller()
export class ImsController {
  constructor(private readonly imageService: ImsImageService) {}

  @Get("health")
  health(): { status: string; service: string } {
    return { status: "ok", service: "@exibidos/ims" };
  }

  @Get("metrics")
  metrics() {
    return getMetrics();
  }

  @Get("i/:imageId")
  async getImage(
    @Param("imageId") imageId: string,
    @Query() query: Record<string, string | undefined>,
    @Res() reply: FastifyReply
  ): Promise<void> {
    const result = await this.imageService.handle(imageId, query);

    if (result.buffer != null && result.contentType != null) {
      reply
        .status(result.statusCode)
        .header("Content-Type", result.contentType)
        .header("Cache-Control", "public, max-age=31536000, immutable")
        .header("X-IMS-Cache", result.cache ?? "miss")
        .send(result.buffer);
      return;
    }

    reply.status(result.statusCode).send({
      error: result.error,
      ...(result.message != null && { message: result.message }),
    });
  }
}
