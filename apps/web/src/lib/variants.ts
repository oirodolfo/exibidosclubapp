import { cva, type VariantProps } from "class-variance-authority";

/* ---------------------------------------------------------------------------
   EXIBIDOS Design System — component variants
   Bold, playful, neon-accented, pill-shaped, touchable.
   --------------------------------------------------------------------------- */

/** Primary CTA: lime or gradient. Secondary: glass/outline. Ghost: text only. */
export const button = cva(
  "inline-flex items-center justify-center rounded-full font-semibold min-h-[44px] px-5 py-2.5 transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-exibidos-lime focus-visible:ring-offset-2 focus-visible:ring-offset-exibidos-bg disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-exibidos-lime text-exibidos-bg hover:shadow-exibidos-glow-lime hover:scale-[1.02] focus-visible:ring-exibidos-lime",
        gradient:
          "bg-exibidos-gradient-lime-cyan text-exibidos-bg hover:shadow-exibidos-glow-lime hover:scale-[1.02] focus-visible:ring-exibidos-lime",
        secondary:
          "bg-white/10 text-exibidos-ink border border-white/20 hover:bg-white/15 hover:border-white/30 focus-visible:ring-exibidos-purple",
        ghost:
          "text-exibidos-ink hover:bg-white/10 focus-visible:ring-exibidos-muted",
        danger:
          "bg-exibidos-magenta text-white hover:shadow-exibidos-glow-magenta hover:scale-[1.02] focus-visible:ring-exibidos-magenta",
        purple:
          "bg-exibidos-purple text-white hover:bg-exibidos-purple-dim hover:shadow-exibidos-glow-purple hover:scale-[1.02] focus-visible:ring-exibidos-purple",
      },
      size: {
        sm: "h-9 min-h-[36px] px-4 text-sm",
        md: "min-h-[44px] px-5 text-base",
        lg: "min-h-[52px] px-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export type ButtonVariants = VariantProps<typeof button>;

/** Dark glass input, rounded-md, neon focus ring */
export const input = cva(
  "flex w-full rounded-exibidos-md border bg-exibidos-surface px-4 py-3 text-exibidos-ink placeholder:text-exibidos-muted focus:outline-none focus:ring-2 focus:ring-exibidos-purple/50 focus:border-exibidos-purple disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
  {
    variants: {
      error: {
        true: "border-exibidos-magenta focus:ring-exibidos-magenta/50 focus:border-exibidos-magenta",
        false: "border-white/15 hover:border-white/25",
      },
    },
    defaultVariants: {
      error: false,
    },
  }
);

export type InputVariants = VariantProps<typeof input>;

/** Chunky, rounded, layered card. Glass or solid. */
export const card = cva(
  "rounded-exibidos-lg border border-white/10 shadow-exibidos-card transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-exibidos-surface/95 backdrop-blur-xl",
        glass: "bg-white/5 backdrop-blur-xl",
        elevated: "bg-exibidos-elevated shadow-exibidos-card-glow",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-5",
        lg: "p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    },
  }
);

export type CardVariants = VariantProps<typeof card>;

/** Playful, colorful chip — collectible feel */
export const chip = cva(
  "inline-flex items-center gap-1.5 rounded-exibidos-sm px-3 py-1.5 text-sm font-medium transition-all duration-200",
  {
    variants: {
      variant: {
        lime: "bg-exibidos-lime/20 text-exibidos-lime border border-exibidos-lime/30",
        purple: "bg-exibidos-purple/20 text-exibidos-purple border border-exibidos-purple/30",
        cyan: "bg-exibidos-cyan/20 text-exibidos-cyan border border-exibidos-cyan/30",
        magenta: "bg-exibidos-magenta/20 text-exibidos-magenta border border-exibidos-magenta/30",
        amber: "bg-exibidos-amber/20 text-exibidos-amber border border-exibidos-amber/30",
        muted: "bg-white/10 text-exibidos-ink-soft border border-white/15",
      },
    },
    defaultVariants: {
      variant: "purple",
    },
  }
);

export type ChipVariants = VariantProps<typeof chip>;

/** Avatar container: rounded-full, optional glow */
export const avatar = cva("rounded-full object-cover flex-shrink-0", {
  variants: {
    size: {
      sm: "w-8 h-8",
      md: "w-10 h-10",
      lg: "w-14 h-14",
      xl: "w-20 h-20",
    },
    ring: {
      none: "",
      lime: "ring-2 ring-exibidos-lime/50 shadow-exibidos-glow-lime",
      purple: "ring-2 ring-exibidos-purple/50 shadow-exibidos-glow-purple",
      cyan: "ring-2 ring-exibidos-cyan/50 shadow-exibidos-glow-cyan",
    },
  },
  defaultVariants: {
    size: "md",
    ring: "none",
  },
});

export type AvatarVariants = VariantProps<typeof avatar>;

/* ---------------------------------------------------------------------------
   Layout & page
   --------------------------------------------------------------------------- */
export const page = {
  narrow: "mx-auto max-w-[360px] px-4 py-8",
  default: "mx-auto max-w-[420px] px-4 py-6",
  mid: "mx-auto max-w-[560px] px-4 py-6",
  wide: "mx-auto max-w-[720px] px-4 py-6",
  private: "mx-auto max-w-[560px] my-8 px-4",
} as const;

export const mainBlock = "p-4";

export const field = "mb-3";
export const fieldLabel = "mb-1 block text-sm font-semibold text-exibidos-ink-soft";
export const fieldHint = "mt-1 text-sm text-exibidos-muted";
export const blockHint = "mt-3 text-sm text-exibidos-muted";

export const fieldset = "mb-4";
export const checkboxLabel = "flex items-center gap-2 mb-2";
export const checkboxLabelLast = "flex items-center gap-2";
export const formRow = "flex gap-2 mb-2";
export const closeFriendRow = "flex justify-between items-center py-1";

export const listReset = "list-none p-0 m-0";
export const listItemBordered = "py-3 border-b border-white/10";
export const listItemRow = "flex items-center justify-between py-3 border-b border-white/10";

export const badgeList = "list-none p-0 m-0 flex flex-wrap gap-3";
export const badgeCard =
  "py-3 px-4 bg-exibidos-surface rounded-exibidos-md border border-white/10 min-w-[140px]";

export const photoGrid =
  "grid gap-4 grid-cols-[repeat(auto-fill,minmax(140px,1fr))]";

export const slugHandle = "text-exibidos-muted ml-2";

export const text = {
  muted: "text-exibidos-muted",
  mute: "text-exibidos-muted text-sm",
  error: "text-exibidos-magenta",
  success: "text-exibidos-lime",
} as const;

export const link =
  "text-exibidos-purple underline underline-offset-2 hover:text-exibidos-cyan transition-colors duration-200";

export const textarea =
  "flex w-full rounded-exibidos-md border border-white/15 bg-exibidos-surface px-4 py-3 text-exibidos-ink placeholder:text-exibidos-muted focus:outline-none focus:ring-2 focus:ring-exibidos-purple/50 focus:border-exibidos-purple disabled:opacity-50 transition-all duration-200";
