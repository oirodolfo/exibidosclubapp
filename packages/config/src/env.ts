/**
 * Environment variables service: strong typings and defaults.
 * Use getEnv() for server; getPublicEnv() for client-safe values only (NEXT_PUBLIC_*).
 */

const asBool = (v: string | undefined): boolean => v === "true" || v === "1";
const asInt = (v: string | undefined, fallback: number): number => {
  if (v === undefined || v === "") return fallback;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? fallback : n;
};

/** Server-only env (secrets, DB, S3, OAuth). Do not expose to client. */
export interface ServerEnv {
  nodeEnv: "development" | "production" | "test";
  /** Postgres connection string (Prisma). */
  databaseUrl: string;
  /** Redis URL (sessions, cache, queues). */
  redisUrl: string;
  /** Canonical app URL (OAuth redirects, links). */
  appUrl: string;
  /** Session signing/encryption secret (Auth.js). */
  sessionSecret: string;
  /** S3-compatible storage. */
  s3: {
    bucket: string;
    accessKey: string;
    secretKey: string;
    region: string;
    endpoint: string | null;
    forcePathStyle: boolean;
    configured: boolean;
  };
  /** OAuth providers (empty string = disabled). */
  oauth: {
    google: { clientId: string; clientSecret: string };
    twitter: { clientId: string; clientSecret: string };
  };
  /** Feature flags (defaults: off for safety). */
  features: {
    imageUpload: boolean;
    swipe: boolean;
    rankings: boolean;
    tagging: boolean;
    logger: boolean;
    mlPipeline: boolean;
    faceBlur: boolean;
  };
  /** Storage provider: s3 or local (fallback for dev without MinIO). */
  storage: {
    provider: "s3" | "local";
    localPath: string;
  };
  /** IMS (Image Manipulation Service). */
  ims: {
    port: number;
    memoryCacheMax: number;
    memoryCacheTtlSeconds: number;
    featureBlurForce: "none" | "face" | "full" | null;
    featureBlurDisabled: boolean;
  };
  /** API port (Fastify). */
  apiPort: number;
  /** Optional: ML service URL, CDN base, vector DB. */
  mlServiceUrl: string | null;
  cdnImageBase: string | null;
  vectorDbUrl: string | null;
}

/** Client-safe env (NEXT_PUBLIC_* only). Safe to use in browser. */
export interface PublicEnv {
  appUrl: string;
  features: Pick<ServerEnv["features"], "swipe" | "imageUpload" | "tagging" | "rankings">;
}

const DEFAULT_APP_URL = "http://localhost:3000";
const DEFAULT_DATABASE_URL = "postgresql://exibidos:exibidos@localhost:5432/exibidos";
const DEFAULT_REDIS_URL = "redis://localhost:6379";
const DEFAULT_SESSION_SECRET = "change-me-in-production-min-32-chars";

function loadServerEnv(): ServerEnv {
  const raw = typeof process !== "undefined" ? process.env : ({} as NodeJS.ProcessEnv);
  const appUrl = raw.APP_URL ?? raw.NEXT_PUBLIC_APP_URL ?? DEFAULT_APP_URL;
  const s3Bucket = raw.S3_BUCKET ?? "";
  const s3AccessKey = raw.S3_ACCESS_KEY ?? "";
  const s3SecretKey = raw.S3_SECRET_KEY ?? "";
  const s3Configured = !!(s3Bucket && s3AccessKey && s3SecretKey);
  const storageProvider = raw.STORAGE_PROVIDER === "local" ? "local" : raw.STORAGE_PROVIDER === "s3" ? "s3" : s3Configured ? "s3" : "local";
  const storageLocalPath = raw.STORAGE_LOCAL_PATH ?? ".storage";

  return {
    nodeEnv: (raw.NODE_ENV as "development" | "production" | "test") ?? "development",
    databaseUrl: raw.DATABASE_URL ?? DEFAULT_DATABASE_URL,
    redisUrl: raw.REDIS_URL ?? DEFAULT_REDIS_URL,
    appUrl: appUrl.replace(/\/$/, ""),
    sessionSecret: raw.SESSION_SECRET ?? raw.NEXTAUTH_SECRET ?? DEFAULT_SESSION_SECRET,
    s3: {
      bucket: s3Bucket,
      accessKey: s3AccessKey,
      secretKey: s3SecretKey,
      region: raw.S3_REGION ?? "us-east-1",
      endpoint: raw.S3_ENDPOINT ?? null,
      forcePathStyle: raw.S3_FORCE_PATH_STYLE === "true",
      configured: s3Configured,
    },
    oauth: {
      google: {
        clientId: raw.GOOGLE_CLIENT_ID ?? raw.OAUTH_GOOGLE_CLIENT_ID ?? "",
        clientSecret: raw.GOOGLE_CLIENT_SECRET ?? raw.OAUTH_GOOGLE_CLIENT_SECRET ?? "",
      },
      twitter: {
        clientId: raw.TWITTER_CLIENT_ID ?? raw.OAUTH_TWITTER_CLIENT_ID ?? "",
        clientSecret: raw.TWITTER_CLIENT_SECRET ?? raw.OAUTH_TWITTER_CLIENT_SECRET ?? "",
      },
    },
    features: {
      imageUpload: asBool(raw.FEATURE_IMAGE_UPLOAD),
      swipe: asBool(raw.FEATURE_SWIPE),
      rankings: asBool(raw.FEATURE_RANKINGS),
      tagging: asBool(raw.FEATURE_TAGGING),
      logger: asBool(raw.FEATURE_LOGGER),
      mlPipeline: asBool(raw.FEATURE_ML_PIPELINE),
      faceBlur: asBool(raw.FEATURE_FACE_BLUR),
    },
    storage: {
      provider: storageProvider,
      localPath: storageLocalPath,
    },
    ims: {
      port: asInt(raw.IMS_PORT ?? raw.PORT, 4001),
      memoryCacheMax: asInt(raw.IMS_MEMORY_CACHE_MAX, 0),
      memoryCacheTtlSeconds: asInt(raw.IMS_MEMORY_CACHE_TTL, 3600),
      featureBlurForce: raw.FEATURE_BLUR_FORCE === "none" || raw.FEATURE_BLUR_FORCE === "face" || raw.FEATURE_BLUR_FORCE === "full" ? raw.FEATURE_BLUR_FORCE : null,
      featureBlurDisabled: asBool(raw.FEATURE_BLUR_DISABLED),
    },
    apiPort: asInt(raw.API_PORT ?? raw.PORT, 4000),
    mlServiceUrl: raw.ML_SERVICE_URL ?? raw.ML_EMBEDDING_URL ?? null,
    cdnImageBase: raw.CDN_IMAGE_BASE ?? null,
    vectorDbUrl: raw.VECTOR_DB_URL ?? null,
  };
}

function loadPublicEnv(): PublicEnv {
  const raw = typeof process !== "undefined" ? process.env : ({} as NodeJS.ProcessEnv);
  const appUrl = raw.NEXT_PUBLIC_APP_URL ?? raw.APP_URL ?? DEFAULT_APP_URL;
  return {
    appUrl: appUrl.replace(/\/$/, ""),
    features: {
      imageUpload: asBool(raw.FEATURE_IMAGE_UPLOAD),
      swipe: asBool(raw.FEATURE_SWIPE),
      tagging: asBool(raw.FEATURE_TAGGING),
      rankings: asBool(raw.FEATURE_RANKINGS),
    },
  };
}

let _serverEnv: ServerEnv | null = null;
let _publicEnv: PublicEnv | null = null;

/** Server env with strong typings and defaults. Call from API routes, server components, IMS. */
export function getEnv(): Readonly<ServerEnv> {
  if (_serverEnv === null) {
    _serverEnv = loadServerEnv();
  }
  return _serverEnv;
}

/** Client-safe env (NEXT_PUBLIC_* + feature flags used in UI). Use in client components. */
export function getPublicEnv(): Readonly<PublicEnv> {
  if (_publicEnv === null) {
    _publicEnv = loadPublicEnv();
  }
  return _publicEnv;
}

/** Reset cached env (for tests). */
export function resetEnv(): void {
  _serverEnv = null;
  _publicEnv = null;
}
