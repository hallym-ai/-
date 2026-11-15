import {env} from "cloudflare:workers";
import {getChatGPTUser} from "@/app/chatgpt-auth";
export const dynamic="force-dynamic";
export async function GET(){const e=env as unknown as Record<string,string|undefined>;const user=await getChatGPTUser();return Response.json({configured:Boolean(e.OPENAI_API_KEY||process.env.OPENAI_API_KEY),signedIn:Boolean(user)||import.meta.env.DEV},{headers:{"Cache-Control":"no-store"}});}
