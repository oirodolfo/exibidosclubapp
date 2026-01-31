import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
} from "@nestjs/common";

/**
 * Stable JSON error contract for clients (e.g. Next.js).
 */
export interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string;
  details?: unknown;
}

@Catch()
export class HumanproofHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{
    status: (code: number) => { header: (k: string, v: string) => { send: (body: unknown) => void } };
  }>();
    const status =
      exception && typeof exception === "object" && "getStatus" in exception
        ? (exception as { getStatus: () => number }).getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception && typeof exception === "object" && "message" in exception
        ? String((exception as { message: unknown }).message)
        : "Internal server error";
    const body: ErrorResponseBody = {
      statusCode: status,
      error: HttpStatus[status] ?? "Unknown",
      message,
    };
    response
      .status(status)
      .header("Content-Type", "application/json")
      .send(body);
  }
}
