/**
 * Temporary workaround: disable persistent on-disk webpack cache in development
 * to avoid ENOENT rename errors from the PackFileCacheStrategy.
 * This sets webpack's cache to in-memory for dev to avoid races with file renames.
 * Remove this once the underlying filesystem/permission issue is resolved.
 */
/** @type {import('next').NextConfig} */
module.exports = {
  webpack: (config, { dev }) => {
    if (dev) {
      try {
        config.cache = { type: 'memory' };
      } catch (e) {
        // ignore
      }
    }
    return config;
  },
};
