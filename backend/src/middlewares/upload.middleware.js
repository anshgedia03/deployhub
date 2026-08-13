"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const shared_1 = require("@deployhub/shared");
// Ensure upload directory exists
const uploadDir = path_1.default.resolve(process.cwd(), shared_1.env.UPLOAD_DIR);
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed') {
        cb(null, true);
    }
    else {
        cb(new Error('Only ZIP files are allowed.'));
    }
};
exports.uploadMiddleware = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: shared_1.env.MAX_UPLOAD_SIZE,
    },
    fileFilter,
});
//# sourceMappingURL=upload.middleware.js.map