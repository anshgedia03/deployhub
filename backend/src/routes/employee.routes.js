"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const employee_controller_1 = require("../controllers/employee.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Apply auth middleware to all routes in this file
router.use(auth_middleware_1.requireAuth);
router.post('/', employee_controller_1.createEmployee);
router.get('/', employee_controller_1.getEmployees);
router.put('/:id/access', employee_controller_1.updateEmployeeAccessLevel);
exports.default = router;
//# sourceMappingURL=employee.routes.js.map