import { parseChunked } from '@discoveryjs/json-ext';
import { createReadStream } from 'fs';

import { Stats } from '../types';

export const readStatsFile = async (filePath: string): Promise<Stats> => {
  return parseChunked(createReadStream(filePath));
};
