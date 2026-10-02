/**
 * Attēlu optimizācija.
 *
 * Ņem oriģinālās fotogrāfijas no `media-src/<albums>/` un izveido:
 *   - public/media/<albums>/<albums>-NN.webp  (garākā mala ≤ 2400 px, WebP q82)
 *   - src/data/media.json                     (izmēri + blur priekšskatījums katram attēlam)
 *
 * Albumu nosaukumus un kategorijas apraksta scripts/media-albums.json.
 * Palaišana:  npm run images
 *
 * Next.js <Image> pēc tam automātiski pasniedz katram ekrānam piemērota izmēra
 * AVIF/WebP versiju, tāpēc šeit mērķis ir tikai saprātīgs "master" fails.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "media-src");
const OUT = path.join(ROOT, "public", "media");
const MANIFEST = path.join(ROOT, "src", "data", "media.json");
const config = JSON.parse(
  fs.readFileSync(path.join(ROOT, "scripts", "media-albums.json"), "utf8")
);

const MAX_SIDE = 2400;
const QUALITY = 82;
const isImage = (f) => /\.(jpe?g|png|webp|avif|heic)$/i.test(f);

async function processAlbum(slug, meta) {
  const srcDir = path.join(SRC, slug);
  const outDir = path.join(OUT, slug);
  fs.mkdirSync(outDir, { recursive: true });

  const files = fs.readdirSync(srcDir).filter(isImage).sort();
  const images = [];

  for (const [i, file] of files.entries()) {
    // Ciparu failu nosaukumi (01.jpg) saglabā savu numuru, lai adreses nemainītos,
    // ja kādu bildi izdzēš; citādi attēli tiek numurēti pēc kārtas.
    const base = path.parse(file).name;
    const name = meta.keepNames
      ? base
      : `${slug}-${/^\d+$/.test(base) ? base.padStart(2, "0") : String(i + 1).padStart(2, "0")}`;
    const target = path.join(outDir, `${name}.webp`);

    // .rotate() piemēro EXIF orientāciju, lai telefonu bildes nebūtu apgrieztas
    const pipeline = sharp(path.join(srcDir, file))
      .rotate()
      .resize(MAX_SIDE, MAX_SIDE, { fit: "inside", withoutEnlargement: true });

    const { width, height } = await pipeline
      .clone()
      .webp({ quality: QUALITY, effort: 5 })
      .toFile(target);

    // 16px priekšskatījums, ko <Image placeholder="blur"> rāda, kamēr ielādējas attēls
    const tiny = await pipeline
      .clone()
      .resize(16, 16, { fit: "inside" })
      .webp({ quality: 40 })
      .toBuffer();

    images.push({
      src: `/media/${slug}/${name}.webp`,
      width,
      height,
      blur: `data:image/webp;base64,${tiny.toString("base64")}`,
    });
  }

  return { slug, title: meta.title, category: meta.category, hidden: !!meta.hidden, images };
}

// Albumi, kuru oriģināli nav media-src mapē, tiek paturēti no esošā manifesta,
// tāpēc skriptu var droši palaist, pievienojot tikai jaunu albumu.
const previous = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")).albums : [];

const albums = [];
for (const [slug, meta] of Object.entries(config.albums)) {
  if (!fs.existsSync(path.join(SRC, slug))) {
    const kept = previous.find((a) => a.slug === slug);
    if (kept) albums.push({ ...kept, title: meta.title, category: meta.category, hidden: !!meta.hidden });
    else console.warn(`⚠️  Nav mapes media-src/${slug} — izlaižu`);
    continue;
  }
  const album = await processAlbum(slug, meta);
  albums.push(album);
  console.log(`✓ ${slug}: ${album.images.length}`);
}

fs.writeFileSync(
  MANIFEST,
  JSON.stringify({ categories: config.categories, albums }, null, 1) + "\n"
);
console.log(`\nManifests: ${path.relative(ROOT, MANIFEST)}`);
