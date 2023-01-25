"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePathInput = void 0;
const path_1 = __importDefault(require("path"));
// Detect directory traversal for input file.
function resolvePathInput(input, wd) {
    const safeJoin = path_1.default.resolve(path_1.default.join(wd, input));
    if (!(safeJoin + path_1.default.sep).startsWith(wd + path_1.default.sep)) {
        throw Error(`unsafe path ${safeJoin}`);
    }
    return safeJoin;
}
exports.resolvePathInput = resolvePathInput;
