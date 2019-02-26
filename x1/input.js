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
var input_1 = require("../../abstract/input");
// This module maps the platform input devices to a standardized input events
var HTML5InputHandler = /** @class */ (function (_super) {
    __extends(HTML5InputHandler, _super);
    function HTML5InputHandler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(HTML5InputHandler.prototype, "keycodes", {
        // Get keycode definition list for the platform
        get: function () {
            return {
                "13": "enter",
                "32": "space",
                "27": "exit",
                "8": "return",
                "73": "info",
                "84": "tools",
                "80": "_play",
                "72": "_pause",
                "83": "stop",
                "70": "forward",
                "87": "rewind",
                "37": "left",
                "38": "up",
                "39": "right",
                "40": "down",
                "82": "red",
                "71": "green",
                "89": "yellow",
                "66": "blue",
                "49": "1",
                "50": "2",
                "51": "3",
                "52": "4",
                "53": "5",
                "54": "6",
                "55": "7",
                "56": "8",
                "57": "9",
                "48": "0",
                "187": "volumeup",
                "189": "volumedown",
                "106": "mute",
                "219": "channelup",
                "221": "channeldown",
                "67": "cc",
                "ctrl": ["tools", "_play", "_pause", "stop", "forward", "rewind", "red", "green", "yellow", "blue", "volumeup", "volumedown", "mute", "channelup", "channeldown"]
            };
        },
        enumerable: true,
        configurable: true
    });
    return HTML5InputHandler;
}(input_1.default));
exports.default = HTML5InputHandler;
//# sourceMappingURL=input.js.map