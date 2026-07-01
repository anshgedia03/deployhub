/**
 * Builds a URL by replacing path parameters and appending a module prefix.
 * @param endpoint The endpoint string (e.g., '/user/:id')
 * @param pathParams Object containing path parameters (e.g., { id: '123' })
 * @param module The module prefix (e.g., 'v1')
 * @returns The formatted URL
 */
export const buildUrl = (
  endpoint: string,
  pathParams: Record<string, string> = {},
  module?: string
): string => {
  let url = endpoint;

  Object.entries(pathParams).forEach(([key, value]) => {
    url = url.replace(`:${key}`, encodeURIComponent(value));
  });
  if (!url.startsWith('/')) {
    url = `/${url}`;
  }

  if (module) {
    const cleanModule = module.startsWith('/') ? module : `/${module}`;
    url = `${cleanModule}${url}`;
  }

  return url;
};
