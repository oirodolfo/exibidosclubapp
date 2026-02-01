import { Controller, Get, Param, Query, Res } from "@nestjs/common";
import { ImageService } from "./image.service";

interface HttpResponse {
  status(n: number): { send(body: unknown): void };
  header(k: string, v: string): HttpResponse;
  send(body: Buffer): void;
}

@Controller()
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Get("health")
  health(): { status: string; service: string } {
    return { status: "ok", service: "@exibidos/image-service" };
  }

  @Get("i/:imageId")
  async serveImage(
    @Param("imageId") imageId: string,
    @Query() query: Record<string, string>,
    @Res() reply: HttpResponse
  ): Promise<void> {
    const result = await this.imageService.serve(imageId, query as Record<string, string | undefined>);

    if (!result.ok) {
      reply.status(result.error.status).send({
        error: result.error.code,
        ...(result.error.message && { message: result.error.message }),
      });
      return;
    }

    reply
      .header("Content-Type", result.result.contentType)
      .header("Cache-Control", "public, max-age=31536000, immutable")
      .header("X-IMS-Cache", result.result.cacheHit ? "hit" : "miss")
      .send(result.result.buffer);
  }
}
