export type ImageStorageType = 'local' | 's3';

export interface ImageConfig {
  storage: ImageStorageType;
  localPath: string;
  compress: boolean;
}

import * as os from 'os';
import * as path from 'path';

const defaultDocumentsPath = path.join(__dirname, '../../uploads');

export const imageConfig: ImageConfig = {
  storage: 'local', // 'local' eller 's3'
  localPath: process.env.IMAGE_UPLOAD_PATH || defaultDocumentsPath, // Sökväg för lokala bilder
  compress: true // Komprimera bilder vid uppladdning
};
