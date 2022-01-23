import { Utils } from "RTTRPG/util";
import properties from "properties-reader";

const find = Bundle.find

namespace Bundle {
  export const bundles: Map<string, any> = new Map();
  export const langs: string[] = [ "en", "ko" ]
  export function find(lang: string = "ko", key: string) {
    return bundles.get(lang)[key];
  }
  
}

Bundle.langs.forEach((lang) => Bundle.bundles.set(lang, Utils.Database.readObject(`bundle_${lang}.json`)));


export default Bundle;
export { find };