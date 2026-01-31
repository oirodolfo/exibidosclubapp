import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from "@nestjs/common";
import { DeviceService } from "../device/device.service.js";
import { VerificationService } from "./verification.service.js";
import { VerificationUploadService } from "./verification-upload.service.js";
import { VerificationCodeRateLimitGuard } from "./verification-code-rate-limit.guard.js";

class CreateCodeDto {
  userId!: string;
  deviceFingerprint!: string;
  sessionId!: string;
  ipHash?: string;
}

@Controller("verification")
export class VerificationController {
  constructor(
    private readonly verification: VerificationService,
    private readonly uploadService: VerificationUploadService,
    private readonly deviceService: DeviceService
  ) {}

  @Post("code")
  @HttpCode(HttpStatus.OK)
  @UseGuards(VerificationCodeRateLimitGuard)
  async createCode(
    @Body()
    body: CreateCodeDto
  ): Promise<{ code: string; expiresAt: string }> {
    const ipHash = body.ipHash ?? "";
    return this.verification.createCode({
      userId: body.userId,
      deviceFingerprint: body.deviceFingerprint,
      sessionId: body.sessionId,
      ipHash,
    });
  }

  @Post("upload")
  @HttpCode(HttpStatus.OK)
  async upload(
    @Req() req: { file: () => Promise<{ file: AsyncIterable<Buffer> } | undefined> }
  ): Promise<{
    accepted: boolean;
    failureReasons: string[];
  }> {
    const data = await req.file();
    if (!data) {
      throw new BadRequestException("Missing file in multipart upload");
    }
    const chunks: Buffer[] = [];
    for await (const chunk of data.file) {
      chunks.push(chunk as Buffer);
    }
    const buffer = Buffer.concat(chunks);
    const result = await this.uploadService.analyzeUpload(buffer);
    if (!result.accepted) {
      return {
        accepted: false,
        failureReasons: [...result.failureReasons],
      };
    }
    return {
      accepted: true,
      failureReasons: [],
    };
  }

  @Get("status/:userId")
  async getStatus(
    @Param("userId") userId: string
  ) {
    return this.deviceService.getVerificationStatus(userId);
  }
}
