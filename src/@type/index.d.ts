export declare namespace BotManager {
    export class Message {
        public room: string;
        public content: string;
        public isGroupChat: boolean;
        public author: {
            avatar: {
                getBase64: function();
            }
        }
        public reply(content: string);
    }

    export class JavaPackage {
        public static readonly java = {
            lang: {
                String(string: string) : {
                    hashCode: function(): number;
                }
            }
        }
    }

    export class Database {
        public static writeObject(fileName: string, obj: any): void;
        public static readObject(fileName: string): any;
        public static readObject <T> (fileName: string): T {
            return this.readObject(filename) as T;
        }
        
        public static writeString(fileName: string, data: string)
    }

    export class Bot {
        public send(room: String, msg: String, packageName: String = null);
        public addListener(eventName: String, listene: Fuction);
    }

    export function getCurrentBot(): Bot;
}
