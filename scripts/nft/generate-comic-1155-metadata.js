const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith("--")) continue;
    const key = argv[i].slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    args[key] = value;
  }
  return args;
}

function walkImages(root) {
  const results = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) results.push(...walkImages(absolute));
    else if (IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) results.push(absolute);
  }
  return results.sort((a, b) => a.localeCompare(b));
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function slug(filename) {
  return filename
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputDir = path.resolve(args.input || "docs/visuals");
  const outputDir = path.resolve(args.output || "build/comic-1155-metadata");
  const imageBaseURI = String(args["image-base-uri"] || "").replace(/\/$/, "");

  if (!fs.existsSync(inputDir)) throw new Error(`Input directory not found: ${inputDir}`);
  if (!imageBaseURI.startsWith("ipfs://")) {
    throw new Error("--image-base-uri must be an immutable ipfs:// URI");
  }

  const images = walkImages(inputDir);
  if (images.length === 0) throw new Error(`No comic images found in ${inputDir}`);

  fs.mkdirSync(outputDir, { recursive: true });
  const manifest = images.map((file, index) => {
    const relativePath = path.relative(inputDir, file).split(path.sep).join("/");
    const filename = path.basename(file);
    const tokenNumber = index + 1;
    const metadata = {
      name: `MyZubster Comic #${String(tokenNumber).padStart(3, "0")} — ${path.parse(filename).name}`,
      description: "A visual from the MyZubster Comic Universe. NFT ownership does not transfer copyright or other intellectual-property rights unless separate terms state otherwise.",
      image: `${imageBaseURI}/${relativePath}`,
      external_url: "https://www.myzubster.com/fumetto",
      attributes: [
        { trait_type: "Collection", value: "MyZubster Comic Universe" },
        { trait_type: "Edition", value: "Genesis" },
        { trait_type: "Source SHA-256", value: sha256(file) },
      ],
    };
    const metadataFilename = `${String(tokenNumber).padStart(3, "0")}-${slug(filename)}.json`;
    fs.writeFileSync(path.join(outputDir, metadataFilename), `${JSON.stringify(metadata, null, 2)}\n`);
    return { tokenNumber, source: relativePath, metadataFile: metadataFilename, amount: 1 };
  });

  fs.writeFileSync(
    path.join(outputDir, "manifest.json"),
    `${JSON.stringify({ schemaVersion: 1, imageBaseURI, items: manifest }, null, 2)}\n`,
  );

  console.log(`Generated ${manifest.length} metadata files in ${outputDir}`);
  console.log("Next: pin this directory to IPFS, then pass its CID to mint-comic-1155-batch.js.");
}

if (require.main === module) main();

module.exports = { parseArgs, walkImages, sha256, slug };
