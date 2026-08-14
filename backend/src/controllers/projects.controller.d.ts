import { Request, Response, NextFunction } from 'express';
export declare const getProjects: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getDeploymentLogs: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const startDeployment: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const stopDeployment: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteDeployment: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getDeploymentEnvVars: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const redeployProject: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateProjectAccess: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=projects.controller.d.ts.map