import React from 'react';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export const BreadcrumbForKey = ({ selectedKey }: { selectedKey: string }) => {
	const parts = selectedKey.split('.');
	const items = parts.map((part, index) => {
		const path = parts.slice(0, index + 1).join('.');
		const isLast = index === parts.length - 1;
		return (
			<React.Fragment key={path}>
				<BreadcrumbItem>
					{isLast ? (
						<BreadcrumbPage>{part}</BreadcrumbPage>
					) : (
						<BreadcrumbLink href="#">{part}</BreadcrumbLink>
					)}
				</BreadcrumbItem>
				{!isLast && <BreadcrumbSeparator />}
			</React.Fragment>
		);
	});

	return (
		<Breadcrumb>
			<BreadcrumbList>{items}</BreadcrumbList>
		</Breadcrumb>
	);
};

export const FlagIcon = ({
	component: Comp,
	className,
}: {
	component: React.ComponentType<unknown>;
	className?: string;
}) => {
	const C = Comp as React.ComponentType<Record<string, unknown>>;
	return <C className={className} />;
};
