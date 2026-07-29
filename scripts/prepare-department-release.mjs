import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputArg = process.argv[2];

if (!outputArg) {
  console.error("Uso: node scripts/prepare-department-release.mjs <directory-output>");
  process.exit(1);
}

const output = path.resolve(outputArg);
const navigatorDist = path.join(root, "services", "navigator", "app", "dist");

if (!fs.existsSync(navigatorDist)) {
  console.error("Manca services/navigator/app/dist. Esegui prima npm run build in services/navigator/app.");
  process.exit(1);
}

const ignoredNames = new Set([".git", "node_modules", "dist", "coverage", ".cache", ".tanstack"]);
function copy(source, destination, { omitApiConfig = false } = {}) {
  fs.cpSync(source, destination, {
    recursive: true,
    filter: (entry) => {
      const name = path.basename(entry);
      // Se la sorgente è proprio una directory chiamata `dist`, la vogliamo
      // copiare: l'esclusione di `dist` vale solo per directory annidate nei
      // sorgenti consegnabili (non per il bundle del Navigator runtime).
      if (path.resolve(entry) === path.resolve(source)) return true;
      return !ignoredNames.has(name) && !(omitApiConfig && name === "api.config.json");
    },
  });
}

function copyFile(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

// L'output è volutamente un artefatto locale e rigenerabile: è sicuro
// cancellarlo solo quando è stato passato esplicitamente come argomento.
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

// Runtime per il container node-22 di gocker.
copyFile(path.join(root, "app", "server.js"), path.join(output, "server.js"));
copyFile(path.join(root, "app", "package.json"), path.join(output, "package.json"));
copyFile(path.join(root, "README.txt"), path.join(output, "README.txt"));
copy(path.join(root, "services", "backend", "app"), path.join(output, "backend"));
copyFile(path.join(root, "services", "backend", "package.json"), path.join(output, "backend", "package.json"));
copyFile(path.join(root, "services", "backend", "package-lock.json"), path.join(output, "backend", "package-lock.json"));
// Il server di dipartimento fornisce Node ma non npm. Installiamo quindi qui
// soltanto le dipendenze runtime del backend; restano fuori da source/.
const npmInvocation = process.platform === "win32"
  ? { command: process.env.ComSpec || "cmd.exe", args: ["/d", "/s", "/c", "npm.cmd ci --omit=dev"] }
  : { command: "npm", args: ["ci", "--omit=dev"] };
execFileSync(npmInvocation.command, npmInvocation.args, {
  cwd: path.join(output, "backend"),
  stdio: "inherit",
});
copy(navigatorDist, path.join(output, "frontends", "navigator"), { omitApiConfig: true });

for (const name of ["index.html", "app.js", "api.js", "constants.js"]) {
  copyFile(path.join(root, "services", "editor", "app", name), path.join(output, "frontends", "editor", name));
}
for (const name of ["components", "pages", "styles"]) {
  copy(path.join(root, "services", "editor", "app", name), path.join(output, "frontends", "editor", name));
}

// Sorgenti completi e leggibili richiesti dalla consegna, senza dipendenze.
copy(path.join(root, "app"), path.join(output, "source", "server-side", "main"));
copy(path.join(root, "services", "backend", "app"), path.join(output, "source", "server-side", "backend"));
copyFile(path.join(root, "services", "backend", "package.json"), path.join(output, "source", "server-side", "backend", "package.json"));
copyFile(path.join(root, "services", "backend", "package-lock.json"), path.join(output, "source", "server-side", "backend", "package-lock.json"));
copy(path.join(root, "services", "backend", "tests"), path.join(output, "source", "server-side", "backend", "tests"));
copy(path.join(root, "services", "navigator", "app"), path.join(output, "source", "navigator"), { omitApiConfig: true });
copy(path.join(root, "services", "editor", "app"), path.join(output, "source", "editor"));
copy(path.join(root, "services", "editor", "tests"), path.join(output, "source", "editor", "tests"));

const envExample = `# Copiare in .env sul sito. Non inviare questo file con valori reali.\nNODE_ENV=production\nPORT=8000\nMONGO_URI=mongodb://site252622:PASSWORD_URL_ENCODED@mongo_site252622:27017/artaround?authSource=admin\nJWT_SECRET=CAMBIA_CON_UN_SEGRETO_LUNGO\nJWT_EXPIRES_IN=8h\nSWAGGER_USER=swagger\nSWAGGER_PASSWORD=CAMBIA_CON_PASSWORD\nAPP_API_KEY=CAMBIA_CON_64_CARATTERI_ESADECI\nBOOTSTRAP_API_KEY=UGUALE_AD_APP_API_KEY\nMUSEUM_SLUG=galleria-degli-uffizi\nNAVIGATOR_EDITOR_URL=/editor\n`;
fs.writeFileSync(path.join(output, ".env.example"), envExample, "utf8");

console.log(`Release di dipartimento pronta in: ${output}`);
console.log("Contiene runtime, source leggibili e nessun node_modules/API key.");
