import { cva, type VariantProps } from "class-variance-authority";

export const button = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-neutral-900 text-white hover:bg-neutral-800 focus-visible:ring-neutral-900",
        secondary: "border border-neutral-300 bg-white hover:bg-neutral-50 focus-visible:ring-neutral-400",
        ghost: "hover:bg-neutral-100 focus-visible:ring-neutral-400",
        danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export type ButtonVariants = VariantProps<typeof button>;

export const input = cva(
  "flex w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      error: {
        true: "border-red-500 focus:ring-red-500",
        false: "",
      },
    },
    defaultVariants: {
      error: false,
    },
  }
);

export type InputVariants = VariantProps<typeof input>;

/** Card / panel for forms and content */
export const card = cva("rounded-lg border border-neutral-200 bg-white", {
  variants: {
    padding: {
      none: "",
      sm: "p-4",
      md: "p-6",
    },
  },
  defaultVariants: {
    padding: "md",
  },
});

/** Page container: max-width, centered, horizontal padding */
export const page = {
  narrow: "mx-auto max-w-[360px] px-4 py-8",
  default: "mx-auto max-w-[480px] px-4 py-6",
  mid: "mx-auto max-w-[560px] px-4 py-6",
  wide: "mx-auto max-w-[720px] px-4 py-6",
  /** Private profile gate: 560px, extra top margin */
  private: "mx-auto max-w-[560px] my-8 px-4",
} as const;

/** Simple main block for loading/error states */
export const mainBlock = "p-4";

/** Form field wrapper */
export const field = "mb-3";
export const fieldLabel = "mb-1 block text-sm font-medium text-neutral-700";
export const fieldHint = "mt-1 text-sm text-neutral-500";
/** Block-level hint (e.g. before a group of options) */
export const blockHint = "mt-3 text-sm text-neutral-500";

/** Fieldset and form layout */
export const fieldset = "mb-4";
export const checkboxLabel = "flex items-center gap-2 mb-2";
export const checkboxLabelLast = "flex items-center gap-2";
export const formRow = "flex gap-2 mb-2";
export const closeFriendRow = "flex justify-between items-center py-1";

/** List resets and list item variants */
export const listReset = "list-none p-0 m-0";
export const listItemBordered = "py-2 border-b border-neutral-200";
export const listItemRow = "flex items-center justify-between py-3 border-b border-neutral-200";

/** Badge grid and card */
export const badgeList = "list-none p-0 m-0 flex flex-wrap gap-4";
export const badgeCard = "py-3 px-4 bg-neutral-100 rounded-lg min-w-[140px]";

/** Photo grid: auto-fill 140px min */
export const photoGrid = "grid gap-4 grid-cols-[repeat(auto-fill,minmax(140px,1fr))]";

/** @handle secondary text */
export const slugHandle = "text-neutral-500 ml-2";

/** Text utilities */
export const text = {
  muted: "text-neutral-500",
  mute: "text-neutral-500 text-sm",
  error: "text-red-600",
  success: "text-green-600",
} as const;

export const link = "text-neutral-600 underline underline-offset-2 hover:text-neutral-900";

export const textarea =
  "flex w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-0 disabled:opacity-50";
