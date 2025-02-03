import { TErrorWithMessage } from '@/types/types';

const isErrorWithMessage = (error: unknown): error is TErrorWithMessage => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
};

const toErrorWithMessage = (maybeError: unknown): TErrorWithMessage => {
  if (isErrorWithMessage(maybeError)){
    return maybeError;
  }
  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    // fallback in case there's an error stringifying the maybeError
    // like with circular references for example.
    return new Error(String(maybeError));
  }
};

export const getErrorMessage = (error: unknown) => {
  return toErrorWithMessage(error).message;
};

export const assertIsJsonError = (e: any): boolean => {
  return (
    typeof e === 'object' &&
    ('error' in e) &&
    (typeof e['error'] === 'object') &&
    'status' in e['error'] &&
    (typeof e['error']['status'] === 'number') &&
    'message' in e['error'] &&
    (typeof e['error']['message'] === 'string')
  );
};
