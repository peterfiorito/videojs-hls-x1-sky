"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var player_1 = require("../../interface/player");
var player_2 = require("./player");
var Logger = require("js-logger");
var storage_1 = require("./storage");
var shaka = require("shaka-player");
shaka.media.ManifestParser.registerParserByMime("application/octet-stream", shaka.dash.DashParser);
shaka.polyfill.installAll();
var ROBUSTNESS;
(function (ROBUSTNESS) {
    ROBUSTNESS["HW_SECURE_ALL"] = "HW_SECURE_ALL";
    ROBUSTNESS["HW_SECURE_DECODE"] = "HW_SECURE_DECODE";
    ROBUSTNESS["HW_SECURE_CRYPTO"] = "HW_SECURE_CRYPTO";
    ROBUSTNESS["SW_SECURE_DECODE"] = "SW_SECURE_DECODE";
    ROBUSTNESS["SW_SECURE_CRYPTO"] = "SW_SECURE_CRYPTO";
})(ROBUSTNESS || (ROBUSTNESS = {}));
/**
 * Class for playback of content
 */
var ShakaMediaPlayer = /** @class */ (function (_super) {
    __extends(ShakaMediaPlayer, _super);
    function ShakaMediaPlayer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ShakaMediaPlayer.prototype.useShakaPlayer = function (options) {
        // Return support based on mime type, currently shaka only supports
        // HLS and DASH video content
        switch (options.mime) {
            // HLS
            case "application/x-mpegURL":
            case "application/vnd.apple.mpegurl":
                return true;
            // DASH
            case "video/vnd.mpeg.dash.mpd":
            case "application/dash+xml":
                return true;
            // any other format
            default:
                return false;
        }
    };
    ShakaMediaPlayer.prototype.init = function (options) {
        // Check if we should initiate shaka
        if (this.useShakaPlayer(options)) {
            // Initiate shaka
            this.$shakaInstance = new shaka.Player(this.getEl());
            // Set prefered audio language
            var storage = new storage_1.default();
            var preferredAudioLanguage = storage.getItem(player_1.PLAYER_STORAGE_KEYS.STORAGE_AUDIO_LANGUAGE);
            if (preferredAudioLanguage) {
                this.$shakaInstance.configure({
                    preferredAudioLanguage: preferredAudioLanguage,
                });
            }
        }
        _super.prototype.init.call(this, options);
    };
    /**
     * Load the stream and fetch metadata
     */
    ShakaMediaPlayer.prototype.load = function () {
        if (this.$shakaInstance) {
            // Load video in shaka player
            this.$shakaInstance.load(this.src, this.options.time || 0).catch(function (error) {
                Logger.info("PLAYER: error", error);
                ShakaMediaPlayer.eventbus.trigger("player-onError", error);
            });
        }
        else {
            _super.prototype.load.call(this);
        }
    };
    ShakaMediaPlayer.prototype.destroy = function () {
        if (this.$shakaInstance) {
            this.$shakaInstance.destroy();
        }
        _super.prototype.destroy.call(this);
    };
    Object.defineProperty(ShakaMediaPlayer.prototype, "src", {
        /**
         * Get media source url
         */
        get: function () {
            if (this.$shakaInstance) {
                return this._streamURL;
            }
            else {
                var playerElem = this.getEl();
                if (playerElem) {
                    return playerElem.currentSrc;
                }
                else {
                    return "";
                }
            }
        },
        set: function (streamURL) {
            Logger.info("PLAYER: SRC - " + streamURL);
            if (this.$shakaInstance) {
                this._streamURL = streamURL;
            }
            else {
                var playerElem = this.getEl();
                if (playerElem) {
                    var sourceElements = playerElem.getElementsByTagName("source");
                    if (sourceElements.length > 0) {
                        sourceElements[0].setAttribute("src", streamURL);
                    }
                }
            }
            // init stream
            this.load();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ShakaMediaPlayer.prototype, "mime", {
        get: function () {
            if (this.$shakaInstance) {
                return this._streamMIME;
            }
            else {
                var playerElem = this.getEl();
                if (playerElem) {
                    var sourceElements = playerElem.getElementsByTagName("source");
                    if (sourceElements.length > 0) {
                        return sourceElements[0].getAttribute("mime") || "";
                    }
                    else {
                        return "";
                    }
                }
                else {
                    return "";
                }
            }
        },
        /**
         * Set mime type of media source
         */
        set: function (mimeType) {
            Logger.info("PLAYER: MIME - " + mimeType);
            if (this.$shakaInstance) {
                this._streamMIME = mimeType;
            }
            else {
                var playerElem = this.getEl();
                if (playerElem) {
                    var sourceElements = playerElem.getElementsByTagName("source");
                    if (sourceElements.length > 0) {
                        sourceElements[0].setAttribute("mime", mimeType);
                    }
                }
            }
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Provide DRM properties
     */
    ShakaMediaPlayer.prototype.drm = function (config) {
        Logger.info("PLAYER: drm - ", config);
        if (this.$shakaInstance) {
            switch (config.type) {
                case player_1.DRM_TYPES.PLAYREADY:
                    this.$shakaInstance.configure({
                        drm: {
                            servers: {
                                "com.microsoft.playready": this.options.drm.parameters.playReadyInitiatorUrl
                            },
                        }
                    });
                    break;
                case player_1.DRM_TYPES.WIDEVINE:
                    this.$shakaInstance.configure({
                        drm: {
                            servers: {
                                "com.widevine.alpha": this.options.drm.parameters.widevineInitiatorUrl
                            },
                            advanced: {
                                "com.widevine.alpha": {
                                    "videoRobustness": ROBUSTNESS.SW_SECURE_CRYPTO,
                                    "audioRobustness": ROBUSTNESS.SW_SECURE_CRYPTO,
                                    "serverCertificate": shaka.util.Uint8ArrayUtils.fromBase64("")
                                }
                            }
                        }
                    });
                    break;
            }
            // Add network binding for custom data token
            if (config.parameters.customData)
                this.$shakaInstance.getNetworkingEngine().registerRequestFilter(function (type, request) {
                    // Only add headers to license requests:
                    if (type == shaka.net.NetworkingEngine.RequestType.LICENSE) {
                        // This is the specific header name and value the server wants:
                        request.headers["licenseRequestToken"] = config.parameters.customData;
                    }
                });
        }
        else {
            return _super.prototype.drm.call(this, config);
        }
    };
    Object.defineProperty(ShakaMediaPlayer.prototype, "audioTrack", {
        get: function () {
            var track = {
                language: "",
                index: 0
            };
            if (this.$shakaInstance) {
                var variant = this.$shakaInstance.getVariantTracks().find(function (track) { return track.active; });
                if (variant) {
                    track = {
                        language: variant.language
                    };
                }
            }
            else {
                var playerElem = this.getEl();
                if (playerElem) {
                    var tracks = playerElem.audioTracks || [];
                    for (var i = 0; i < tracks.length; i++) {
                        var audioTrack = tracks[i];
                        if (audioTrack.enabled) {
                            track = {
                                language: audioTrack.language,
                                index: i
                            };
                        }
                    }
                }
            }
            return track;
        },
        /**
         * Set audio track
         */
        set: function (track) {
            Logger.info("PLAYER: audioTrack track - ", track);
            var storage = new storage_1.default();
            storage.setItem(player_1.PLAYER_STORAGE_KEYS.STORAGE_AUDIO_LANGUAGE, track.language);
            if (this.$shakaInstance) {
                var languages = this.$shakaInstance.getAudioLanguages() || [];
                if (track.index !== undefined) {
                    this.$shakaInstance.selectAudioLanguage(languages[track.index]);
                }
                else {
                    for (var i = 0; i < languages.length; i++) {
                        var language = languages[i];
                        if (language === track.language) {
                            this.$shakaInstance.selectAudioLanguage(language);
                        }
                    }
                }
            }
            else {
                var playerElem = this.getEl();
                if (playerElem) {
                    var tracks = playerElem.audioTracks || [];
                    if (track.index !== undefined) {
                        playerElem.audioTracks[track.index].enabled = true;
                    }
                    else {
                        for (var i = 0; i < tracks.length; i++) {
                            var audiotrack = tracks[i];
                            if (audiotrack.language === track.language) {
                                tracks[i].enabled = true;
                            }
                        }
                    }
                }
            }
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Get all audio tracks
     */
    ShakaMediaPlayer.prototype.allAudioTracks = function () {
        var result = [];
        if (this.$shakaInstance) {
            var languages = this.$shakaInstance.getAudioLanguages() || [];
            for (var i = 0; i < languages.length; i++) {
                var language = languages[i];
                result.push({
                    language: language,
                    index: i
                });
            }
        }
        else {
            result = _super.prototype.allAudioTracks.call(this);
        }
        Logger.info("PLAYER: allAudioTracks - ", result);
        return result;
    };
    Object.defineProperty(ShakaMediaPlayer.prototype, "subtitleActive", {
        /**
         * Get disable/enable subtitle
         */
        get: function () {
            if (this.$shakaInstance) {
                return this.$shakaInstance.isTextTrackVisible();
            }
            else {
                var playerElem = this.getEl();
                if (playerElem) {
                    var tracks = playerElem.textTracks || [];
                    for (var index = 0; index < tracks.length; index++) {
                        var textTrack = tracks[index];
                        if (textTrack.mode === "showing") {
                            return true;
                        }
                    }
                    return false;
                }
                else {
                    return false;
                }
            }
        },
        /**
         * Set disable/enable subtitle
         */
        set: function (state) {
            var storage = new storage_1.default();
            // When subtitle should be activated
            if (state) {
                // Check if there are subtitles available
                var subtitleTracks = this.allSubtitleTracks();
                if (subtitleTracks.length === 0)
                    return;
                // Get last default subtitle language
                var lastTrackLanguage = storage.getItem(player_1.PLAYER_STORAGE_KEYS.STORAGE_SUBTITLE_LANGUAGE);
                var track = subtitleTracks[0];
                for (var _i = 0, _a = Array.from(subtitleTracks); _i < _a.length; _i++) {
                    var subtitleTrack = _a[_i];
                    if (lastTrackLanguage === subtitleTrack.language) {
                        track = subtitleTrack;
                    }
                }
                // Set subtitle active
                storage.setItem(player_1.PLAYER_STORAGE_KEYS.STORAGE_SUBTITLE_ACTIVE, JSON.stringify(true));
                this.subtitleTrack = track;
                // When subtitle should be activated
            }
            else {
                if (this.$shakaInstance) {
                    this.$shakaInstance.setTextTrackVisibility(false);
                }
                else {
                    var playerElem = this.getEl();
                    var tracks = playerElem.textTracks || [];
                    for (var index = 0; index < tracks.length; index++) {
                        playerElem.textTracks[index].mode = "hidden";
                    }
                }
                storage.setItem(player_1.PLAYER_STORAGE_KEYS.STORAGE_SUBTITLE_ACTIVE, JSON.stringify(false));
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ShakaMediaPlayer.prototype, "subtitleTrack", {
        get: function () {
            var track = {
                language: "",
                index: 0
            };
            if (this.$shakaInstance) {
                var tracks = this.$shakaInstance.getTextTracks() || [];
                for (var index = 0; index < tracks.length; index++) {
                    var textTrack = tracks[index];
                    if (textTrack.active) {
                        track = {
                            language: textTrack.language,
                            index: index
                        };
                    }
                }
            }
            else {
                var playerElem = this.getEl();
                if (playerElem) {
                    var tracks = playerElem.textTracks || [];
                    for (var index = 0; index < tracks.length; index++) {
                        var textTrack = tracks[index];
                        if (textTrack.mode === "showing") {
                            track = {
                                language: textTrack.language,
                                index: index
                            };
                        }
                    }
                }
            }
            return track;
        },
        /**
         * Set subtitle track
         */
        set: function (track) {
            Logger.info("PLAYER: subtitleTrack:'" + track + "'");
            // Save last used subtitle language as default
            var storage = new storage_1.default();
            storage.setItem(player_1.PLAYER_STORAGE_KEYS.STORAGE_SUBTITLE_LANGUAGE, track.language);
            if (this.$shakaInstance) {
                if (track.index !== undefined) {
                    var textTrack = this.$shakaInstance.getTextTracks()[track.index];
                    if (textTrack) {
                        this.$shakaInstance.selectTextTrack(textTrack);
                        this.$shakaInstance.setTextTrackVisibility(true);
                    }
                }
                else {
                    var tracks = this.$shakaInstance.getTextTracks() || [];
                    for (var index = 0; index < tracks.length; index++) {
                        if (tracks[index].language === track.language) {
                            this.$shakaInstance.selectTextTrack(tracks[index]);
                            this.$shakaInstance.setTextTrackVisibility(true);
                        }
                    }
                }
            }
            else {
                var playerElem = this.getEl();
                if (playerElem) {
                    if (track.index !== undefined) {
                        playerElem.textTracks[track.index].mode = "showing";
                    }
                    else {
                        var tracks = playerElem.textTracks || [];
                        for (var index = 0; index < tracks.length; index++) {
                            if (tracks[index].language === track.language) {
                                playerElem.textTracks[index].mode = "showing";
                            }
                            else {
                                playerElem.textTracks[index].mode === "hidden";
                            }
                        }
                    }
                }
            }
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Get all subtitle tracks
     */
    ShakaMediaPlayer.prototype.allSubtitleTracks = function () {
        var result = [];
        if (this.$shakaInstance) {
            var iterable = this.$shakaInstance.getTextTracks() || [];
            for (var index = 0; index < iterable.length; index++) {
                var textTrack = iterable[index];
                result.push({ language: textTrack.language, index: index });
            }
            Logger.info("PLAYER: allSubtitleTracks - ", result);
        }
        else {
            result = _super.prototype.allSubtitleTracks.call(this);
        }
        return result;
    };
    /**
     * Sets the external captions
     */
    ShakaMediaPlayer.prototype.setExternalSubtitles = function (textTracks) {
        if (this.$shakaInstance) {
            for (var _i = 0, textTracks_1 = textTracks; _i < textTracks_1.length; _i++) {
                var textTrack = textTracks_1[_i];
                this.$shakaInstance.addTextTrack(textTrack.url, textTrack.language, "subtitles", textTrack.mime);
            }
        }
        else {
            _super.prototype.setExternalSubtitles.call(this, textTracks);
        }
    };
    return ShakaMediaPlayer;
}(player_2.default));
exports.default = ShakaMediaPlayer;
//# sourceMappingURL=player.shaka.js.map