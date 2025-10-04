import type { ReactElement } from 'react';

import { LoadingIndicator } from '../ui/loading-indicator.tsx';

export interface TestNavigationLoaderProps {
  className?: string;
}

export function TestNavigationLoader({
  className,
}: Readonly<TestNavigationLoaderProps>): ReactElement {
  return (
    <LoadingIndicator
      variant="navigation"
      className={className}
      titleKey="test.navigation.loading.title"
      descriptionKey="test.navigation.loading.description"
      statusKey="test.navigation.loading.status"
    />
  );
}

export default TestNavigationLoader;
