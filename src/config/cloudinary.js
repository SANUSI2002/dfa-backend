// src/config/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config(); // ✅ load .env before reading process.env

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Verify values actually loaded
const { cloud_name, api_key, api_secret } = cloudinary.config();
if (!cloud_name || !api_key || !api_secret) {
  logger.error('❌ Cloudinary credentials missing — check your .env file');
  process.exit(1); // stop server immediately instead of cryptic errors later
}

logger.info('✅ Cloudinary configured successfully');

export { cloudinary };