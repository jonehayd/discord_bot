import { readdirSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";

async function loadSubcommands(directory) {
  const subcommands = new Map();

  const files = readdirSync(directory).filter(
    (f) => f.endsWith(".js") && f !== "index.js",
  );

  for (const file of files) {
    const filePath = join(directory, file);
    const subcommand = (await import(pathToFileURL(filePath).href)).default;

    if (subcommand?.data && typeof subcommand.execute === "function") {
      subcommands.set(subcommand.data.name, subcommand);
    } else {
      console.warn(`[WARN] Skipping invalid subcommand: ${file}`);
    }
  }

  const addToBuilder = (builder) => {
    for (const subcommand of subcommands.values()) {
      builder.addSubcommand(subcommand.data);
    }
    return builder;
  };

  return { subcommands, addToBuilder };
}

export { loadSubcommands };
