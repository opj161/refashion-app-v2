"use client";

import React from 'react';
import { 
  ThemeToggleImproved, 
  ThemeToggleIcon, 
  ThemeToggleCompact, 
  ThemeToggleButton 
} from '@/components/ui/ThemeToggleImproved';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

/**
 * Example usage of the improved theme toggle components
 * This demonstrates all available variants and configurations
 */
export function ThemeToggleExamples() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Theme Toggle Components</h1>
        <p className="text-muted-foreground">
          Enhanced theme toggle components with improved UX and multiple variants.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Icon Variant */}
        <Card>
          <CardHeader>
            <CardTitle>Icon Variant</CardTitle>
            <CardDescription>
              Compact icon-only button that cycles through themes on click. Perfect for headers and toolbars.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <ThemeToggleIcon />
            <code className="text-sm bg-muted px-2 py-1 rounded">
              &lt;ThemeToggleIcon /&gt;
            </code>
          </CardContent>
        </Card>

        {/* Compact Variant */}
        <Card>
          <CardHeader>
            <CardTitle>Compact Variant</CardTitle>
            <CardDescription>
              Small dropdown with minimal width. Shows all theme options without labels.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <ThemeToggleCompact />
            <code className="text-sm bg-muted px-2 py-1 rounded">
              &lt;ThemeToggleCompact /&gt;
            </code>
          </CardContent>
        </Card>

        {/* Button Variant with Label */}
        <Card>
          <CardHeader>
            <CardTitle>Button Variant (with Label)</CardTitle>
            <CardDescription>
              Full button with current theme label and dropdown menu. Best for settings pages.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <ThemeToggleButton showLabel={true} />
            <code className="text-sm bg-muted px-2 py-1 rounded">
              &lt;ThemeToggleButton showLabel=&#123;true&#125; /&gt;
            </code>
          </CardContent>
        </Card>

        {/* Button Variant without Label */}
        <Card>
          <CardHeader>
            <CardTitle>Button Variant (no Label)</CardTitle>
            <CardDescription>
              Button variant without text label, showing only icon and dropdown arrow.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <ThemeToggleButton showLabel={false} />
            <code className="text-sm bg-muted px-2 py-1 rounded">
              &lt;ThemeToggleButton showLabel=&#123;false&#125; /&gt;
            </code>
          </CardContent>
        </Card>

        <Separator />

        {/* Custom Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Configuration</CardTitle>
            <CardDescription>
              Using the main component with custom props for maximum flexibility.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <ThemeToggleImproved variant="button" showLabel={true} />
              <code className="text-sm bg-muted px-2 py-1 rounded">
                &lt;ThemeToggleImproved variant=&quot;button&quot; showLabel=&#123;true&#125; /&gt;
              </code>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggleImproved variant="icon" />
              <code className="text-sm bg-muted px-2 py-1 rounded">
                &lt;ThemeToggleImproved variant=&quot;icon&quot; /&gt;
              </code>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggleImproved variant="compact" />
              <code className="text-sm bg-muted px-2 py-1 rounded">
                &lt;ThemeToggleImproved variant=&quot;compact&quot; /&gt;
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Key Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>✅ <strong>Multiple Variants:</strong> Icon, compact, and full button styles</li>
              <li>✅ <strong>Dropdown Menu:</strong> Clear selection interface instead of cycling</li>
              <li>✅ <strong>System Theme Detection:</strong> Shows current system preference</li>
              <li>✅ <strong>Visual Feedback:</strong> Check marks for selected theme</li>
              <li>✅ <strong>Smooth Animations:</strong> Hover effects and transitions</li>
              <li>✅ <strong>Accessibility:</strong> Proper ARIA labels and keyboard navigation</li>
              <li>✅ <strong>SSR Safe:</strong> Handles hydration correctly</li>
              <li>✅ <strong>TypeScript:</strong> Full type safety</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
