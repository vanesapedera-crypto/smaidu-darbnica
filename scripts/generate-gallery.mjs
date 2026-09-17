import fs from "fs";
import path from "path";

const base = "./public/images/programs";
const output = "./src/data/galleries.ts";

const exts = [".jpg", ".jpeg", ".png", ".webp"];

const galleries = {};

for (const folder of fs.readdirSync(base)) {
  const folderPath = path.join(base, folder);

  if (!fs.statSync(folderPath).isDirectory()) continue;

  const files = fs
    .readdirSync(folderPath)
    .filter((f) => exts.includes(path.extname(f).toLowerCase()))
    .map((f) => `/images/programs/${folder}/${f}`);

  galleries[folder] = files;
}

const text =
`export const galleries = ${JSON.stringify(galleries, null, 2)} as const;
`;

fs.writeFileSync(output, text);

console.log("✅ Galerijas izveidotas!");