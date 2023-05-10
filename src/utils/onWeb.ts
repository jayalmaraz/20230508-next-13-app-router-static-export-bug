import { isWeb } from './isWeb';

export function onWeb<F>(callback: F) {
  if (isWeb) {
    return callback;
  }
  return undefined;
}
