import SDKAbstract, { SDKConfig } from "../../abstract/index";
import Utilities from "./utils";
import MediaPlayer from "./player.hls";
import DeviceStorage from "./storage";
export default class HTML5SDK extends SDKAbstract {
    static platform: string;
    static utils: Utilities;
    static player: typeof MediaPlayer;
    static storage: DeviceStorage;
    static init(config: SDKConfig): Promise<void>;
}
