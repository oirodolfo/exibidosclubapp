import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import type { VerificationCodeRepository } from "../../application/ports/verification-code.repository.js";
import { HumanproofConfigService } from "../../config/humanproof-config.service.js";

const WINDOW_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class VerificationCodeRateLimitGuard implements CanActivate {
  constructor(
    private readonly repo: VerificationCodeRepository,
    private readonly config: HumanproofConfigService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ body?: unknown }>();
    const body = request.body as
      | { userId?: string; deviceFingerprint?: string }
      | undefined;
    const userId = body?.userId ?? "";
    const deviceFingerprint = body?.deviceFingerprint ?? "";
    if (!userId || !deviceFingerprint) {
      return true;
    }
    const since = new Date(Date.now() - WINDOW_MS);
    const [byUser, byDevice] = await Promise.all([
      this.repo.countByUserId(userId, since),
      this.repo.countByDevice(deviceFingerprint, since),
    ]);
    if (byUser >= this.config.maxAttemptsPerUser) {
      throw new HttpException(
        "Max verification attempts per user exceeded",
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
    if (byDevice >= this.config.maxAttemptsPerDevice) {
      throw new HttpException(
        "Max verification attempts per device exceeded",
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
    return true;
  }
}
