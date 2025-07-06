"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { motion } from "motion/react" // Import motion

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // Change background, remove padding
      "relative inline-flex h-12 items-center justify-center rounded-full bg-muted p-0",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  // Get the active state from props['data-state']
  const isActive = (props as any)["data-state"] === "active";
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        // Make trigger transparent, adjust padding, remove default active styles
        "relative inline-flex items-center justify-center whitespace-nowrap rounded-full px-6 py-2.5 text-base font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=inactive]:text-muted-foreground data-[state=active]:text-primary-foreground",
        className
      )}
      {...props}
    >
      {/* Wrap children in a span to ensure it's on top of the layout div */}
      <span className="relative z-10">{children}</span>
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-full bg-primary"
          layoutId="active-tab-indicator" // This ID is key for the animation
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        />
      )}
    </TabsPrimitive.Trigger>
  );
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
