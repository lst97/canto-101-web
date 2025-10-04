import type { ReactElement } from 'react';

import { TestNavigationLoader } from '@/components/test/TestNavigationLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function TestNavigationLoaderPreview(): ReactElement {
  if (import.meta.env.PROD) {
    return (
      <div className="container mx-auto max-w-3xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Navigation Loader Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This test page is available during local development only.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex max-w-3xl flex-col gap-6 pb-8 pt-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Navigation Loader Preview
        </h1>
        <p className="text-sm text-muted-foreground">
          Inspect the dedicated test navigation loading indicator in isolation.
        </p>
      </header>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg">Inline Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The preview below renders the shared `NavigationLoadingIndicator`
            with test-specific copy to simulate navigation states in isolation.
          </p>
          <Separator />
          <div className="flex justify-center">
            <TestNavigationLoader className="max-w-lg" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
