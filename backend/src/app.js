"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const deploy_routes_1 = __importDefault(require("./routes/deploy.routes"));
const projects_routes_1 = __importDefault(require("./routes/projects.routes"));
const webhook_routes_1 = __importDefault(require("./routes/webhook.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const employee_routes_1 = __importDefault(require("./routes/employee.routes"));
const ai_routes_1 = __importDefault(require("./routes/ai.routes"));
const errorHandler_1 = require("./middlewares/errorHandler");
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use('/deploy', deploy_routes_1.default);
app.use('/projects', projects_routes_1.default);
app.use('/webhooks', webhook_routes_1.default);
app.use('/auth', auth_routes_1.default);
app.use('/employees', employee_routes_1.default);
app.use('/ai', ai_routes_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
// Error handling middleware must be at the very end
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map