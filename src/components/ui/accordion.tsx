import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(function AccordionItem({ className, ...props }, ref) {
  return (
    <AccordionPrimitive.Item
      ref={ref}
      className={cn(
        "overflow-hidden rounded-xl border border-border/70 bg-card/70 shadow-sm transition-colors",
        "data-[state=open]:border-border data-[state=open]:bg-card/90",
        className,
      )}
      {...props}
    />
  );
});

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(function AccordionTrigger({ className, children, ...props }, ref) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          "flex flex-1 items-center justify-between gap-3 px-4 py-3 text-left text-base font-medium transition-colors",
          "hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
          "rounded-none data-[state=open]:bg-muted/60 data-[state=open]:text-foreground",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 data-[state=open]:rotate-180" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(function AccordionContent({ className, children, ...props }, ref) {
  return (
    <AccordionPrimitive.Content
      ref={ref}
      className="overflow-hidden text-sm text-muted-foreground"
      {...props}
    >
      <div className={cn("border-t border-border/60 bg-background/90 px-4 pb-4 pt-3", className)}>
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
});

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
