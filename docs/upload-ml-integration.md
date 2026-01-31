# Upload Pipeline — ML Integration

The upload pipeline integrates with the NestJS ML Model Registry and inference pipeline.

## Contract

- **Upload pipeline** (e.g. Next.js `/api/images/upload`, or api-gateway) consumes the **active model version** via Model Registry.
- **ML inference runs asynchronously** — not on the request path. After upload, a job or worker runs inference and persists ML metadata.
- **Low-confidence cases** are routed to Label Studio for human review (feedback loop).
- **ML metadata** is persisted as immutable records (e.g. `ImageMlMetadata`); IMS consumes it for crop/blur/watermark.

## Flow

1. User uploads image → upload pipeline persists file and creates `Image` record.
2. Upload pipeline (or cron) triggers async ML process with **active model version** from Model Registry (`GET /registry/active` or `@exibidos/ml-registry-client`).
3. Inference runs (e.g. Python worker or internal face detection); result is written to `ImageMlMetadata`.
4. If confidence is below threshold, the image is pushed to Label Studio (feedback loop).
5. IMS and clients read ML metadata for transforms; no inference on request path.

## Configuration

- `ML_MODEL_REGISTRY_URL`: Base URL of the NestJS Model Registry (e.g. `http://ml-model-registry:4030`).
- `FEATURE_ML_PIPELINE`: Enable ML processing on upload.

## Client

Use `@exibidos/ml-registry-client` to fetch active deployment:

```ts
import { getActiveModelVersion } from "@exibidos/ml-registry-client";

const modelVersion = await getActiveModelVersion({
  baseUrl: process.env.ML_MODEL_REGISTRY_URL ?? "",
});
// Pass modelVersion to async inference job; if null, use default or skip.
```
