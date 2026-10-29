import type { AIR_X_MODELS } from '../content.config';

type AirXModel = (typeof AIR_X_MODELS)[number];

const CATALOG_URL = 'https://www.hydac.com/media/local_resources_usa/downloads/catalog/filters/pdfs';

/** Each Air-X model's catalog PDF. */
export const AIR_X_CATALOG: Record<AirXModel, string> = {
  'RFB Compact': `${CATALOG_URL}/rfb_compact.pdf`,
  RFB: `${CATALOG_URL}/rfb.pdf`,
  'RFT Compact': `${CATALOG_URL}/rft_compact.pdf`,
  RFT: `${CATALOG_URL}/rft.pdf`
};
