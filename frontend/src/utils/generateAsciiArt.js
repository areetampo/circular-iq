/** Canvas-based image → ASCII art for production console banners (`logger.initArt`). */

const ASCII_CHARSETS = {
  standard: ' .,:;i1tfLCG08@',
};

/**
 * Generates ASCII art from an image source.
 *
 * @param {{ src: string, resolution?: number, charset?: string, inverted?: boolean, objectFit?: 'cover'|'contain' }} options - Image source and raster-to-character mapping options.
 * @param {string} options.src - Image source URL/path loaded into an anonymous browser `Image`.
 * @param {number} [options.resolution=100] - Horizontal character resolution; higher values increase detail and output size.
 * @param {string} [options.charset='standard'] - Charset preset name or custom brightness ramp such as `' .:-=+*#%@'`.
 * @param {boolean} [options.inverted=false] - Reverses brightness mapping so dark pixels use dense characters.
 * @param {'cover'|'contain'} [options.objectFit='cover'] - `cover` crops to fill ASCII bounds; `contain` preserves the full image with padding.
 * @returns {Promise<string>} Multiline ASCII art string mapped from source image brightness.
 */
export const generateAsciiArt = async (options) => {
  const {
    src,
    resolution = 100,
    charset = 'standard',
    inverted = false,
    objectFit = 'cover',
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.crossOrigin = 'anonymous';
    img.src = src;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      const resolvedCharset = ASCII_CHARSETS[charset] || charset;

      const effectiveCharset = inverted
        ? resolvedCharset.split('').reverse().join('')
        : resolvedCharset;

      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      const imgAspect = imgWidth / imgHeight;

      // Compensates for monospace character proportions.
      const charAspectRatio = 0.55;

      const cols = resolution;
      const rows = Math.floor(cols * charAspectRatio);

      canvas.width = cols;
      canvas.height = rows;

      // Target visual aspect ratio.
      const visualAspect = 1.0;

      let sx = 0;
      let sy = 0;
      let sw = imgWidth;
      let sh = imgHeight;

      // Crop image to fill output area.
      if (objectFit === 'cover') {
        if (imgAspect > visualAspect) {
          sw = imgHeight * visualAspect;
          sx = (imgWidth - sw) / 2;
        } else {
          sh = imgWidth / visualAspect;
          sy = (imgHeight - sh) / 2;
        }
      }

      // Fit entire image inside output area.
      else if (objectFit === 'contain') {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, cols, rows);

        let dw;
        let dh;
        let dx;
        let dy;

        if (imgAspect > visualAspect) {
          dw = cols;
          dh = (cols / imgAspect) * charAspectRatio;
          dx = 0;
          dy = (rows - dh) / 2;
        } else {
          dh = rows;
          dw = (rows * imgAspect) / charAspectRatio;
          dx = (cols - dw) / 2;
          dy = 0;
        }

        ctx.drawImage(img, dx, dy, dw, dh);
      }

      if (objectFit !== 'contain') {
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
      }

      let imageData;

      try {
        imageData = ctx.getImageData(0, 0, cols, rows);
      } catch {
        reject(new Error('Unable to read image data'));
        return;
      }

      const data = imageData.data;
      const result = [];

      // Convert pixels into ASCII characters.
      for (let y = 0; y < rows; y++) {
        let row = '';

        for (let x = 0; x < cols; x++) {
          const idx = (y * cols + x) * 4;

          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          // Perceived luminance calculation.
          const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

          const adjustedBrightness = a === 0 ? 0 : brightness;

          const charIndex = Math.floor(adjustedBrightness * (effectiveCharset.length - 1));

          row += effectiveCharset[charIndex] || ' ';
        }

        result.push(row);
      }

      resolve(result.join('\n'));
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image: ${src}`));
    };
  });
};
