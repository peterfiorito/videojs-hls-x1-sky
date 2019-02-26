"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var input_1 = require("./input");
describe("core/index.ts", function () {
    it("sdk: input ", function () {
        var input = new input_1.default({});
        expect(input.keycodes["13"]).toBe("enter");
    });
});
//# sourceMappingURL=input.spec.js.map