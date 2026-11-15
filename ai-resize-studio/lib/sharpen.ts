/** A gentle, bounded unsharp mask. Leave transparent edges and alpha untouched. */
export function sharpenRgba(data:Uint8ClampedArray,width:number,height:number):void {
 if(width<3||height<3)return;
 const src=new Uint8ClampedArray(data);
 const row=width*4;
 for(let y=1;y<height-1;y++){
  for(let x=1;x<width-1;x++){
   const i=y*row+x*4;
   if(src[i+3]!==255||src[i-row-1]!==255||src[i-row+3]!==255||src[i-row+7]!==255||src[i-1]!==255||src[i+7]!==255||src[i+row-1]!==255||src[i+row+3]!==255||src[i+row+7]!==255)continue;
   for(let c=0;c<3;c++){
    const p=i+c;
    const blurred=(src[p-row-4]+2*src[p-row]+src[p-row+4]+2*src[p-4]+4*src[p]+2*src[p+4]+src[p+row-4]+2*src[p+row]+src[p+row+4])/16;
    const difference=src[p]-blurred;
    if(Math.abs(difference)>3)data[p]=src[p]+Math.max(-8,Math.min(8,difference*.35));
   }
  }
 }
}
