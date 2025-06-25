"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cn = cn;
exports.formatSessionTime = formatSessionTime;
var clsx_1 = require("clsx");
var tailwind_merge_1 = require("tailwind-merge");
var date_fns_tz_1 = require("date-fns-tz");
function cn() {
    var inputs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        inputs[_i] = arguments[_i];
    }
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
// Formats a date in a specific timezone (default: Asia/Kolkata)
function formatSessionTime(date, timeZone) {
    if (timeZone === void 0) { timeZone = 'Asia/Kolkata'; }
    var zonedDate = (0, date_fns_tz_1.toZonedTime)(date, timeZone);
    // Example: June 26, 2024, 10:00 AM IST
    return (0, date_fns_tz_1.format)(zonedDate, "MMMM d, yyyy, hh:mm a zzz", { timeZone: timeZone });
}
