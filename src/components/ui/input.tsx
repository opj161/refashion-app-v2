import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ref, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        // Dark mode specific overrides for "Glass" feel but with higher contrast
        "dark:bg-white/5 dark:border-white/20 dark:placeholder:text-white/40 dark:hover:border-white/30 transition-colors",
        className
      )}
      ref={ref}
      {...props}
    />
  )
}
Input.displayName = "Input"

export { Input }
