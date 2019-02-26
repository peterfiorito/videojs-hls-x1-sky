"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var utils_2 = require("../../interface/utils");
var packageJson = require("../../../package.json");
describe("core/utils.ts", function () {
    it("sdk: returns SDK version ", function () {
        var utils = new utils_1.default();
        expect(utils.getSDKVersion()).toBe(String(packageJson.version));
    });
    it("sdk: returns DeviceGroup ", function () {
        var utils = new utils_1.default();
        expect(utils.getDeviceGroup()).toBe(utils_2.DEVICE_TYPE.BROWSER);
    });
    it("sdk: returns FirmwareVersion ", function () {
        var utils = new utils_1.default();
        expect(utils.getFirmwareVersion()).toBe("");
    });
    it("sdk: returns NetworkType ", function () {
        var utils = new utils_1.default();
        expect(utils.getNetworkType()).toBe(utils_2.NETWORK_TYPE.UNDEFINED);
    });
    it("sdk: returns NetworkCarrier ", function () {
        var utils = new utils_1.default();
        expect(utils.getNetworkCarrier()).toBe("");
    });
    it("sdk: returns Mac ", function () {
        var utils = new utils_1.default();
        expect(utils.getMac()).toBe("00:00:00:00:00:00");
    });
    it("sdk: returns IP ", function () {
        var utils = new utils_1.default();
        expect(utils.getIp()).toBe("0.0.0.0");
    });
    it("sdk: return guid ", function () {
        var utils = new utils_1.default();
        expect(utils.guid().length).toBe(36);
    });
    it("sdk: return validtiy of current platform ", function () {
        var utils = new utils_1.default();
        expect(utils.isValidPlatform()).toBe(true);
    });
    it("sdk: returns UHD value ", function () {
        var utils = new utils_1.default();
        expect(utils.isUHD()).toBe(false);
    });
    it("sdk: returns HDR value ", function () {
        var utils = new utils_1.default();
        expect(utils.isHDR()).toBe(false);
    });
});
//# sourceMappingURL=utils.spec.js.map