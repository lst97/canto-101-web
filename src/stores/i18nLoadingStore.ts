import { create } from 'zustand';

const now = () =>
	typeof performance !== 'undefined' ? performance.now() : Date.now();

interface I18nLoadingState {
	isLoading: boolean;
	startedAt: number | null;
	minDurationMs: number;
	timeoutId: ReturnType<typeof setTimeout> | null;
	startLoading: (minDurationMs?: number) => void;
	finishLoading: () => void;
	cancelLoading: () => void;
}

const useI18nLoadingStore = create<I18nLoadingState>((set, get) => ({
	isLoading: false,
	startedAt: null,
	minDurationMs: 0,
	timeoutId: null,
	startLoading: (minDurationMs = 0) => {
		const { timeoutId } = get();
		if (timeoutId) {
			clearTimeout(timeoutId);
		}

		set({
			isLoading: true,
			startedAt: now(),
			minDurationMs,
			timeoutId: null,
		});
	},
	finishLoading: () => {
		const state = get();
		if (!state.isLoading) {
			return;
		}

		const { startedAt, minDurationMs, timeoutId } = state;
		if (timeoutId) {
			clearTimeout(timeoutId);
		}

		const elapsed = startedAt !== null ? now() - startedAt : minDurationMs;
		const remaining = Math.max(0, minDurationMs - elapsed);

		if (remaining <= 0) {
			set({
				isLoading: false,
				startedAt: null,
				minDurationMs: 0,
				timeoutId: null,
			});
			return;
		}

		const newTimeoutId = setTimeout(() => {
			set({
				isLoading: false,
				startedAt: null,
				minDurationMs: 0,
				timeoutId: null,
			});
		}, remaining);

		set({ timeoutId: newTimeoutId });
	},
	cancelLoading: () => {
		const { timeoutId } = get();
		if (timeoutId) {
			clearTimeout(timeoutId);
		}

		set({
			isLoading: false,
			startedAt: null,
			minDurationMs: 0,
			timeoutId: null,
		});
	},
}));

export { useI18nLoadingStore };
