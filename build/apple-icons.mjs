import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const root = process.cwd();

const canvasSize = 1024;

// Measured from current macOS/Electron app icons such as VS Code/Bitwarden:
// their opaque rounded-rect body is 824px inside a 1024px transparent canvas.
const bodySize = 824;
const bodyOffset = Math.round((canvasSize - bodySize) / 2);
const bodyRadius = 184;

const logoSize = 620;
const outputSizes = [16, 32, 64, 128, 256, 512, 1024];

const variants = [
	{
		name: "release",
		sourceDir: ".output/safari-mv2/icons",
		outputDir: ".output/apple-app-icons/safari-mv2/icons",
	},
	{
		name: "debug",
		sourceDir: ".output/safari-mv2-dev/icons",
		outputDir: ".output/apple-app-icons/safari-mv2-dev/icons",
	},
];

function abs(relativePath) {
	return path.join(root, relativePath);
}

function backgroundSvg() {
	return Buffer.from(`
<svg width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="155%" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="22" stdDeviation="19" flood-color="#000000" flood-opacity="0.20"/>
    </filter>
  </defs>
  <rect x="${bodyOffset}" y="${bodyOffset}" width="${bodySize}" height="${bodySize}" rx="${bodyRadius}" ry="${bodyRadius}" fill="#ffffff" filter="url(#shadow)"/>
</svg>`);
}

async function makeLogo(sourcePath) {
	const logo = sharp(sourcePath)
		.ensureAlpha()
		.trim({
			background: { r: 0, g: 0, b: 0, alpha: 0 },
			threshold: 8,
		})
		.resize({
			width: logoSize,
			height: logoSize,
			fit: "inside",
			withoutEnlargement: false,
		})
		.png();

	const buffer = await logo.toBuffer();
	const metadata = await sharp(buffer).metadata();

	return {
		buffer,
		left: Math.round((canvasSize - metadata.width) / 2),
		top: Math.round((canvasSize - metadata.height) / 2),
	};
}

async function makeMaster(sourcePath) {
	const logo = await makeLogo(sourcePath);

	return sharp({
		create: {
			width: canvasSize,
			height: canvasSize,
			channels: 4,
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		},
	})
		.composite([
			{ input: backgroundSvg(), left: 0, top: 0 },
			{ input: logo.buffer, left: logo.left, top: logo.top },
		])
		.png()
		.toBuffer();
}

async function writeVariant(variant) {
	const sourcePath = abs(path.join(variant.sourceDir, "1024.png"));
	const outputDir = abs(variant.outputDir);
	const master = await makeMaster(sourcePath);

	await mkdir(outputDir, { recursive: true });

	await Promise.all(
		outputSizes.map((size) =>
			sharp(master)
				.resize(size, size, {
					fit: "contain",
					kernel: sharp.kernel.lanczos3,
				})
				.png()
				.toFile(path.join(outputDir, `${size}.png`)),
		),
	);

	console.log(
		`generated ${variant.outputDir} from ${variant.sourceDir} ` +
			`(body ${bodySize}/${canvasSize}, logo ${logoSize}/${canvasSize})`,
	);
}

await Promise.all(variants.map(writeVariant));
