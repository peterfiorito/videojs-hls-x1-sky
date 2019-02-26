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
var index_1 = require("../../abstract/index");
var input_1 = require("./input");
var utils_1 = require("./utils");
var player_1 = require("./player.hls");
var storage_1 = require("./storage");
// This module is the bootstrap for the framework
var HTML5SDK = /** @class */ (function (_super) {
    __extends(HTML5SDK, _super);
    function HTML5SDK() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    HTML5SDK.init = function (config) {
        HTML5SDK.input = new input_1.default(config);
        _super.init.call(this, config);
        // Immediately resolve the core platform
        return Promise.resolve();
    };
    HTML5SDK.platform = "skybox";
    HTML5SDK.utils = new utils_1.default();
    HTML5SDK.player = player_1.default;
    HTML5SDK.storage = new storage_1.default();
    return HTML5SDK;
}(index_1.default));
exports.default = HTML5SDK;
//# sourceMappingURL=index.js.map