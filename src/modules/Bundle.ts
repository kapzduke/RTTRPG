import { BotManager } from "RTTRPG/@type";

namespace Bundle {
  export const langs = ["en", "ko"];
  export const bundles: Map<string, any> = new Map();
  export function find(lang: string, key: string) {
    return bundles.get(lang || "ko")[key];
  }
}

Bundle.langs.forEach((lang) =>
  Bundle.bundles.set(
    lang,
    BotManager.Database.readObject(`bundle_${lang}.json`)
  )
);

export default Bundle;
