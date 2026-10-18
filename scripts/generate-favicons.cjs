const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Exact BugMark matching src/components/brand/BugMark.tsx
// Centered with generous breathing room, rounded squircle corners, dark contrast badge
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <!-- Rounded corner dark container badge (squircle matching website aesthetics) -->
  <rect x="2" y="2" width="60" height="60" rx="15" fill="#09090b" stroke="#27272a" stroke-width="2"/>
  
  <!-- Centered BugMark with comfortable padding (does not touch or attach to border) -->
  <!-- Bug bounds: x=5 to 27 (width 22), y=7.5 to 26 (height 18.5), center (16, 16.75) -->
  <g transform="translate(32, 32) scale(1.18) translate(-16, -16.75)">
    <!-- Antennae -->
    <path
      d="M11 7.5 13.5 10M21 7.5 18.5 10"
      stroke="#ffffff"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <!-- Body with rounded corners matching website BugMark rx=6 -->
    <rect x="10" y="10" width="12" height="16" rx="6" fill="#ffffff"/>
    <!-- Legs (3 pairs) -->
    <path
      d="M10 15H5M10 20H6M22 15h5M22 20h4"
      stroke="#ffffff"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <!-- Central core circle cutout matching dark background -->
    <circle cx="16" cy="16" r="2.2" fill="#09090b"/>
  </g>
</svg>
`;

async function main() {
  const publicDir = path.resolve(__dirname, '../public');
  
  // 1. Write the pristine master SVG
  const svgPath = path.join(publicDir, 'favicon.svg');
  fs.writeFileSync(svgPath, svgContent, 'utf-8');
  console.log('Created favicon.svg');

  const svgBuffer = Buffer.from(svgContent);

  // 2. Render razor-sharp PNGs at standard sizes
  const sizes = [
    { name: 'favicon-48x48.png', size: 48 },
    { name: 'favicon-96x96.png', size: 96 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
  ];

  for (const s of sizes) {
    const dest = path.join(publicDir, s.name);
    await sharp(svgBuffer, { density: 300 })
      .resize(s.size, s.size, { kernel: sharp.kernel.lanczos3 })
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(dest);
    console.log(`Generated ${s.name} (${s.size}x${s.size})`);
  }

  // 3. Generate a multi-resolution ICO file (16, 32, 48) containing PNG streams
  const icoSizes = [16, 32, 48];
  const pngBuffers = [];
  for (const size of icoSizes) {
    const buf = await sharp(svgBuffer, { density: 300 })
      .resize(size, size, { kernel: sharp.kernel.lanczos3 })
      .png({ quality: 100 })
      .toBuffer();
    pngBuffers.push({ size, buffer: buf });
  }

  // Build standard binary ICO format
  // Header: 6 bytes (Reserved 0, Type 1 for ICO, Count)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(pngBuffers.length, 4);

  // Directory entries: 16 bytes per image
  let offset = 6 + 16 * pngBuffers.length;
  const dirEntries = [];
  for (const img of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.size === 256 ? 0 : img.size, 0); // Width
    entry.writeUInt8(img.size === 256 ? 0 : img.size, 1); // Height
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // Image size in bytes
    entry.writeUInt32LE(offset, 12); // Offset to image data
    dirEntries.push(entry);
    offset += img.buffer.length;
  }

  const icoBuffer = Buffer.concat([
    header,
    ...dirEntries,
    ...pngBuffers.map((p) => p.buffer),
  ]);

  const icoPath = path.join(publicDir, 'favicon.ico');
  fs.writeFileSync(icoPath, icoBuffer);
  console.log(`Generated multi-resolution favicon.ico (${icoBuffer.length} bytes)`);

  console.log('All favicon assets generated with perfection.');
}

main().catch(console.error);
