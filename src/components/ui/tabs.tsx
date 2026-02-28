"use client"

import * as React from "react"
import { m, LayoutGroup } from "motion/react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

// 1. Create a context to hold the active tab's value
const TabsContext = React.createContext<{
  activeTab: string
}>({
  activeTab: "",
})

// 2. Tabs component provides the active tab value to context
function Tabs({ value, ref, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> & { ref?: React.Ref<React.ComponentRef<typeof TabsPrimitive.Root>> }) {
  return (
    <TabsPrimitive.Root ref={ref} value={value} {...props}>
      <TabsContext value={{ activeTab: value || "" }}>
        {props.children}
      </TabsContext>
    </TabsPrimitive.Root>
  )
}

// 3. TabsList wraps children in LayoutGroup for shared layout animations
function TabsList({ className, children, ref, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & { ref?: React.Ref<React.ComponentRef<typeof TabsPrimitive.List>> }) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex h-12 items-center justify-center rounded-xl bg-muted/20 p-1 text-muted-foreground backdrop-blur-xs border border-white/5",
        className
      )}
      {...props}
    >
      <LayoutGroup id={React.useId()}>{children}</LayoutGroup>
    </TabsPrimitive.List>
  )
}

// 4. TabsTrigger uses context to determine if it's active and renders the indicator
function TabsTrigger({ className, children, value, ref, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & { ref?: React.Ref<React.ComponentRef<typeof TabsPrimitive.Trigger>> }) {
  const { activeTab } = React.useContext(TabsContext)
  const isActive = activeTab === value

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      value={value}
      className={cn(
        // Removed strict bg-muted/40 to allow overrides via className props for better visual harmony
        "relative inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive 
          ? "text-white shadow-xs" 
          : "text-muted-foreground hover:text-foreground hover:bg-white/5",
        className
      )}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      {isActive && (
        <m.div
          layoutId="active-tab-indicator"
          className="absolute inset-0 z-0 rounded-lg bg-gradient-to-br from-primary to-primary-gradient-end shadow-lg shadow-primary/20"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </TabsPrimitive.Trigger>
  )
}

function TabsContent({ className, ref, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & { ref?: React.Ref<React.ComponentRef<typeof TabsPrimitive.Content>> }) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "data-[state=inactive]:hidden",
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }