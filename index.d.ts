import type { ErrorRequestHandler } from 'express';

export type Options = {
	errorView?: string | undefined;
	includeErrorStack?: boolean | undefined;
};

export function renderErrorPage(options?: Options | undefined): ErrorRequestHandler;
