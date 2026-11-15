import {env} from "cloudflare:workers";
export const dynamic="force-dynamic";
export async function GET(){const e=env as unknown as Record<string,string|undefined>;return Response.json({configured:Boolean(e.OPENAI_API_KEY||process.env.OPENAI_API_KEY)},{headers:{"Cache-Control":"no-store"}});}
