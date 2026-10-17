const esbuild = require("esbuild");

async function build() {
  const isWatch = process.argv.includes("--watch");

  const buildOptions = {
    entryPoints: ["src/extension.ts"],
    bundle: true,
    outfile: "dist/extension.js",
    external: ["vscode"],
    format: "cjs",
    platform: "node",
    target: "node18",
    sourcemap: true,
    minify: !isWatch,
    logLevel: "info",
  };

  if (isWatch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log("Watching for changes...");
  } else {
    await esbuild.build(buildOptions);
    console.log("VS Code extension build completed successfully -> dist/extension.js");
  }
}

build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
