import { Link } from '@tanstack/react-router';
import { AlertTriangle, Home } from 'lucide-react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFound(): ReactElement {
	const { t } = useTranslation();

	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-6">
			<Card className="w-full max-w-md text-center">
				<CardHeader>
					<div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10">
						<AlertTriangle className="size-8 text-destructive" />
					</div>
					<CardTitle className="text-2xl font-bold text-foreground">
						{t('notFound.title', 'Page Not Found')}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-muted-foreground">
						{t(
							'notFound.description',
							'The page you are looking for does not exist.',
						)}
					</p>
					<Button asChild className="w-full">
						<Link to="/" className="flex items-center justify-center gap-2">
							<Home className="size-4" />
							{t('notFound.goHome', 'Go Home')}
						</Link>
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
