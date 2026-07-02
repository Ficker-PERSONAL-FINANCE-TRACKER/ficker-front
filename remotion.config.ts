import { Config } from "@remotion/cli/config";
import { enableScss } from "@remotion/enable-scss";
import CopyPlugin from "copy-webpack-plugin";
import path from "path";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setChromiumOpenGlRenderer("angle");

Config.overrideWebpackConfig((currentConfig) => {
  const config = enableScss(currentConfig);
  const shim = (file: string) => path.join(process.cwd(), "remotion", "shims", file);

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      // Copia a pasta public/ real do app para a raiz do bundle, para que os
      // componentes reais (que usam caminhos absolutos como /icons/... e /logo.png)
      // encontrem os assets. (staticFile usa /public/..., mas o app usa /...)
      new CopyPlugin({
        patterns: [{ from: "public", to: ".", context: process.cwd() }],
      }),
    ],
    resolve: {
      ...config.resolve,
      alias: {
        ...(config.resolve?.alias ?? {}),
        // alias do app real
        "@": path.join(process.cwd(), "src"),
        // shims para APIs exclusivas do Next
        "next/image": shim("next-image.tsx"),
        "next/link": shim("next-link.tsx"),
        "next/navigation": shim("next-navigation.ts"),
        "next/font/google": shim("next-font-google.ts"),
      },
    },
  };
});
