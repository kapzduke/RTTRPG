import PropertiesReader from "properties-reader";

import { Utils } from "RTTRPG/util";

namespace Bundle {
  export const bundles: Map<string, PropertiesReader.Reader> = new Map();
  export const langs: string[] = [ "en", "ko" ]
  export function find(lang: string = "ko", key: string): string {
    return String(bundles.get(lang)?.get(key));
  }
  export function format(lang: string = "ko", key: string, ...args: any[]) {
    return Utils.Strings.format(find(lang, key), args);
  }
}// 귀찮

Bundle.langs.forEach((lang) => Bundle.bundles.set(lang, PropertiesReader(`./assets/bundle_${lang}.properties`)));

export default Bundle;