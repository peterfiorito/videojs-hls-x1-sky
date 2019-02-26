"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("./index");
describe("core/index.ts", function () {
    it("sdk: initialisation ", function () {
        expect.assertions(1);
        index_1.default.init({}).then(function (value) {
            expect(value).toBe(undefined);
        });
    });
});
//# sourceMappingURL=index.spec.js.map