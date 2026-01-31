/**
 * exibidos.club — debug logger with namespaced emojis.
 * Enable via FEATURE_LOGGER=true. When disabled, all log calls are no-op.
 * Usage: log.api.info("request", { path }), log.auth.debug("session"), log.storage.upload.warn("retry")
 */
type LogLevel = "info" | "warn" | "error" | "debug";

function isLoggerEnabled(): boolean {
  return process.env.FEATURE_LOGGER === "true";
}

const levels: LogLevel[] = ["info", "warn", "error", "debug"];

/* ===========================
   🌍 ENV DETECTION
=========================== */

const isBrowser =
  typeof window !== "undefined" && typeof window.document !== "undefined";

const disableColor =
  isBrowser || process.env.NO_COLOR === "1" || process.env.CI === "true";

/* ===========================
   🌈 LEVEL COLORS
=========================== */

const levelColors: Record<LogLevel, string> = {
  info: "\x1b[34m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  debug: "\x1b[90m",
};

const reset = "\x1b[0m";

/* ===========================
   🎛️ NAMESPACE EMOJIS (exibidos web)
=========================== */

const namespaceEmojis: Record<string, string> = {
  api: "🌐",
  auth: "🔐",
  user: "👤",
  db: "🗄️",
  storage: "📦",
  upload: "📤",
  face: "👤",
  tags: "🏷️",
  votes: "🗳️",
  swipe: "👆",
  ml: "🧠",
  watermark: "💧",
};

/* ===========================
   🧠 FALLBACK EMOJIS
=========================== */

const fallbackEmojis = ["🧠", "🚀", "📦", "🧪", "⚙️", "🔥", "🌱", "🛰️", "🪐", "🧩"];

function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function emojiFor(namespace: string) {
  return (
    namespaceEmojis[namespace] ??
    fallbackEmojis[hash(namespace) % fallbackEmojis.length]
  );
}

/* ===========================
   🎨 FORMATTERS
=========================== */

function formatNamespace(parts: string[]) {
  return parts
    .map((ns) => {
      const emoji = emojiFor(ns);
      return `${emoji} ${ns}`;
    })
    .join(" ");
}

function formatLevel(level: LogLevel, text: string) {
  if (disableColor) return text;
  return `${levelColors[level]}${text}${reset}`;
}

/* ===========================
   🧱 LOGGER CORE
=========================== */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createLogger(namespace: string[] = []): any {
  return new Proxy(
    {},
    {
      get(_, prop: string) {
        if (levels.includes(prop as LogLevel)) {
          return (...args: any[]) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            if (!isLoggerEnabled()) return;
            const time = new Date().toISOString();
            const ns = formatNamespace(namespace);
            const level = formatLevel(prop as LogLevel, prop.toUpperCase());

            console[prop as LogLevel](
              time,
              level,
              ns,
              ...args
            );
          };
        }

        if (["then", "toString", "valueOf"].includes(prop)) {
          return undefined;
        }

        return createLogger([...namespace, prop]);
      },
    }
  );
}

export const log = createLogger();
