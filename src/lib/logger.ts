import pino from 'pino';

// Pino logger configuration for browser environment.
const logger = pino({
	level: import.meta.env.DEV ? 'debug' : 'info',
	browser: {
		serialize: true,
		asObject: false,
	},
});

export default logger;

type LogContext = Record<string, unknown> | undefined;

// Helper to normalize variable arguments into (context, msg)
function normalize(
	message: string,
	ctx: LogContext,
): [Record<string, unknown>, string] {
	if (ctx && typeof ctx === 'object') {
		return [ctx, message];
	}
	return [{}, message];
}

export const log = {
	debug: (message: string, context?: LogContext) => {
		const [ctx, msg] = normalize(message, context);
		logger.debug(ctx, msg);
	},
	info: (message: string, context?: LogContext) => {
		const [ctx, msg] = normalize(message, context);
		logger.info(ctx, msg);
	},
	warn: (message: string, context?: LogContext) => {
		const [ctx, msg] = normalize(message, context);
		logger.warn(ctx, msg);
	},
	error: (message: string, context?: LogContext) => {
		const [ctx, msg] = normalize(message, context);
		logger.error(ctx, msg);
	},
	fatal: (message: string, context?: LogContext) => {
		const [ctx, msg] = normalize(message, context);
		logger.fatal(ctx, msg);
	},
};
