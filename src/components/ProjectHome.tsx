"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Trash2, Palette, FileImage } from "lucide-react";
import { db, type Project } from "@/lib/db";

const presets = [
  ["Instagram Post", 1080, 1080], ["Instagram Story", 1080, 1920],
  ["YouTube Thumbnail", 1280, 720], ["A4 Portrait", 2480, 3508],
  ["Poster Portrait", 1080, 1350]
] as const;

export default function ProjectHome() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("Untitled poster");
  const [width, setWidth] = useState(1080);
  const [height, setHeight] = useState(1080);
  const [query, setQuery] = useState("");
  const router = useRouter();

  async function refresh() { setProjects((await db.projects.orderBy("updatedAt").reverse().toArray())); }
  useEffect(() => { void refresh(); }, []);

  async function createProject() {
    const id = crypto.randomUUID();
    await db.projects.add({ id, name: name.trim() || "Untitled poster", width, height, updatedAt: Date.now(), canvasJson: '{"version":"6.7.1","objects":[]}' });
    router.push(`/editor/${id}`);
  }
  async function removeProject(id: string) {
    if (confirm("Hapus project ini secara permanen dari browser?")) { await db.projects.delete(id); await refresh(); }
  }
  const visible = projects.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));

  return <main className="min-h-screen">
    <header className="flex items-center justify-between px-5 md:px-10 py-5 border-b border-black/5 bg-white">
      <a href="/" className="flex items-center gap-3 font-semibold tracking-tight"><span className="grid place-items-center w-9 h-9 rounded-xl bg-black text-white"><Palette size={18}/></span><span>Araishi <span className="font-normal text-neutral-400">Canvas</span></span></a>
      <span className="text-xs text-neutral-400 hidden sm:block">YOUR CREATIVE SPACE</span>
    </header>
    <section className="max-w-6xl mx-auto px-5 md:px-10 py-10 md:py-14">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-9">
        <div><p className="text-xs tracking-[.2em] text-neutral-400 mb-3">WORKSPACE</p><h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Make something<br className="sm:hidden"/> remarkable.</h1><p className="text-sm text-neutral-500 mt-3">Semua project tersimpan lokal di browser kamu.</p></div>
        <button className="btn btn-dark" onClick={() => setShowCreate(true)}><Plus size={17}/> Create new project</button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-5">
        <h2 className="font-semibold">Your projects <span className="text-neutral-400 font-normal">({projects.length})</span></h2>
        <div className="relative w-full sm:w-64"><Search size={15} className="absolute left-3 top-3 text-neutral-400"/><input className="input pl-9" placeholder="Search projects..." value={query} onChange={e=>setQuery(e.target.value)}/></div>
      </div>
      {visible.length ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map(p=><article key={p.id} className="panel overflow-hidden group">
          <button onClick={()=>router.push(`/editor/${p.id}`)} className="w-full text-left">
            <div className="aspect-[16/10] bg-[#f0f0ed] grid place-items-center overflow-hidden">{p.preview ? <img src={p.preview} className="w-full h-full object-contain"/> : <div className="text-center text-neutral-300"><FileImage size={34} className="mx-auto mb-2"/><span className="text-xs">No preview yet</span></div>}</div>
            <div className="p-4"><div className="font-medium text-sm truncate">{p.name}</div><div className="text-xs text-neutral-400 mt-1">{p.width} × {p.height} px · {new Date(p.updatedAt).toLocaleDateString("id-ID")}</div></div>
          </button>
          <div className="px-4 pb-3 flex justify-end"><button aria-label="Delete project" className="text-neutral-400 hover:text-red-600 p-2" onClick={()=>void removeProject(p.id)}><Trash2 size={15}/></button></div>
        </article>)}
      </div> : <div className="panel py-16 text-center"><div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-neutral-100 grid place-items-center"><FileImage className="text-neutral-500"/></div><p className="font-medium text-sm">{query ? "Project tidak ditemukan" : "Belum ada project"}</p><p className="text-xs text-neutral-400 mt-1">Mulai dengan membuat poster pertamamu.</p></div>}
    </section>
    {showCreate && <div className="fixed inset-0 z-30 bg-black/40 p-4 grid place-items-center" onMouseDown={e=>{if(e.target===e.currentTarget)setShowCreate(false);}}>
      <div className="panel w-full max-w-lg p-5 md:p-7">
        <div className="flex justify-between items-start mb-6"><div><h3 className="text-xl font-semibold">Create a project</h3><p className="text-sm text-neutral-500 mt-1">Pilih ukuran kanvas untuk desainmu.</p></div><button onClick={()=>setShowCreate(false)} className="text-neutral-400 text-xl">×</button></div>
        <label className="text-xs font-medium">Project name</label><input className="input mt-2 mb-5" value={name} onChange={e=>setName(e.target.value)}/>
        <label className="text-xs font-medium">Preset size</label><div className="grid grid-cols-2 gap-2 mt-2 mb-5">{presets.map(([label,w,h])=><button key={label} onClick={()=>{setWidth(w);setHeight(h);}} className={`text-left p-3 rounded-xl border text-xs ${width===w&&height===h?"border-black bg-neutral-50":"border-neutral-200"}`}><b>{label}</b><span className="block text-neutral-400 mt-1">{w} × {h}</span></button>)}</div>
        <label className="text-xs font-medium">Custom dimensions (px)</label><div className="grid grid-cols-2 gap-3 mt-2 mb-6"><input className="input" type="number" min="1" max="8000" value={width} onChange={e=>setWidth(Number(e.target.value))}/><input className="input" type="number" min="1" max="8000" value={height} onChange={e=>setHeight(Number(e.target.value))}/></div>
        <button className="btn btn-dark w-full" disabled={width<1||height<1||width>8000||height>8000} onClick={()=>void createProject()}>Create canvas <Plus size={16}/></button>
      </div>
    </div>}
  </main>;
}
