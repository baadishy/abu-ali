import type { Request, Response } from "express";
import handler from "../server.ts";

export default function vercelApi(req: Request, res: Response) {
  return handler(req, res);
}

