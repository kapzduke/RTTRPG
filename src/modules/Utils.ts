namespace Utils {
  export class Mathf {
    public static range(from: number, to: number) {
      return from + Math.random() * (to - from);
    }

    public static randbool(pred: number = 0.5) {
      return Math.random() < pred;
    }

    public static static(value: number, min: number, max: number) {
      if (value > max) return max;
      else if (value < min) return min;
      else return value;
    }

    public static round(target: number, step: number = 0) {
      return Math.round(target * Math.pow(10, step)) / Math.pow(10, step);
    }
  }

  export class Strings {
    public static format(string: string, args: any[] | any) {
      if(Array.isArray(args)) args.forEach((a) => {
        while (string.includes("{" + a + "}"))
          return string.replace("{" + a + "}", args[a]);
      });
      else string.replace("{0}", args);
      return string;
    }
  }
}
export default Utils;
