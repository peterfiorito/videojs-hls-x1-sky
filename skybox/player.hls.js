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

const videojs = require("video.js");
const hlsPlugin = require("hls.js");
const dashPlugin = require("dashjs");


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
var HlsMediaPlayer = /** @class */ (function (_super) {
    __extends(HlsMediaPlayer, _super);
    function HlsMediaPlayer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    HlsMediaPlayer.prototype.checkURL = function(url){
        return url.split(".").pop();
    };
    HlsMediaPlayer.prototype.init = function (options) {
        options['width'] = 1920;
        options['height'] = 1080;
        options['top'] = 0;
        options['left'] = 0;
        this.$hlsInstance = videojs.default(this.playerId, options);
        // Set prefered audio language
        var storage = new storage_1.default();
        var preferredAudioLanguage = storage.getItem(player_1.PLAYER_STORAGE_KEYS.STORAGE_AUDIO_LANGUAGE);
        if (preferredAudioLanguage) {
            this.$hlsInstance.audioTracks.tracks({
                preferredAudioLanguage: preferredAudioLanguage,
            });
        }
        _super.prototype.init.call(this, options);
    };
    /**
     * Load the stream and fetch metadata
     */
    HlsMediaPlayer.prototype.load = function () {
        let type = this.checkURL(this._streamURL);
        // check if it's a live stream
        this.destroy();
        if(type === 'm3u8'){
            this.instanceHls = new hlsPlugin({maxBufferSize: 5, maxBufferLength: 20, liveBackBufferLength: 0});
            // Force memory flush
            this.instanceHls.loadSource(this._streamURL);
            this.instanceHls.attachMedia(this.$hlsInstance.children_[0]);
            this.instanceHls.on(hlsPlugin.Events.MANIFEST_PARSED,function() {
                video.play();
            });

        } else if (type === 'mpd') {
            this.instanceDash = dashPlugin.MediaPlayer().create();
            // Set the buffer low to avoid overflow
            this.instanceDash.setBufferPruningInterval(1);
            this.instanceDash.setBufferToKeep(0);
            this.instanceDash.setBufferTimeAtTopQuality(9);
            this.instanceDash.initialize(this.$hlsInstance.children_[0], this.$hlsInstance.options_.src, true);
        } else {
            this.$hlsInstance.src(this._streamURL);
            this.$hlsInstance.load();
            this.$hlsInstance.ready(() => this.$hlsInstance.play());
        }
        _super.prototype.load.call(this);
    };
    HlsMediaPlayer.prototype.destroy = function () {
        if(this.instanceHls) {
            this.instanceHls.destroy();
        }
        if(this.instanceDash){
            this.instanceDash.reset();
        }
        this.$hlsInstance.children_[0].removeAttribute('src');
    };
    Object.defineProperty(HlsMediaPlayer.prototype, "src", {
        /**
         * Get media source url
         */
        get: function () {
            if (this.$hlsInstance) {
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
            if (this.$hlsInstance) {
                this._streamURL = streamURL;
                this.$hlsInstance.options_.src = streamURL;
            }
            else {
                this._streamURL = streamURL;
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
    Object.defineProperty(HlsMediaPlayer.prototype, "mime", {
        get: function () {
            if (this.$hlsInstance) {
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
            if (this.$hlsInstance) {
                this.$hlsInstance.children_[0].setAttribute("mime", mimeType);
                this.$hlsInstance.children_[0].setAttribute("type", mimeType);
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
    Object.defineProperty(HlsMediaPlayer.prototype, "audioTrack", {
        get: function () {
            var track = {
                language: "",
                index: 0
            };
            if (this.$hlsInstance) {
                var variant = this.$hlsInstance.getVariantTracks().find(function (track) { return track.active; });
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
            if (this.$hlsInstance) {
                var languages = this.$hlsInstance.getAudioLanguages() || [];
                if (track.index !== undefined) {
                    this.$hlsInstance.selectAudioLanguage(languages[track.index]);
                }
                else {
                    for (var i = 0; i < languages.length; i++) {
                        var language = languages[i];
                        if (language === track.language) {
                            this.$hlsInstance.selectAudioLanguage(language);
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
    Object.defineProperty(HlsMediaPlayer.prototype, "left", {
        /**
         * Get/set media window left alignment
         */
        get: function () {
            return this.getPlayerCSSProperty("left");
        },
        set: function (position) {
            this.setPlayerCSSProperty(position, "left");
        },
        enumerable: true,
        configurable: true
    });
    HlsMediaPlayer.prototype.allAudioTracks = function () {
        var result = [];
        if (this.$hlsInstance) {
            var languages = this.$hlsInstance.getAudioLanguages() || [];
            for (var i = 0; i < languages.length; i++) {
                var language = languages[i];
                result.push({
                    language: language,
                    index: i
                });
            }
        }
        else {
            //result = _super.prototype.allAudioTracks.call(this);
        }
        Logger.info("PLAYER: allAudioTracks - ", result);
        return result;
    };
    HlsMediaPlayer.prototype.getEl = function () {
        if (this.$hlsInstance)
            return this.$hlsInstance.children_[0];
        var el = document.getElementById(this.playerId);
        if (el) {
            return this.$playerElem = el;
        }
        else {
            return undefined;
        }
    };
    HlsMediaPlayer.prototype.getPlayerCSSProperty = function (property) {
        var playerElem = this.getEl();
        if (playerElem) {
            return parseInt(getComputedStyle(playerElem, undefined).getPropertyValue(property));
        }
        else {
            return 0;
        }
    };
    HlsMediaPlayer.prototype.setPlayerCSSProperty = function (position, property) {
        var playerElem = this.getEl();
        if (playerElem) {
            playerElem.style[property] = position + "px";
        }
    };
    return HlsMediaPlayer;
}(player_2.default));
exports.default = HlsMediaPlayer;
//# sourceMappingURL=player.hls.js.map