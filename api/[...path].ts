import type { Request, Response } from "express";
// This file is generated during `npm run build` by `tsconfig.server.json`.
// Vercel will run the build before executing the function.
// @ts-ignore generated at build time
import handler from "../dist-server/server.js";

export default function vercelApi(req: Request, res: Response) {
  return handler(req, res);
}
