declare const router: import("express-serve-static-core").Router;
declare module 'express-serve-static-core' {
    interface Request {
        deploymentId?: string;
    }
}
export default router;
//# sourceMappingURL=deploy.routes.d.ts.map