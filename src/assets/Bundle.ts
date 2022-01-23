import properties from "properties-reader";

import { Utils } from "RTTRPG/util";

namespace Bundle {
  export const bundles: Map<string, any> = new Map();
  export const langs: string[] = [ "en", "ko" ]
  export function find(lang: string = "ko", key: string) {
    return bundles.get(lang)[key];
  }
  
}// 귀찮

Bundle.langs.forEach((lang) => Bundle.bundles.set(lang, Utils.Database.readObject(`./assets/bundle_${lang}.json`)));

export default Bundle;