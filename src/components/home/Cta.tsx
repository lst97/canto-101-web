import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button.tsx';

export default function Cta(): ReactElement {
	const { t } = useTranslation();
	return (
		<section className="mt-24 rounded-[2.5rem] border border-primary/40 bg-primary/10 px-8 py-12 text-center shadow-[0_32px_80px_-48px_rgba(0,0,0,0.45)] backdrop-blur md:px-12">
			<h2 className="text-3xl font-black tracking-tight text-primary sm:text-4xl">
				{t('homepage.cta.title')}
			</h2>
			<p className="mt-5 max-w-2xl mx-auto text-base text-primary/80 sm:text-lg">
				{t('homepage.cta.description')}
			</p>
			<div className="mt-8 flex justify-center">
				<Button
					size="lg"
					className="rounded-full px-10 text-base font-semibold"
				>
					{t('homepage.cta.button')}
				</Button>
			</div>
		</section>
	);
}
