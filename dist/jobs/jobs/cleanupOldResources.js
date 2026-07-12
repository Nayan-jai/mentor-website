"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var prisma_1 = __importDefault(require("../lib/prisma"));
var storage_1 = require("../lib/storage");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var thirtyDaysAgo, oldResources, _i, oldResources_1, resource, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    console.log("[Cleanup] Searching for resources uploaded before ".concat(thirtyDaysAgo.toISOString(), "..."));
                    return [4 /*yield*/, prisma_1.default.resource.findMany({
                            where: {
                                createdAt: {
                                    lt: thirtyDaysAgo,
                                },
                            },
                        })];
                case 1:
                    oldResources = _a.sent();
                    console.log("[Cleanup] Found ".concat(oldResources.length, " old resources to delete."));
                    _i = 0, oldResources_1 = oldResources;
                    _a.label = 2;
                case 2:
                    if (!(_i < oldResources_1.length)) return [3 /*break*/, 8];
                    resource = oldResources_1[_i];
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 6, , 7]);
                    console.log("[Cleanup] Deleting resource: '".concat(resource.title, "' (").concat(resource.url, ")..."));
                    // Delete from local filesystem or Vercel Blob
                    return [4 /*yield*/, (0, storage_1.deleteFile)(resource.url)];
                case 4:
                    // Delete from local filesystem or Vercel Blob
                    _a.sent();
                    // Delete from database
                    return [4 /*yield*/, prisma_1.default.resource.delete({
                            where: { id: resource.id },
                        })];
                case 5:
                    // Delete from database
                    _a.sent();
                    console.log("[Cleanup] Successfully deleted resource: ".concat(resource.title));
                    return [3 /*break*/, 7];
                case 6:
                    err_1 = _a.sent();
                    console.error("[Cleanup] Failed to delete resource '".concat(resource.title, "':"), err_1);
                    return [3 /*break*/, 7];
                case 7:
                    _i++;
                    return [3 /*break*/, 2];
                case 8: return [2 /*return*/];
            }
        });
    });
}
main()
    .then(function () {
    console.log("[Cleanup] Resource cleanup completed.");
    process.exit(0);
})
    .catch(function (err) {
    console.error("[Cleanup] Error running resource cleanup:", err);
    process.exit(1);
});
