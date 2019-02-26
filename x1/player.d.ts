import { MediaPlayerInterface, PlayerOptions, PlayerDRMOptions, PlayerExternalSubitleTrack, PlayerTrack, PLAYER_ASPECTRATIO } from "../../interface/player";
import AbstractMediaPlayer from "../../abstract/player";
/**
 * Class for playback of content
 */
export default class CoreMediaPlayer extends AbstractMediaPlayer implements MediaPlayerInterface {
    /**
     * Instantiates a new player instance
     */
    constructor(options: PlayerOptions, callback?: any);
    /**
     * Create player DOM object
     */
    createPlayerElement(playerId: string, parentId: string, mime: string): HTMLElement;
    /**
     * Remove player from DOM
     */
    removePlayerElement(): void;
    /**
     * Return player DOM node
     */
    getEl(): HTMLMediaElement | undefined;
    /**
     * Destroy the media object
     */
    destroy(): void;
    /**
     * Attach player events
     */
    setupListener(): void;
    onError(event: Event): void;
    /**
     * Remove the attached player events
     */
    removeListener(): void;
    /**
     * Play the media
     */
    play(time?: number): boolean;
    /**
     * Stop the media
     */
    stop(): boolean;
    /**
     * Pause the media
     */
    pause(): boolean;
    /**
     * Skip forward in time of video
     */
    skipForward(time?: number): boolean;
    /**
     * Skip backward in time of video
     */
    skipBackward(time?: number): boolean;
    /**
     * Get/set the current playback time
     */
    currentTime: number;
    /**
     * Get content duration in seconds
     */
    readonly duration: number;
    /**
     * Return buffered (downloaded) position
     */
    readonly bufferedTime: number | undefined;
    /**
     * Get/set volume level of media  [0-100] abox uses 1-31
     */
    volume: number;
    /**
     * Get/set mute state of media
     */
    muted: boolean;
    /**
     * Helper methods CSS positioning
     */
    private getPlayerCSSProperty;
    private setPlayerCSSProperty;
    /**
     * Get/set media window left alignment
     */
    left: number;
    /**
     * set/get media window top alignment
     */
    top: number;
    /**
     * set media window top alignment
     */
    width: number;
    /**
     * set media window top alignment
     */
    height: number;
    /**
     * load the stream and fetch metadata
     */
    load(): void;
    /**
     * set media source url
     */
    /**
    *  get media source url
    */
    src: string;
    /**
     * set autoplay state of media element returns bool
     */
    autoplay: boolean;
    /**
     * set toggle loop state of media element returns bool
     */
    loop: boolean;
    /**
     *  set/get playback speed, speed is an index value targeting the speedstep array
     */
    playbackSpeed: number;
    /**
     * set mime type of media source
     */
    /**
    *  get mime type of media source
    */
    mime: string;
    /**
     * Set the video aspect ratio, options: original, zoom, full
     */
    aspectRatio(aspectType: PLAYER_ASPECTRATIO): void;
    /**
     * provide drm properties
     */
    drm(config: PlayerDRMOptions): void;
    /**
     * Get/set audio track
     */
    audioTrack: PlayerTrack;
    /**
     * Get all audio tracks
     */
    allAudioTracks(): PlayerTrack[];
    /**
     * Get/set disable/enable subtitle
     */
    subtitleActive: boolean;
    /**
     * Get/set subtitle track
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
    /**
     * Gets the available bitrate in bps (bit per second)
     */
    getAvailableBitrates(): number[];
    /**
     * Get video width of active stream
     */
    getVideoWidth(): number;
    /**
     * Get video height of active stream
     */
    getVideoHeight(): number;
    /**
     * Gets the current video bitrate in bps (bit per second)
     */
    getCurrentBitrate(): number;
    /**
     * Gets the current video bitrate in bps (bit per second)
     */
    getCurrentAudioBitrate(): number;
}
