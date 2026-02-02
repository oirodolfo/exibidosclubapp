export type ResizeAction = { kind: "resize"; width: number };
export type ThumbAction = { kind: "thumb"; width: number };
export type BlurAction = { kind: "blur"; radius: number };
export type ConvertAction = { kind: "convert"; format: "webp" | "avif" };

export type ImageAction =
  | ResizeAction
  | ThumbAction
  | BlurAction
  | ConvertAction;
