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
var player_2 = require("../../abstract/player");
var Logger = require("js-logger");
var storage_1 = require("./storage");
/**
 * Class for playback of content
 */
var CoreMediaPlayer = /** @class */ (function (_super) {
    __extends(CoreMediaPlayer, _super);
    /**
     * Instantiates a new player instance
     */
    function CoreMediaPlayer(options, callback) {
        var _this = _super.call(this, options, callback) || this;
        _this.setupListener();
        _this.init(options);
        // Initialize DRM
        if (options.drm) {
            _this.drm(options.drm);
        }
        return _this;
    }
    /**
     * Create player DOM object
     */
    CoreMediaPlayer.prototype.createPlayerElement = function (playerId, parentId, mime) {
        var playerEl;
        switch (mime.split("/")[0]) {
            case "audio":
                playerEl = document.createElement("audio");
                playerEl.id = playerId;
                break;
            case "video":
            default:
                playerEl = document.createElement("video");
                playerEl.id = playerId;
                break;
        }
        // var sourceEl = document.createElement("source");
        //  playerEl.appendChild(sourceEl);
        var parentEl = document.getElementById(parentId);
        if (parentEl) {
            parentEl.appendChild(playerEl);
        }
        return playerEl;
    };
    /**
     * Remove player from DOM
     */
    CoreMediaPlayer.prototype.removePlayerElement = function () {
        var playerElem = document.getElementById(this.playerId);
        if (playerElem) {
            var sourceElements = playerElem.getElementsByTagName("source");
            for (var i = 0, len = sourceElements.length; i < len; i++) {
                var sourceElement = sourceElements[i];
                sourceElement.setAttribute("src", ""); // clear the src attribute, some platforms might keep last frame visible
            }
            if (playerElem.parentNode) {
                playerElem.parentNode.removeChild(playerElem); // remove main element from dom
            }
        }
    };
    /**
     * Return player DOM node
     */
    CoreMediaPlayer.prototype.getEl = function () {
        if (this.$playerElem)
            return this.$playerElem;
        var el = document.getElementById(this.playerId);
        if (el) {
            return this.$playerElem = el;
        }
        else {
            return undefined;
        }
    };
    /**
     * Destroy the media object
     */
    CoreMediaPlayer.prototype.destroy = function () {
        Logger.info("PLAYER: destroy");
        CoreMediaPlayer.eventbus.off("*._player");
        this.$playerElem = undefined;
        this.stop();
        this.removeListener();
        this.removePlayerElement();
        this.state = player_1.PLAYER_PLAYBACK_STATES.NOTLOADED;
    };
    /**
     * Attach player events
     */
    CoreMediaPlayer.prototype.setupListener = function () {
        var _this = this;
        Logger.info("PLAYER: setup listener");
        var playerElem = this.getEl();
        if (!playerElem)
            return;
        playerElem.addEventListener("loadstart", function (e) {
            Logger.info("PLAYER: loadstart");
            e.stopPropagation();
            _this.state = player_1.PLAYER_PLAYBACK_STATES.STOPPED;
        });
        playerElem.addEventListener("loadedmetadata", function (e) {
            CoreMediaPlayer.eventbus.trigger("player-onReady");
            if (_this.options.time && _this.options.time > 0) {
                _this.currentTime = _this.options.time;
            }
        });
        playerElem.addEventListener("waiting", function (e) {
            Logger.info("PLAYER: onwaiting");
            e.stopPropagation();
            _this.state = player_1.PLAYER_PLAYBACK_STATES.LOADING;
            CoreMediaPlayer.eventbus.trigger("player-onWaiting");
        });
        // Fired on playback starts again after pause state or buffer state
        playerElem.addEventListener("playing", function (e) {
            Logger.info("PLAYER: onplaying");
            e.stopPropagation();
            _this.state = player_1.PLAYER_PLAYBACK_STATES.PLAYING;
            CoreMediaPlayer.eventbus.trigger("player-onPlay");
        });
        // Fired on play/autoplay command
        playerElem.addEventListener("play", function (e) {
            Logger.info("PLAYER: onplay");
            e.stopPropagation();
            _this.state = player_1.PLAYER_PLAYBACK_STATES.PLAYING;
            CoreMediaPlayer.eventbus.trigger("player-onPlay");
        });
        // fired on media pause state
        playerElem.addEventListener("pause", function (e) {
            Logger.info("PLAYER: onpause");
            e.stopPropagation();
            _this.state = player_1.PLAYER_PLAYBACK_STATES.PAUSED;
            CoreMediaPlayer.eventbus.trigger("player-onPause");
        });
        // Fired on media error state
        var sourceElements = playerElem.getElementsByTagName("source");
        var errorElements = Array.prototype.slice.call(sourceElements);
        errorElements.unshift(playerElem); // listening on both the video and source elements
        for (var i = 0, len = errorElements.length; i < len; i++) {
            errorElements[i].addEventListener("error", this.onError, true);
        }
        var self = this; // prevent memory leak by referencing DOM node in its own listener
        playerElem.addEventListener("timeupdate", function (e) {
            e.stopPropagation();
            if (self.state === player_1.PLAYER_PLAYBACK_STATES.NOTLOADED)
                return;
            if (!self.isPlaying() && playerElem) {
                var event_1 = new Event("play");
                this.dispatchEvent(event_1);
            } // Fail-safe as this is not always triggered
            CoreMediaPlayer.eventbus.trigger("player-onProgress", self.currentTime);
        });
        playerElem.addEventListener("ended", function (e) {
            Logger.info("PLAYER: ended");
            e.stopPropagation();
            _this.state = player_1.PLAYER_PLAYBACK_STATES.STOPPED;
            CoreMediaPlayer.eventbus.trigger("player-onEnded");
        });
    };
    CoreMediaPlayer.prototype.onError = function (event) {
        event.stopPropagation();
        this.state = player_1.PLAYER_PLAYBACK_STATES.STOPPED;
        var error = player_1.PLAYER_PLAYBACK_ERRORS.UNKNOWN;
        var element = event.target;
        try {
            switch (element.error.code) {
                case element.error.MEDIA_ERR_ABORTED:
                    error = player_1.PLAYER_PLAYBACK_ERRORS.MEDIA_ERR_ABORTED;
                    break;
                case element.error.MEDIA_ERR_DECODE:
                    error = player_1.PLAYER_PLAYBACK_ERRORS.MEDIA_ERR_DECODE;
                    break;
                case element.error.MEDIA_ERR_NETWORK:
                    error = player_1.PLAYER_PLAYBACK_ERRORS.MEDIA_ERR_NETWORK;
                    break;
                case element.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    error = player_1.PLAYER_PLAYBACK_ERRORS.MEDIA_ERR_SRC_NOT_SUPPORTED;
                    break;
            }
            Logger.info("PLAYER: error: " + error + " || Error element: " + element);
            CoreMediaPlayer.eventbus.trigger("player-onError", error);
        }
        catch (errorCatch) {
            Logger.info("PLAYER: error not found: " + errorCatch + " || Error to be reported: " + error);
        }
    };
    /**
     * Remove the attached player events
     */
    CoreMediaPlayer.prototype.removeListener = function () {
        Logger.info("PLAYER: remove listeners");
        var playerElem = document.getElementById(this.playerId);
        if (!playerElem)
            return;
        // Remove all listeners of the main and child elements by cloning the node
        var clone = playerElem.cloneNode();
        while (playerElem.firstChild) {
            if (playerElem.lastChild) {
                clone.appendChild(playerElem.lastChild);
            }
        }
        if (playerElem.parentNode) {
            playerElem.parentNode.replaceChild(clone, playerElem);
        }
    };
    /**
     * Play the media
     */
    CoreMediaPlayer.prototype.play = function (time) {
        if (time && time > 0) {
            this.currentTime = time;
        }
        Logger.info("PLAYER: play - time " + this.currentTime + "s");
        var playerElem = this.getEl();
        if (playerElem) {
            playerElem.play();
        }
        return true;
    };
    /**
     * Stop the media
     */
    CoreMediaPlayer.prototype.stop = function () {
        Logger.info("PLAYER: stop");
        this.pause(); // there is no stop, pause video instead
        this.currentTime = 0;
        CoreMediaPlayer.eventbus.trigger("player-onProgress", 0);
        CoreMediaPlayer.eventbus.trigger("player-onStop");
        return true;
    };
    /**
     * Pause the media
     */
    CoreMediaPlayer.prototype.pause = function () {
        if (!this.isActive()) {
            return false;
        }
        Logger.info("PLAYER: pause");
        var playerElem = this.getEl();
        if (playerElem) {
            playerElem.pause();
        }
        return true;
    };
    /**
     * Skip forward in time of video
     */
    CoreMediaPlayer.prototype.skipForward = function (time) {
        if (time === void 0) { time = 30; }
        if (!this.isActive()) {
            return false;
        }
        Logger.info("PLAYER: skipFW");
        var t = this.currentTime + time;
        if (t < this.duration) {
            this.currentTime = t;
        }
        return true;
    };
    /**
     * Skip backward in time of video
     */
    CoreMediaPlayer.prototype.skipBackward = function (time) {
        if (time === void 0) { time = 30; }
        if (!this.isActive()) {
            return false;
        }
        Logger.info("PLAYER: skipBW");
        var t = this.currentTime - time;
        if (t < 0) {
            t = 0;
        }
        this.currentTime = t;
        return true;
    };
    Object.defineProperty(CoreMediaPlayer.prototype, "currentTime", {
        /**
         * Get/set the current playback time
         */
        get: function () {
            try {
                var playerElem = this.getEl();
                if (playerElem) {
                    if (this.state === player_1.PLAYER_PLAYBACK_STATES.STOPPED) {
                        return 0;
                    }
                    else {
                        return parseFloat(playerElem.currentTime.toFixed(3));
                    }
                }
                else {
                    return 0;
                }
            }
            catch (e) {
                Logger.info(e, "Video is not ready");
                return 0;
            }
        },
        set: function (time) {
            try {
                var playerElem = this.getEl();
                if (playerElem) {
                    playerElem.currentTime = time;
                }
            }
            catch (e) {
                Logger.info(e, "Video is not ready");
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CoreMediaPlayer.prototype, "duration", {
        /**
         * Get content duration in seconds
         */
        get: function () {
            try {
                var playerElem = this.getEl();
                if (playerElem) {
                    return playerElem.duration || 0;
                }
                else {
                    return 0;
                }
            }
            catch (e) {
                return 0;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CoreMediaPlayer.prototype, "bufferedTime", {
        /**
         * Return buffered (downloaded) position
         */
        get: function () {
            try {
                var playerElem = this.getEl();
                if (playerElem) {
                    for (var i = 0; i < playerElem.buffered.length; i++) {
                        if (playerElem.buffered.start(playerElem.buffered.length - 1 - i) < playerElem.currentTime) {
                            return (playerElem.buffered.end(playerElem.buffered.length - 1 - i));
                        }
                    }
                }
            }
            catch (e) { }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CoreMediaPlayer.prototype, "volume", {
        /**
         * Get/set volume level of media  [0-100] abox uses 1-31
         */
        get: function () {
            Logger.info("PLAYER: get volume");
            try {
                var playerElem = this.getEl();
                if (playerElem) {
                    return playerElem.volume;
                }
                else {
                    return 0;
                }
            }
            catch (e) {
                return 0;
            }
        },
        set: function (percentage) {
            Logger.info("PLAYER: set volume - " + percentage);
            try {
                var playerElem = this.getEl();
                if (playerElem) {
                    playerElem.volume = percentage;
                }
            }
            catch (e) { }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CoreMediaPlayer.prototype, "muted", {
        /**
         * Get/set mute state of media
         */
        get: function () {
            Logger.info("PLAYER: get muted state");
            try {
                var playerElem = this.getEl();
                if (playerElem) {
                    return playerElem.muted;
                }
                else {
                    return false;
                }
            }
            catch (e) {
                return false;
            }
        },
        set: function (state) {
            Logger.info("PLAYER: update muted state - " + state);
            try {
                var playerElem = this.getEl();
                if (playerElem) {
                    playerElem.muted = state;
                }
            }
            catch (e) { }
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Helper methods CSS positioning
     */
    CoreMediaPlayer.prototype.getPlayerCSSProperty = function (property) {
        var playerElem = this.getEl();
        if (playerElem) {
            return parseInt(getComputedStyle(playerElem, undefined).getPropertyValue(property));
        }
        else {
            return 0;
        }
    };
    CoreMediaPlayer.prototype.setPlayerCSSProperty = function (position, property) {
        this.options.left = position;
        var playerElem = this.getEl();
        if (playerElem) {
            playerElem.style[property] = position + "px";
        }
    };
    Object.defineProperty(CoreMediaPlayer.prototype, "left", {
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
    Object.defineProperty(CoreMediaPlayer.prototype, "top", {
        get: function () {
            return this.getPlayerCSSProperty("top");
        },
        /**
         * set/get media window top alignment
         */
        set: function (position) {
            this.setPlayerCSSProperty(position, "top");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CoreMediaPlayer.prototype, "width", {
        get: function () {
            return this.getPlayerCSSProperty("width");
        },
        /**
         * set media window top alignment
         */
        set: function (position) {
            this.setPlayerCSSProperty(position, "width");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CoreMediaPlayer.prototype, "height", {
        get: function () {
            return this.getPlayerCSSProperty("height");
        },
        /**
         * set media window top alignment
         */
        set: function (position) {
            this.setPlayerCSSProperty(position, "height");
        },
        enumerable: true,
        configurable: true
    });
    /**
     * load the stream and fetch metadata
     */
    CoreMediaPlayer.prototype.load = function () {
        var playerElem = this.getEl();
        if (playerElem) {
            playerElem.load();
        }
    };
    Object.defineProperty(CoreMediaPlayer.prototype, "src", {
        /**
         *  get media source url
         */
        get: function () {
            var playerElem = this.getEl();
            if (playerElem) {
                return playerElem.currentSrc;
            }
            else {
                return "";
            }
        },
        /**
         * set media source url
         */
        set: function (streamURL) {
            Logger.info("PLAYER: SRC - " + streamURL);
            var playerElem = this.getEl();
            if (playerElem) {
                this.currentTime = 0;
                this.state = player_1.PLAYER_PLAYBACK_STATES.STOPPED;
                var sourceElements = playerElem.getElementsByTagName("source");
                if (sourceElements.length > 0) {
                    sourceElements[0].setAttribute("src", streamURL);
                }
            }
            // Initiate stream
            this.load();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CoreMediaPlayer.prototype, "autoplay", {
        /**
         * set autoplay state of media element returns bool
         */
        set: function (state) {
            Logger.info("PLAYER: AUTOPLAY - " + state);
            var playerElem = this.getEl();
            if (playerElem) {
                if (state == true) {
                    playerElem.setAttribute("autoplay", "autoplay");
                }
                else {
                    playerElem.removeAttribute("autoplay");
                }
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CoreMediaPlayer.prototype, "loop", {
        /**
         * set toggle loop state of media element returns bool
         */
        set: function (state) {
            Logger.info("PLAYER: LOOP - " + state);
            var playerElem = this.getEl();
            if (playerElem) {
                if (state == true) {
                    playerElem.setAttribute("loop", "true");
                }
                else {
                    playerElem.removeAttribute("loop");
                }
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CoreMediaPlayer.prototype, "playbackSpeed", {
        get: function () {
            var playerElem = this.getEl();
            if (playerElem) {
                return playerElem.playbackRate;
            }
            else {
                return this.isPlaying() ? 1 : 0;
            }
        },
        /**
         *  set/get playback speed, speed is an index value targeting the speedstep array
         */
        set: function (speed) {
            Logger.info("PLAYER: SET SPEED - " + speed);
            var playerElem = this.getEl();
            if (playerElem) {
                playerElem.playbackRate = speed;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CoreMediaPlayer.prototype, "mime", {
        /**
         *  get mime type of media source
         */
        get: function () {
            var playerElem = this.getEl();
            if (playerElem) {
                var sourceElements = playerElem.getElementsByTagName("source");
                if (sourceElements.length > 0) {
                    return sourceElements[0].getAttribute("type") || "";
                }
                else {
                    return "";
                }
            }
            else {
                return "";
            }
        },
        /**
         * set mime type of media source
         */
        set: function (mimeType) {
            Logger.info("PLAYER: MIME - " + mimeType);
            var playerElem = this.getEl();
            if (playerElem) {
                var sourceElements = playerElem.getElementsByTagName("source");
                if (sourceElements.length > 0) {
                    sourceElements[0].setAttribute("type", mimeType);
                }
            }
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Set the video aspect ratio, options: original, zoom, full
     */
    CoreMediaPlayer.prototype.aspectRatio = function (aspectType) {
        var _a, _b;
        var _this = this;
        if (!this.isActive()) {
            return;
        }
        var aspect, res_width, res_height, adjustmentRatio;
        var fix_width = function (ratio) {
            var playerEl = _this.getEl();
            if (!playerEl)
                return;
            playerEl.style.webkitTransform = "scaleX(" + ratio + ")";
            playerEl.style["MozTransform"] = "scaleX(" + ratio + ")";
            playerEl.style["msTransform"] = "scaleX(" + ratio + ")";
            playerEl.style["OTransform"] = "scaleX(" + ratio + ")";
            playerEl.style.transform = "scaleX(" + ratio + ")";
        };
        var fix_height = function (ratio) {
            var playerEl = _this.getEl();
            if (!playerEl)
                return;
            playerEl.style.webkitTransform = "scaleY(" + ratio + ")";
            playerEl.style["MozTransform"] = "scaleY(" + ratio + ")";
            playerEl.style["msTransform"] = "scaleY(" + ratio + ")";
            playerEl.style["OTransform"] = "scaleY(" + ratio + ")";
            playerEl.style.transform = "scaleY(" + ratio + ")";
        };
        var getVideoAspectRatio = function () {
            var playerElem = _this.getEl();
            if (!playerElem)
                return [(1280 / 720), 1280, 720];
            try {
                return [Math.round(_this.width / _this.height), Math.round(playerElem.videoHeight), Math.round(playerElem.videoWidth)];
            }
            catch (e) {
                return [(1280 / 720), 1280, 720];
            }
        };
        switch (aspectType) {
            case player_1.PLAYER_ASPECTRATIO.ORIGINAL:
                fix_width(1);
                fix_height(1);
                break;
            case player_1.PLAYER_ASPECTRATIO.ZOOM:
                _a = getVideoAspectRatio(), aspect = _a[0], res_width = _a[1], res_height = _a[2];
                // check if current video is in wrong aspect
                if (aspect.toFixed(2) > (res_width / res_height).toFixed(2)) {
                    adjustmentRatio = aspect / (res_width / res_height);
                    fix_width(adjustmentRatio);
                    fix_height(adjustmentRatio);
                }
                else if (aspect.toFixed(2) < (res_width / res_height).toFixed(2)) {
                    adjustmentRatio = (1 / aspect) / (res_height / res_width);
                    fix_width(adjustmentRatio);
                    fix_height(adjustmentRatio);
                }
                break;
            case player_1.PLAYER_ASPECTRATIO.FULL:
                _b = getVideoAspectRatio(), aspect = _b[0], res_width = _b[1], res_height = _b[2];
                // check if current video is in wrong aspect
                if (aspect.toFixed(2) > (res_width / res_height).toFixed(2)) {
                    adjustmentRatio = aspect / (res_width / res_height);
                    fix_width(adjustmentRatio);
                }
                else if (aspect.toFixed(2) < (res_width / res_height).toFixed(2)) {
                    adjustmentRatio = (1 / aspect) / (res_height / res_width);
                    fix_height(adjustmentRatio);
                }
                break;
        }
    };
    /**
     * provide drm properties
     */
    CoreMediaPlayer.prototype.drm = function (config) {
    };
    Object.defineProperty(CoreMediaPlayer.prototype, "audioTrack", {
        /**
         * Get/set audio track
         */
        get: function () {
            var playerElem = this.getEl();
            var track = {
                language: "",
                index: 0
            };
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
            return track;
        },
        set: function (track) {
            var playerElem = this.getEl();
            if (playerElem) {
                Logger.info("PLAYER: audioTrack track - ", track);
                var storage = new storage_1.default();
                storage.setItem(player_1.PLAYER_STORAGE_KEYS.STORAGE_AUDIO_LANGUAGE, track.language);
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
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Get all audio tracks
     */
    CoreMediaPlayer.prototype.allAudioTracks = function () {
        var playerElem = this.getEl();
        var result = [];
        if (playerElem) {
            var tracks = playerElem.audioTracks || [];
            for (var i = 0; i < tracks.length; i++) {
                var audioTrack = tracks[i];
                result.push({
                    language: audioTrack.language,
                    index: i
                });
            }
        }
        Logger.info("PLAYER: allAudioTracks - ", result);
        return result;
    };
    Object.defineProperty(CoreMediaPlayer.prototype, "subtitleActive", {
        /**
         * Get/set disable/enable subtitle
         */
        get: function () {
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
        },
        set: function (state) {
            var playerElem = this.getEl();
            var storage = new storage_1.default();
            if (!playerElem)
                return;
            // when subtitle should be activated
            if (state) {
                // check if there are subtitles available
                var subtitleTracks = this.allSubtitleTracks();
                if (subtitleTracks.length === 0)
                    return;
                // get last default subtitle language
                var lastTrackLanguage = storage.getItem(player_1.PLAYER_STORAGE_KEYS.STORAGE_SUBTITLE_LANGUAGE);
                var track = subtitleTracks[0];
                for (var _i = 0, _a = Array.from(subtitleTracks); _i < _a.length; _i++) {
                    var subtitleTrack = _a[_i];
                    if (lastTrackLanguage === subtitleTrack.language) {
                        track = subtitleTrack;
                    }
                }
                // set subtitle active
                storage.setItem(player_1.PLAYER_STORAGE_KEYS.STORAGE_SUBTITLE_ACTIVE, JSON.stringify(true));
                this.subtitleTrack = track;
                // when subtitle should be activated
            }
            else {
                var tracks = playerElem.textTracks || [];
                for (var index = 0; index < tracks.length; index++) {
                    playerElem.textTracks[index].mode = "hidden";
                }
                storage.setItem(player_1.PLAYER_STORAGE_KEYS.STORAGE_SUBTITLE_ACTIVE, JSON.stringify(false));
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CoreMediaPlayer.prototype, "subtitleTrack", {
        /**
         * Get/set subtitle track
         */
        get: function () {
            var playerElem = this.getEl();
            var track = {
                language: "",
                index: 0
            };
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
            return track;
        },
        set: function (track) {
            var playerElem = this.getEl();
            Logger.info("PLAYER: subtitleTrack:'" + track + "'");
            // save last used subtitle language as default
            var storage = new storage_1.default();
            storage.setItem(player_1.PLAYER_STORAGE_KEYS.STORAGE_SUBTITLE_LANGUAGE, track.language);
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
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Get all subtitle tracks
     */
    CoreMediaPlayer.prototype.allSubtitleTracks = function () {
        var playerElem = this.getEl();
        var result = [];
        if (playerElem) {
            var iterable = playerElem.textTracks || [];
            for (var index = 0; index < iterable.length; index++) {
                var textTrack = iterable[index];
                result.push({ language: textTrack.language, index: index });
            }
            Logger.info("PLAYER: allSubtitleTracks - ", result);
        }
        return result;
    };
    /**
     * Sets the external captions
     */
    CoreMediaPlayer.prototype.setExternalSubtitles = function (textTracks) {
        var playerElem = this.getEl();
        var storage = new storage_1.default();
        var storedTrackLanguage = storage.getItem(player_1.PLAYER_STORAGE_KEYS.STORAGE_SUBTITLE_LANGUAGE);
        var active = JSON.parse(storage.getItem(player_1.PLAYER_STORAGE_KEYS.STORAGE_SUBTITLE_ACTIVE) || "") || false;
        if (playerElem) {
            for (var index = 0; index < textTracks.length; index++) {
                var textTrack = textTracks[index];
                var trackEl = document.createElement("track");
                trackEl.kind = "subtitles";
                trackEl.label = textTrack.language;
                trackEl.srclang = textTrack.language;
                trackEl.src = textTrack.url;
                trackEl["mode"] = (storedTrackLanguage === textTrack.language) ? "showing" : "hidden";
                playerElem.appendChild(trackEl);
            }
        }
    };
    /**
     * Gets the available bitrate in bps (bit per second)
     */
    CoreMediaPlayer.prototype.getAvailableBitrates = function () {
        return [];
    };
    /**
     * Get video width of active stream
     */
    CoreMediaPlayer.prototype.getVideoWidth = function () {
        var playerEl = this.getEl();
        if (playerEl.videoWidth) {
            return playerEl.videoWidth;
        }
        else {
            return 0;
        }
    };
    /**
     * Get video height of active stream
     */
    CoreMediaPlayer.prototype.getVideoHeight = function () {
        var playerEl = this.getEl();
        if (playerEl.videoHeight) {
            return playerEl.videoHeight;
        }
        else {
            return 0;
        }
    };
    /**
     * Gets the current video bitrate in bps (bit per second)
     */
    CoreMediaPlayer.prototype.getCurrentBitrate = function () {
        return 0;
    };
    /**
     * Gets the current video bitrate in bps (bit per second)
     */
    CoreMediaPlayer.prototype.getCurrentAudioBitrate = function () {
        return 0;
    };
    return CoreMediaPlayer;
}(player_2.default));
exports.default = CoreMediaPlayer;
//# sourceMappingURL=player.js.map