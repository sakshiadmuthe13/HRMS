import ImageKit from "imagekit";

// Initialize ImageKit only when all required env vars are present.
// If not present, export a safe stub so the server can start in dev without ImageKit configured.
let imagekit;
if (
  process.env.IMAGEKIT_PUBLIC_KEY &&
  process.env.IMAGEKIT_PRIVATE_KEY &&
  process.env.IMAGEKIT_URL_ENDPOINT
) {
  imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  });
} else {
  // Minimal stub: keeps signature similar to real ImageKit for upload/delete/url usage in code.
  const notConfiguredError = () =>
    new Error(
      'ImageKit not configured. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT in your .env'
    );

  imagekit = {
    upload: async () => {
      throw notConfiguredError();
    },
    deleteFile: async () => {
      throw notConfiguredError();
    },
    url: (options = {}) => {
      throw notConfiguredError();
    },
    // Keep a flag so other code can detect stub if needed
    _isStub: true,
  };
}

export default imagekit;