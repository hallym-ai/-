import {env} from "cloudflare:workers";
import {getChatGPTUser} from "@/app/chatgpt-auth";
export const dynamic="force-dynamic";
const sizes:Record<string,string>={"1080x1080":"1024x1024","1920x1080":"1536x864","1080x1920":"864x1536","1080x1350":"1024x1280","1379x611":"1808x800","1080x1440":"1056x1408"};
const fail=(error:string,status:number)=>Response.json({error},{status,headers:{"Cache-Control":"no-store"}});
export async function POST(request:Request){
 const user=await getChatGPTUser();if(!user&&!import.meta.env.DEV)return fail("로그인 후 다시 시도해 주세요.",401);
 const origin=request.headers.get("origin");if(origin&&origin!==new URL(request.url).origin)return fail("요청 출처를 확인할 수 없습니다.",403);
 const e=env as unknown as Record<string,string|undefined>;const key=e.OPENAI_API_KEY||process.env.OPENAI_API_KEY;if(!key)return fail("이미지 생성 연결이 아직 설정되지 않았습니다.",503);
 const length=Number(request.headers.get("content-length")||0);if(length>52*1024*1024)return fail("이미지가 너무 큽니다. 파일은 각각 25MB 이하로 올려주세요.",413);
 try{
  const body=await request.formData();const image=body.get("image"),reference=body.get("reference"),size=String(body.get("size")||""),instruction=String(body.get("instruction")||"").trim();
  if(!(image instanceof File)||!image.size||image.size>25*1024*1024||!["image/png","image/jpeg"].includes(image.type))return fail("PNG 또는 JPG 이미지가 필요합니다.",400);
  if(reference!==null&&(!(reference instanceof File)||!reference.size||reference.size>25*1024*1024||!["image/png","image/jpeg"].includes(reference.type)))return fail("원본 참조 이미지를 확인해 주세요.",400);
  if(!sizes[size]||instruction.length>2000)return fail("규격 또는 수정 내용을 확인해 주세요.",400);
  const prompt=instruction?`${reference?"Image 1 is the current resized design to edit. Image 2 is the original reference, not an extra element to add. Compare the original background and design elements when applying the request. ":"Edit the supplied design. "}Target: ${size}. User request: ${instruction}. Unless the user requests a different layout, retain the original background colors, gradients, and their placement relative to the original composition; do not move a central glow to an edge. Preserve the current design, text, logos, products and their meaning as faithfully as possible, and only change what the user asked for. Keep the target aspect ratio.`:`Adapt the supplied design to ${size}. Recompose its elements to fit the target aspect ratio. Preserve the background's color transitions, gradient center and their placement relative to the main composition from the original: a glow behind the central artwork must remain behind it, not shift to an outside edge. Extend the background naturally around the resized composition without unintended blank gaps, seams or distorted objects. Preserve the original products, logos, wording, numbers, style, information hierarchy and intended decorative elements. Keep all important content readable and visible; do not invent new objects or text. Output a single finished design.`;
  const form=new FormData();form.append("model","gpt-image-2.5-flare");form.append("image[]",image,image.type==="image/jpeg"?"current.jpg":"current.png");if(reference instanceof File)form.append("image[]",reference,reference.type==="image/jpeg"?"reference.jpg":"reference.png");form.append("prompt",prompt);form.append("size",sizes[size]);form.append("quality","high");form.append("output_format","png");
  const response=await fetch("https://api.openai.com/v1/images/edits",{method:"POST",headers:{Authorization:`Bearer ${key}`},body:form});
  if(!response.ok){if(response.status===429)return fail("생성 요청이 많거나 사용 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.",429);return fail("이미지를 생성하지 못했습니다. 연결 상태와 이용 한도를 확인해 주세요.",502);}
  const data=await response.json() as {data?:Array<{b64_json?:string}>};const result=data.data?.[0]?.b64_json;if(!result)return fail("이미지 생성 결과를 받지 못했습니다.",502);
  return Response.json({image:result},{headers:{"Cache-Control":"no-store"}});
 }catch{return fail("이미지 요청을 처리하지 못했습니다. 파일과 연결 상태를 확인해 주세요.",500);}
}
