import {describe,it,expect} from 'vitest';
import {frameLayout,frameFit} from '../../public/tetol/circle-235/pre-fire/runtime/council-frame-layout.js';
describe('bounded adaptive Council frame',()=>{
 for(const [w,h] of [[1120,730],[640,960],[800,800],[1600,160],[160,1600]])it(`contains ${w}×${h} without distorting`,()=>{
  const d=frameLayout(w,h);expect(d.artWidth/d.artHeight).toBeCloseTo(w/h);expect(d.outerWidth).toBeLessThanOrEqual(1.100001);expect(d.outerHeight).toBeLessThanOrEqual(1.020001);expect(d.outerWidth-d.artWidth).toBeCloseTo(.08);expect(d.outerHeight-d.artHeight).toBeCloseTo(.08);expect(1.4+d.outerHeight/2+d.cordLength).toBeCloseTo(2.55);expect(1.4-d.outerHeight/2).toBeGreaterThan(.43);expect(d.cordX).toBeLessThan(d.outerWidth/2);
 });
 it('uses a bounded square fallback for invalid dimensions',()=>{for(const [w,h] of [[0,1],[-1,2],[NaN,2],[Infinity,1]])expect(frameLayout(w,h)).toEqual(frameLayout(1,1));});
 it('fits full assembly inside an asymmetric usable pixel rectangle',()=>{
  for(const [width,height,rect] of [[390,844,{left:12,top:80,right:378,bottom:426}],[844,390,{left:12,top:64,right:400,bottom:378}],[1440,900,{left:12,top:64,right:1038,bottom:888}]] as const){
   const d=frameLayout(640,960),fit=frameFit(d.outerWidth,d.outerHeight+d.cordLength,rect,{width,height},50),tan=Math.tan(50*Math.PI/360);
   for(const x of [-d.outerWidth/2,d.outerWidth/2])for(const y of [-(d.outerHeight+d.cordLength)/2,(d.outerHeight+d.cordLength)/2]){
    const px=(1+(x-fit.shiftX)/(fit.distance*tan*width/height))*width/2,py=(1-(y-fit.shiftY)/(fit.distance*tan))*height/2;
    expect(px).toBeGreaterThanOrEqual(rect.left);expect(px).toBeLessThanOrEqual(rect.right);expect(py).toBeGreaterThanOrEqual(rect.top);expect(py).toBeLessThanOrEqual(rect.bottom);
   }
  }
 });
});
