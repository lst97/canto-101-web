import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TranslationEditorSidebar from './TranslationEditorSidebar';
import TranslationEditorMain from './TranslationEditorMain';
import { TranslationEditorProvider } from './state';

const TranslationEditor = () => {
  if (import.meta.env.PROD) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Translation Editor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This page is only available in development mode.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TranslationEditorProvider>
      <SidebarProvider
        style={
          {
            '--sidebar-width': '28rem',
            '--sidebar-width-mobile': '30rem',
          } as React.CSSProperties
        }
      >
        <TranslationEditorSidebar />
        <SidebarInset>
          <div className="px-2 pt-2">
            <SidebarTrigger className="-ml-1" />
          </div>
          <TranslationEditorMain />
        </SidebarInset>
      </SidebarProvider>
    </TranslationEditorProvider>
  );
};

export default TranslationEditor;
