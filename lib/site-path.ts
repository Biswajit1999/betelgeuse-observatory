const SITE_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function siteAsset(path: `/${string}`) {
  return `${SITE_BASE_PATH}${path}`;
}
