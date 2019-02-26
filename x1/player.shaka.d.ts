import { MediaPlayerInterface, PlayerOptions, PlayerDRMOptions, PlayerExternalSubitleTrack, PlayerTrack } from "../../interface/player";
import CoreMediaPlayer from "./player";
/**
 * Class for playback of content
 */
export default class ShakaMediaPlayer extends CoreMediaPlayer implements MediaPlayerInterface {
    private $shakaInstance;
    private useShakaPlayer;
    init(options: PlayerOptions): void;
    /**
     * Load the stream and fetch metadata
     */
    load(): void;
    destroy(): void;
    /**
     * Set media source url
     */
    private _streamURL;
    /**
    * Get media source url
    */
    src: string;
    /**
     * Get mime type of media source
     */
    private _streamMIME;
    /**
    * Set mime type of media source
    */
    mime: string;
    /**
     * Provide DRM properties
     */
    drm(config: PlayerDRMOptions): void;
    /**
     * Set audio track
     */
    audioTrack: PlayerTrack;
    /**
     * Get all audio tracks
     */
    allAudioTracks(): PlayerTrack[];
    /**
     * Set disable/enable subtitle
     */
    /**
    * Get disable/enable subtitle
    */
    subtitleActive: boolean;
    /**
     * Set subtitle track
     */
    subtitleTrack: PlayerTrack;
    /**
     * Get all subtitle tracks
     */
    allSubtitleTracks(): PlayerTrack[];
    /**
     * Sets the external captions
     */
    setExternalSubtitles(textTracks: PlayerExternalSubitleTrack[]): void;
}
