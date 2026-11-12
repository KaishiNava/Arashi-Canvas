"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Canvas, Rect, Circle, Triangle, FabricText, FabricImage, filters, type FabricObject } from "fabric";
import { ArrowLeft, Download, Redo2, Undo2, Type, Square, Circle as CircleIcon, Triangle as TriangleIcon, ImagePlus, Layers3, Trash2, Lock, Unlock, Copy, Save, SlidersHorizontal } from "lucide-react";
import { db, type Project } from "@/lib/db";
import { effects } from "@/features/effects/registry";

type LayerItem = { object: FabricObject; label: string };
export default function PosterEditor() {
  const params = useParams<{id:string}>(); const router = useRouter();
  const canvasEl = useRef<HTMLCanvasElement|null>(null); const stageRef = useRef<HTMLDivElement|null>(null); const canvasRef = useRef<Canvas|null>(null);
  const [project,setProject] = useState<Project|null>(null); const [selected,setSelected] = useState<FabricObject|null>(null);
  const [layers,setLayers] = useState<LayerItem[]>([]); const [saving,setSaving] = useState("Saved");
  const [effectValues,setEffectValues] = useState<Record<string,number>>({}); const [mobilePanel,setMobilePanel] = useState(false);
  const refreshLayers = useCallback(() => {
    const c=canvasRef.current; if(!c)return;
    setLayers([...c.getObjects()].reverse().map((object,i)=>({object,label:String((object as FabricObject & {_label?:string})._label || object.type || `Object ${i+1}`)})));
    setSelected(c.getActiveObject() || null);
  },[]);
  useEffect(()=>{ let alive=true; let canvas:Canvas;
    async function init(){
      const p=await db.projects.get(params.id); if(!p){router.replace("/");return;} if(!alive)return; setProject(p);
      if(!canvasEl.current)return;
      canvas=new Canvas(canvasEl.current,{width:p.width,height:p.height,backgroundColor:"#ffffff",preserveObjectStacking:true,selection:true});
      canvasRef.current=canvas;
      await canvas.loadFromJSON(p.canvasJson);
      canvas.setDimensions({width:p.width,height:p.height});
      canvas.on("selection:created",refreshLayers); canvas.on("selection:updated",refreshLayers); canvas.on("selection:cleared",refreshLayers);
      canvas.on("object:added",refreshLayers); canvas.on("object:removed",refreshLayers); canvas.on("object:modified",refreshLayers);
      canvas.requestRenderAll(); refreshLayers();
    }
    void init(); return ()=>{alive=false;canvasRef.current?.dispose();canvasRef.current=null;};
  },[params.id,router,refreshLayers]);

  // Fit the full poster into the available editor area while preserving its real pixel dimensions.
  useEffect(()=>{
    const c=canvasRef.current;
    const stage=stageRef.current;
    if(!c||!stage||!project)return;
    const fit=()=>{
      const bounds=stage.getBoundingClientRect();
      const availableWidth=Math.max(120,bounds.width-32);
      const availableHeight=Math.max(120,bounds.height-32);
      const zoom=Math.min(availableWidth/project.width,availableHeight/project.height,1);
      c.setZoom(zoom);
      c.setDimensions(
        {width:Math.round(project.width*zoom),height:Math.round(project.height*zoom)},
        {cssOnly:true}
      );
      c.calcOffset();
      c.requestRenderAll();
    };
    const observer=new ResizeObserver(fit);
    observer.observe(stage);
    fit();
    return ()=>observer.disconnect();
  },[project]);

  const save=useCallback(async()=>{
    const c=canvasRef.current;if(!c||!project)return;
    setSaving("Saving…");
    const canvasJson=JSON.stringify(c.toObject(["_label"]));
    const preview=c.toDataURL({format:"png",multiplier:Math.min(0.25,1200/project.width)});
    await db.projects.update(project.id,{canvasJson,preview,updatedAt:Date.now()});
    setSaving("Saved");
  },[project]);
  useEffect(()=>{const timer=setTimeout(()=>{void save();},900);return()=>clearTimeout(timer);},[layers,save]);

  function addObject(obj:FabricObject,label:string){const c=canvasRef.current;if(!c)return;(obj as FabricObject & {_label?:string})._label=label;c.add(obj);c.setActiveObject(obj);c.requestRenderAll();refreshLayers();}
  function addText(){addObject(new FabricText("Double click to edit",{left:100,top:100,fontSize:48,fill:"#171717",fontFamily:"Arial"}),"Text");}
  function addRect(){addObject(new Rect({left:100,top:100,width:220,height:140,fill:"#171717",rx:8,ry:8}),"Rectangle");}
  function addCircle(){addObject(new Circle({left:120,top:120,radius:75,fill:"#bdbdb8"}),"Circle");}
  function addTriangle(){addObject(new Triangle({left:130,top:100,width:150,height:140,fill:"#777"}),"Triangle");}
  async function addImage(file?:File){
    if(!file)return;
    // Store a data URL, not a temporary blob URL, so the image survives reloads.
    const dataUrl = await new Promise<string>((resolve,reject)=>{
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Image read failed"));
      reader.onerror = () => reject(new Error("Image read failed"));
      reader.readAsDataURL(file);
    });
    const img=await FabricImage.fromURL(dataUrl);
    img.scaleToWidth(Math.min(350,project?.width||350));
    img.set({left:80,top:80});
    addObject(img,"Image");
  }
  function updateSelected(key:string,value:string|number){const c=canvasRef.current;const o=c?.getActiveObject();if(!c||!o)return;o.set(key as keyof FabricObject,value as never);c.requestRenderAll();refreshLayers();}
  function deleteSelected(){const c=canvasRef.current,o=c?.getActiveObject();if(c&&o){c.remove(o);c.discardActiveObject();c.requestRenderAll();refreshLayers();}}
  function duplicate(){const c=canvasRef.current,o=c?.getActiveObject();if(!c||!o)return;void o.clone().then(clone=>{clone.set({left:(o.left||0)+24,top:(o.top||0)+24});addObject(clone,String((o as FabricObject & {_label?:string})._label||"Object")+" copy");});}
  function moveLayer(item:LayerItem,dir:"up"|"down"){const c=canvasRef.current;if(!c)return;dir==="up"?c.bringObjectForward(item.object):c.sendObjectBackwards(item.object);c.requestRenderAll();refreshLayers();}
  function exportImage(){const c=canvasRef.current;if(!c)return;const a=document.createElement("a");a.href=c.toDataURL({format:"png",multiplier:1});a.download=`${project?.name||"araishi-poster"}.png`;a.click();}
  async function applyEffect(id:string,value:number){const c=canvasRef.current,o=c?.getActiveObject();if(!c||!o||o.type!=="image")return;const def=effects.find(e=>e.id===id);if(!def)return;const current=(o as FabricImage).filters||[];(o as FabricImage).filters=current.filter((f)=>!(f as unknown as {__araishiId?:string}).__araishiId);const filter=id==="blur"?new filters.Blur({blur:value/100}):id==="brightness"?new filters.Brightness({brightness:(value-100)/100}):id==="contrast"?new filters.Contrast({contrast:(value-100)/100}):new filters.Grayscale();(filter as unknown as {__araishiId:string}).__araishiId=id;(o as FabricImage).filters=[...current.filter((f)=>!(f as unknown as {__araishiId?:string}).__araishiId),filter];(o as FabricImage).applyFilters();c.requestRenderAll();setEffectValues(v=>({...v,[id]:value}));}
  return <main className="h-screen flex flex-col overflow-hidden bg-[#f6f6f4]">
    <header className="h-14 shrink-0 bg-white border-b border-black/5 flex items-center justify-between px-3 md:px-5">
      <div className="flex items-center gap-3"><button className="p-2 hover:bg-neutral-100 rounded-lg" onClick={()=>router.push("/")}><ArrowLeft size={18}/></button><div><div className="text-sm font-semibold">Araishi Canvas</div><div className="text-[10px] text-neutral-400">{project?.name||"Loading…"}</div></div></div>
      <div className="flex items-center gap-2"><span className="text-[11px] text-neutral-400 hidden sm:inline">{saving}</span><button className="btn" onClick={()=>void save()}><Save size={14}/> <span className="hidden sm:inline">Save</span></button><button className="btn btn-dark" onClick={exportImage}><Download size={14}/> Export</button></div>
    </header>
    <div className="flex-1 min-h-0 grid editor-grid">
      <aside className="desktop-tools bg-white border-r border-black/5 p-2 flex flex-col gap-1">
        <button className="tool" onClick={addText}><Type size={19}/>Text</button><button className="tool" onClick={addRect}><Square size={19}/>Square</button><button className="tool" onClick={addCircle}><CircleIcon size={19}/>Circle</button><button className="tool" onClick={addTriangle}><TriangleIcon size={19}/>Triangle</button><label className="tool cursor-pointer"><ImagePlus size={19}/>Image<input type="file" accept="image/*" className="hidden" onChange={e=>{void addImage(e.target.files?.[0]);e.currentTarget.value="";}}/></label>
      </aside>
      <section className="min-w-0 min-h-0 flex flex-col">
        <div className="h-12 shrink-0 flex items-center justify-center gap-2 border-b border-black/5 bg-[#fafaf9]">
          <button className="btn" onClick={()=>{const o=canvasRef.current?.getActiveObject();if(o){const c=canvasRef.current!;void o.clone().then(cl=>{cl.set({left:(o.left||0)+20,top:(o.top||0)+20});addObject(cl,"Copy");});}}}><Copy size={14}/></button>
          <button className="btn" onClick={deleteSelected}><Trash2 size={14}/></button>
          <span className="text-xs text-neutral-400 ml-2">{project?.width} × {project?.height} px</span>
        </div>
        <div ref={stageRef} className="canvas-wrap flex-1 min-h-0 overflow-auto flex items-center justify-center p-3 md:p-5">
          <div className="bg-white shadow-[0_8px_35px_#0002] shrink-0"><canvas ref={canvasEl}/></div>
        </div>
        <div className="mobile-tools hidden bg-white border-t border-black/5 justify-around p-2">
          <button className="tool" onClick={addText}><Type size={19}/>Text</button><button className="tool" onClick={addRect}><Square size={19}/>Shape</button><button className="tool" onClick={addCircle}><CircleIcon size={19}/>Circle</button><label className="tool"><ImagePlus size={19}/>Image<input type="file" accept="image/*" className="hidden" onChange={e=>{void addImage(e.target.files?.[0]);e.currentTarget.value="";}}/></label><button className="tool" onClick={()=>setMobilePanel(!mobilePanel)}><SlidersHorizontal size={19}/>Edit</button></div>
      </section>
      <aside className={`properties bg-white border-l border-black/5 p-4 overflow-y-auto ${mobilePanel?"mobile-panel-open":""}`}>
        <div className="flex items-center gap-2 font-semibold text-sm mb-4"><SlidersHorizontal size={16}/> Properties</div>
        {selected ? <div className="space-y-4">
          <div><label className="text-[11px] text-neutral-500">Fill color</label><input type="color" className="w-full h-10 mt-1" value={typeof selected.fill==="string"&&selected.fill.startsWith("#")?selected.fill:"#171717"} onChange={e=>updateSelected("fill",e.target.value)}/></div>
          <div><label className="text-[11px] text-neutral-500">Opacity</label><input className="w-full mt-2" type="range" min="0" max="1" step=".01" value={selected.opacity??1} onChange={e=>updateSelected("opacity",Number(e.target.value))}/></div>
          <div className="grid grid-cols-2 gap-2"><div><label className="text-[11px] text-neutral-500">X</label><input className="input mt-1" type="number" value={Math.round(selected.left||0)} onChange={e=>updateSelected("left",Number(e.target.value))}/></div><div><label className="text-[11px] text-neutral-500">Y</label><input className="input mt-1" type="number" value={Math.round(selected.top||0)} onChange={e=>updateSelected("top",Number(e.target.value))}/></div></div>
          {selected.type==="i-text"||selected.type==="text"? <div><label className="text-[11px] text-neutral-500">Font size</label><input className="input mt-1" type="number" value={(selected as FabricText).fontSize||32} onChange={e=>updateSelected("fontSize",Number(e.target.value))}/></div>:null}
          <button className="btn w-full" onClick={()=>{selected.set("lockMovementX",!selected.lockMovementX);selected.set("lockMovementY",!selected.lockMovementY);canvasRef.current?.requestRenderAll();refreshLayers();}}>{selected.lockMovementX?<Unlock size={14}/>:<Lock size={14}/>} {selected.lockMovementX?"Unlock":"Lock"} object</button>
          {selected.type==="image"&&<div className="border-t pt-4"><div className="text-xs font-semibold mb-3">Image effects</div>{effects.map(effect=><div key={effect.id} className="mb-3"><div className="flex justify-between text-[11px] mb-1"><span>{effect.label}</span><span>{effectValues[effect.id]??effect.initial}</span></div><input className="w-full" type="range" min={effect.min} max={effect.max} value={effectValues[effect.id]??effect.initial} onChange={e=>void applyEffect(effect.id,Number(e.target.value))}/></div>)}</div>}
        </div>:<p className="text-xs text-neutral-400">Pilih objek pada canvas untuk mengedit propertinya.</p>}
        <div className="border-t mt-5 pt-4"><div className="flex items-center gap-2 text-sm font-semibold mb-3"><Layers3 size={15}/> Layers</div><div className="space-y-1">{layers.map((item,i)=><div key={i} className={`flex items-center gap-1 p-2 rounded-lg text-xs ${selected===item.object?"bg-neutral-100":"hover:bg-neutral-50"}`}><button className="flex-1 text-left truncate" onClick={()=>{canvasRef.current?.setActiveObject(item.object);canvasRef.current?.requestRenderAll();refreshLayers();}}>{item.label}</button><button className="text-neutral-400 px-1" title="Bring forward" onClick={()=>moveLayer(item,"up")}>↑</button><button className="text-neutral-400 px-1" title="Send backward" onClick={()=>moveLayer(item,"down")}>↓</button></div>)}</div></div>
      </aside>
    </div>
  </main>;
}
