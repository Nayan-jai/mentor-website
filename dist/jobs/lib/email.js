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
exports.sendPasswordResetEmail = sendPasswordResetEmail;
exports.sendSessionReminderEmail = sendSessionReminderEmail;
exports.sendSessionBookingConfirmationEmail = sendSessionBookingConfirmationEmail;
exports.sendNewSessionNotificationEmail = sendNewSessionNotificationEmail;
var nodemailer_1 = __importDefault(require("nodemailer"));
var transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});
function sendPasswordResetEmail(email, token) {
    return __awaiter(this, void 0, void 0, function () {
        var resetUrl, mailOptions;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    resetUrl = "".concat(process.env.NEXTAUTH_URL, "/auth/reset-password?token=").concat(token);
                    mailOptions = {
                        from: process.env.SMTP_FROM,
                        to: email,
                        subject: "Reset Your Password",
                        html: "\n      <h1>Reset Your Password</h1>\n      <p>Click the link below to reset your password:</p>\n      <a href=\"".concat(resetUrl, "\">Reset Password</a>\n      <p>This link will expire in 1 hour.</p>\n      <p>If you didn't request this, please ignore this email.</p>\n    "),
                    };
                    return [4 /*yield*/, transporter.sendMail(mailOptions)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function sendSessionReminderEmail(email, sessionTitle, sessionTime, mentorName, meetingLink) {
    return __awaiter(this, void 0, void 0, function () {
        var mailOptions;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mailOptions = {
                        from: process.env.SMTP_FROM,
                        to: email,
                        subject: "Reminder: Your session '".concat(sessionTitle, "' starts in 10 minutes!"),
                        html: "\n      <h1>Session Reminder</h1>\n      <p>Hi,</p>\n      <p>This is a reminder that your session <strong>".concat(sessionTitle, "</strong> with mentor <strong>").concat(mentorName, "</strong> will start at <strong>").concat(sessionTime, "</strong> (in 10 minutes).</p>\n      ").concat(meetingLink ? "<p>Join your session: <a href=\"".concat(meetingLink, "\">").concat(meetingLink, "</a></p>") : "", "\n      <p>Good luck and have a great session!</p>\n      <p style=\"color: #888; font-size: 0.9em;\">If you did not book this session, you can ignore this email.</p>\n    "),
                    };
                    return [4 /*yield*/, transporter.sendMail(mailOptions)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function sendSessionBookingConfirmationEmail(email, sessionTitle, sessionTime, mentorName, meetingLink) {
    return __awaiter(this, void 0, void 0, function () {
        var mailOptions;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mailOptions = {
                        from: process.env.SMTP_FROM,
                        to: email,
                        subject: "Session Booked: '".concat(sessionTitle, "' with ").concat(mentorName),
                        html: "\n      <h1>Session Booked!</h1>\n      <p>Hi,</p>\n      <p>Your session <strong>".concat(sessionTitle, "</strong> with mentor <strong>").concat(mentorName, "</strong> is scheduled for <strong>").concat(sessionTime, "</strong>.</p>\n      ").concat(meetingLink ? "<p>Join your session: <a href=\"".concat(meetingLink, "\">").concat(meetingLink, "</a></p>") : "", "\n      <p>You'll also get a reminder 10 minutes before the session starts.</p>\n      <p>Good luck and have a great session!</p>\n    "),
                    };
                    return [4 /*yield*/, transporter.sendMail(mailOptions)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function sendNewSessionNotificationEmail(email, sessionTitle, sessionTime, mentorName, meetingLink) {
    return __awaiter(this, void 0, void 0, function () {
        var mailOptions;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mailOptions = {
                        from: process.env.SMTP_FROM,
                        to: email,
                        subject: "New Session Scheduled: '".concat(sessionTitle, "' with ").concat(mentorName),
                        html: "\n      <h1>New Session Scheduled!</h1>\n      <p>Hi,</p>\n      <p>A new session <strong>".concat(sessionTitle, "</strong> with mentor <strong>").concat(mentorName, "</strong> is scheduled for <strong>").concat(sessionTime, "</strong>.</p>\n      ").concat(meetingLink ? "<p>Join the session: <a href=\"".concat(meetingLink, "\">").concat(meetingLink, "</a></p>") : "", "\n      <p>Book your spot now if you're interested!</p>\n    "),
                    };
                    return [4 /*yield*/, transporter.sendMail(mailOptions)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
