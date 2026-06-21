'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, X, Edit3, Trash2, Move, FolderTree,
  LayoutGrid, Save, ChevronDown, ChevronRight, ZoomIn,
  ZoomOut, Maximize2, Package, GripVertical, Minus, Dot
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_BASE || '';
const COLORS = ['#3B82F6', '#8B5CF6', '#14B8A6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'];
const getColor = (i) => COLORS[i % COLORS.length];
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const CARD_W = 200, SUB_W = 148;
const CAT_H = 172, SUB_H = 96;
const GAP_X = 260, GAP_Y = 120;

function calcDefaultLayout(categories) {
  const pos = {};
  categories.forEach((cat, ci) => {
    const cx = 40 + ci * GAP_X;
    const cy = 40;
    pos[`cat-${cat.id}`] = { x: cx, y: cy };
    (cat.subcategories || []).forEach((sub, si) => {
      const totalW = (cat.subcategories?.length || 1) * (SUB_W + 8) - 8;
      const startX = cx + CARD_W / 2 - totalW / 2;
      pos[`sub-${sub.id}`] = { x: startX + si * (SUB_W + 8), y: cy + CAT_H + GAP_Y };
    });
  });
  return pos;
}

export default function CategoriesManager() {
  const [categories, setCategories] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState({});
  const [hovered, setHovered] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [modal, setModal] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [moveWizard, setMoveWizard] = useState(null);
  const [nodePos, setNodePos] = useState({});
  const [dragging, setDragging] = useState(null);
  const [dragOff, setDragOff] = useState({});
  const canvasRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const h = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
      const r = await fetch(`${API}/api/categories`, { headers: h });
      const j = await r.json();
      if (j.success) {
        const cats = j.data.categories || [];
        setCategories(cats);
        setAllItems(j.data.all || []);
        setNodePos(calcDefaultLayout(cats));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const apiCall = async (method, path, body) => {
    try {
      const r = await fetch(`${API}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: body ? JSON.stringify(body) : undefined,
      });
      return await r.json();
    } catch (e) { return { success: false, message: e.message }; }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    d.slug = slugify(d.name);
    const r = await apiCall('POST', '/api/categories', d);
    if (r.success) { setModal(null); fetchData(); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    d.slug = slugify(d.name || editTarget?.name);
    const r = await apiCall('PUT', `/api/categories/${editTarget.id}`, d);
    if (r.success) { setModal(null); setEditTarget(null); fetchData(); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const r = await apiCall('DELETE', `/api/categories/${deleteTarget.id}`, { strategy: 'delete_tree' });
    if (r.success) { setDeleteTarget(null); fetchData(); }
  };

  const handleMove = async () => {
    if (!moveWizard) return;
    const r = await apiCall('PUT', `/api/categories/${moveWizard.subId}/move`, { new_parent_id: moveWizard.toId });
    if (r.success) { setMoveWizard(null); fetchData(); }
  };

  const toggleCollapse = (id) => setCollapsed(p => ({ ...p, [id]: !p[id] }));

  const filtered = categories.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.subcategories.some(s => s.name.toLowerCase().includes(search.toLowerCase()))
  );

  const subIdSet = new Set();
  filtered.forEach(c => (c.subcategories || []).forEach(s => subIdSet.add(s.id)));

  const lines = [];
  if (!loading) {
    filtered.forEach(cat => {
      const base = nodePos[`cat-${cat.id}`];
      const dOff = dragOff[`cat-${cat.id}`] || { x: 0, y: 0 };
      const cp = base ? { x: base.x + dOff.x, y: base.y + dOff.y } : null;
      if (!cp) return;
      const subs = (cat.subcategories || []).filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()));
      subs.forEach(sub => {
        const sBase = nodePos[`sub-${sub.id}`];
        const sOff = dragOff[`sub-${sub.id}`] || { x: 0, y: 0 };
        const sp = sBase ? { x: sBase.x + sOff.x, y: sBase.y + sOff.y } : null;
        if (!sp) return;
        const color = getColor(categories.findIndex(c => c.id === cat.id));
        const hi = hovered === cat.id || hovered === sub.id;
        lines.push({
          id: `${cat.id}-${sub.id}`,
          x1: cp.x + CARD_W / 2, y1: cp.y + CAT_H,
          x2: sp.x + SUB_W / 2, y2: sp.y,
          color, hi,
        });
      });
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', background: '#F4F6F9', overflow: 'hidden' }}>
      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#D1D5DB; border-radius:4px; }
      `}</style>

      {/* TOP BAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #E5E7EB', background: '#fff', flexShrink: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FolderTree size={14} color='#fff' />
          </div>
          <h1 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Category Builder</h1>
          <span style={{ fontSize: 10, color: '#9CA3AF', background: '#F3F4F6', padding: '2px 8px', borderRadius: 10 }}>{categories.length} cats</span>
          <span style={{ fontSize: 10, color: '#9CA3AF' }}>{' | '}</span>
          <span style={{ fontSize: 10, color: '#6B7280' }}>Drag cards to arrange · Move button to reassign</span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={12} style={{ position: 'absolute', left: 8, top: 7, color: '#9CA3AF' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder='Search...' style={{ width: 160, padding: '5px 8px 5px 26px', borderRadius: 6, border: '1.5px solid #E5E7EB', fontSize: 11, outline: 'none', background: '#F9FAFB' }} />
          </div>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.15))} style={{ padding: 4, borderRadius: 5, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', display: 'flex' }}><ZoomIn size={13} color='#6B7280' /></button>
          <span style={{ fontSize: 10, color: '#9CA3AF', minWidth: 28, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.max(0.3, z - 0.15))} style={{ padding: 4, borderRadius: 5, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', display: 'flex' }}><ZoomOut size={13} color='#6B7280' /></button>
          <button onClick={() => setZoom(1)} style={{ padding: 4, borderRadius: 5, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', display: 'flex' }}><Maximize2 size={13} color='#6B7280' /></button>
          <button onClick={() => { setNodePos(calcDefaultLayout(categories)); }} style={{ padding: 4, borderRadius: 5, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#6B7280', paddingRight: 8 }}>
            <LayoutGrid size={12} /> Auto-layout
          </button>
          <div style={{ width: 1, height: 18, background: '#E5E7EB', margin: '0 4px' }} />
          <button onClick={() => setModal('createCat')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6, border: 'none', background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={12} /> Category
          </button>
          <button onClick={() => setModal('createSub')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6, border: '1.5px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={12} /> Subcategory
          </button>
        </div>
      </div>

      {/* CANVAS */}
      <div ref={canvasRef} style={{ flex: 1, overflow: 'auto', position: 'relative', backgroundImage: 'radial-gradient(circle, #D1D5DB 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', minHeight: '100%', position: 'relative' }}>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#9CA3AF', fontSize: 13, gap: 8 }}>
              <div className='animate-spin' style={{ width: 16, height: 16, border: '2px solid #E5E7EB', borderTopColor: '#7C3AED', borderRadius: '50%' }} />
              Loading...
            </div>
          ) : categories.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#9CA3AF', gap: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FolderTree size={26} color='#D1D5DB' />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#6B7280' }}>Drop your first category here</div>
              <button onClick={() => setModal('createCat')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
                <Plus size={14} /> Create Category
              </button>
            </div>
          ) : (
            <>
              {/* SVG LINES */}
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible', zIndex: 0 }}>
                {lines.map(l => (
                  <path
                    key={l.id}
                    d={`M${l.x1},${l.y1} C${l.x1},${l.y1 + 28} ${l.x2},${l.y2 - 28} ${l.x2},${l.y2}`}
                    fill='none'
                    stroke={l.hi ? l.color : '#CBD5E1'}
                    strokeWidth={l.hi ? 2.5 : 1.5}
                    opacity={l.hi ? 1 : 0.4}
                    style={{
                      transition: 'stroke 0.2s, opacity 0.2s, stroke-width 0.2s',
                      strokeDasharray: l.hi ? 'none' : '5 4',
                      filter: l.hi ? `drop-shadow(0 0 5px ${l.color}55)` : 'none',
                    }}
                  />
                ))}
              </svg>

              {/* NODES */}
              <AnimatePresence>
                {filtered.map((cat, ci) => {
                  const color = getColor(ci);
                  const cp = nodePos[`cat-${cat.id}`];
                  if (!cp) return null;
                  return <CatNode key={cat.id} cat={cat} color={color} cp={cp}
                    collapsed={collapsed[cat.id]}
                    toggle={() => toggleCollapse(cat.id)}
                    hovered={hovered === cat.id}
                    onHover={setHovered}
                    search={search}
                    onEdit={() => { setEditTarget(cat); setModal('edit'); }}
                    onDelete={() => setDeleteTarget(cat)}
                    nodePos={nodePos}
                    onPosChange={(id, p) => setNodePos(prev => ({ ...prev, [id]: p }))}
                    dragging={dragging}
                    setDragging={setDragging}
                    allCats={categories}
                    onMove={(sub) => {
                      const fr = categories.find(p => p.subcategories.some(s => s.id === sub.id));
                      setMoveWizard({ sub, from: fr?.name, to: null, toId: null, subId: sub.id });
                    }}
                    dragOff={dragOff}
                    setDragOff={setDragOff}
                  />;
                })}
                {filtered.map(cat => (cat.subcategories || [])
                  .filter(s => !collapsed[cat.id])
                  .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()))
                  .map(sub => {
                    const sp = nodePos[`sub-${sub.id}`];
                    if (!sp) return null;
                    const ci = categories.findIndex(c => c.id === cat.id);
                    return <SubNode key={sub.id} sub={sub} color={getColor(ci)} sp={sp}
                      hovered={hovered === sub.id}
                      onHover={setHovered}
                      onEdit={() => { setEditTarget(sub); setModal('edit'); }}
                      onDelete={() => setDeleteTarget(sub)}
                      onMove={() => {
                        const fr = categories.find(p => p.subcategories.some(s => s.id === sub.id));
                        setMoveWizard({ sub, from: fr?.name, to: null, toId: null, subId: sub.id });
                      }}
                      nodePos={nodePos}
                      onPosChange={(id, p) => setNodePos(prev => ({ ...prev, [id]: p }))}
                      dragging={dragging}
                      setDragging={setDragging}
                      dragOff={dragOff}
                      setDragOff={setDragOff}
                    />;
                  })
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>

      {/* MODALS — same as before */}
      <Layer show={modal === 'createCat'} onClose={() => setModal(null)} title='Create Category' accent>
        <form onSubmit={handleCreate}>
          <Field name='name' label='Category Name' req />
          <Field name='description' label='Description' area />
          <Field name='image_url' label='Image URL' ph='https://...' />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <Btn sec onClick={() => setModal(null)}>Cancel</Btn>
            <Btn prim icon={<Save size={12} />}>Create</Btn>
          </div>
        </form>
      </Layer>

      <Layer show={modal === 'createSub'} onClose={() => setModal(null)} title='Create Subcategory' accent>
        <form onSubmit={handleCreate}>
          <Field name='name' label='Subcategory Name' req />
          <Field name='description' label='Description' area />
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 3 }}>Parent Category *</label>
            <select name='parent_id' required style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1.5px solid #E5E7EB', fontSize: 11, outline: 'none', background: '#F9FAFB' }}>
              <option value=''>Select parent...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <Btn sec onClick={() => setModal(null)}>Cancel</Btn>
            <Btn prim icon={<Save size={12} />}>Create</Btn>
          </div>
        </form>
      </Layer>

      <Layer show={modal === 'edit'} onClose={() => { setModal(null); setEditTarget(null); }} title={`Edit: ${editTarget?.name || ''}`}>
        <form onSubmit={handleUpdate}>
          <Field name='name' label='Name' def={editTarget?.name} />
          <Field name='description' label='Description' area def={editTarget?.description} />
          <Field name='image_url' label='Image URL' def={editTarget?.image_url} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <Btn sec onClick={() => { setModal(null); setEditTarget(null); }}>Cancel</Btn>
            <Btn prim icon={<Save size={12} />}>Update</Btn>
          </div>
        </form>
      </Layer>

      <Layer show={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={`Delete ${deleteTarget?.name || ''}?`}>
        <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.6, marginBottom: 12 }}>
          Permanently delete <strong>{deleteTarget?.name}</strong>
          {deleteTarget?.subcategory_count > 0 && ` and ${deleteTarget.subcategory_count} subcategories`}.
          {deleteTarget?.product_count > 0 && ` ${deleteTarget.product_count} products unlinked.`}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Btn sec onClick={() => setDeleteTarget(null)}>Cancel</Btn>
          <Btn danger icon={<Trash2 size={12} />} onClick={handleDelete}>Delete</Btn>
        </div>
      </Layer>

      <Layer show={!!moveWizard && !moveWizard?.toId} onClose={() => setMoveWizard(null)} title='Move Subcategory'>
        <div style={{ fontSize: 11, color: '#374151', marginBottom: 12 }}>
          Move <strong>{moveWizard?.sub?.name}</strong>
          {moveWizard?.from ? ` from "${moveWizard.from}"` : ''}:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12, maxHeight: 200, overflowY: 'auto' }}>
          {categories.filter(c => c.id !== moveWizard?.sub?.parent_id).map(c => (
            <button key={c.id} onClick={() => setMoveWizard(p => ({ ...p, to: c.name, toId: c.id }))}
              style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', fontSize: 11, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}>
              <LayoutGrid size={12} color='#7C3AED' />
              <span style={{ fontWeight: 600 }}>{c.name}</span>
              <span style={{ color: '#9CA3AF', marginLeft: 'auto', fontSize: 10 }}>{c.subcategory_count || 0} subcats</span>
            </button>
          ))}
        </div>
      </Layer>

      <Layer show={!!moveWizard?.toId} onClose={() => setMoveWizard(null)} title='Confirm Move'>
        <div style={{ fontSize: 11, color: '#374151', marginBottom: 14, lineHeight: 1.6 }}>
          Move <strong>{moveWizard?.sub?.name}</strong>
          {moveWizard?.from ? ` from "${moveWizard.from}"` : ''}
          {moveWizard?.to ? ` to "${moveWizard.to}"?` : ''}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Btn sec onClick={() => setMoveWizard(null)}>Cancel</Btn>
          <Btn prim icon={<Move size={12} />} onClick={handleMove}>Move</Btn>
        </div>
      </Layer>

    </div>
  );
}

/* ── CATEGORY NODE ── */
function CatNode({ cat, color, cp, collapsed, toggle, hovered, onHover, search, onEdit, onDelete, nodePos, onPosChange, dragging, setDragging, dragOff, setDragOff, allCats, onMove }) {
  const subs = (cat.subcategories || []).filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      style={{ position: 'absolute', left: cp.x, top: cp.y, zIndex: hovered ? 5 : 1 }}
      onMouseEnter={() => onHover(cat.id)}
      onMouseLeave={() => onHover(null)}
    >
      <motion.div
        drag
        dragMomentum={false}
        onDragStart={() => setDragging(`cat-${cat.id}`)}
        onDrag={(_, info) => setDragOff(prev => ({ ...prev, [`cat-${cat.id}`]: { x: info.offset.x, y: info.offset.y } }))}
        onDragEnd={(_, info) => {
          setDragging(null);
          setDragOff(prev => { const n = { ...prev }; delete n[`cat-${cat.id}`]; return n; });
          const nx = Math.round((cp.x + info.offset.x) / 10) * 10;
          const ny = Math.round((cp.y + info.offset.y) / 10) * 10;
          onPosChange(`cat-${cat.id}`, { x: nx, y: ny });
          subs.forEach(sub => {
            const sp = nodePos[`sub-${sub.id}`];
            if (sp) {
              const sx = Math.round((sp.x + info.offset.x) / 10) * 10;
              const sy = Math.round((sp.y + info.offset.y) / 10) * 10;
              onPosChange(`sub-${sub.id}`, { x: sx, y: sy });
            }
          });
        }}
        style={{
          width: CARD_W, background: '#fff', borderRadius: 13,
          border: `2px solid ${hovered ? color + '99' : '#E5E7EB'}`,
          boxShadow: hovered ? `0 8px 25px ${color}22, 0 2px 8px rgba(0,0,0,0.06)` : '0 2px 8px rgba(0,0,0,0.04)',
          cursor: dragging === `cat-${cat.id}` ? 'grabbing' : 'grab',
          overflow: 'hidden', position: 'relative',
        }}
        whileHover={{ boxShadow: `0 8px 30px ${color}18, 0 2px 12px rgba(0,0,0,0.08)` }}
      >
        <div style={{ height: 60, background: cat.image_url ? `url(${cat.image_url}) center/cover` : `linear-gradient(135deg, ${color}18, ${color}06)`, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #F3F4F6', position: 'relative' }}>
          {!cat.image_url && <LayoutGrid size={20} color={color} opacity={0.25} />}
          <button onClick={toggle}
            style={{ position: 'absolute', top: 5, right: 5, width: 20, height: 20, borderRadius: 5, border: 'none', background: 'rgba(255,255,255,0.92)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            {collapsed ? <ChevronRight size={11} color='#6B7280' /> : <ChevronDown size={11} color='#6B7280' />}
          </button>
        </div>
        <div style={{ padding: '8px 12px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{cat.name}</span>
            <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 7, background: cat.is_active ? '#DCFCE7' : '#FEE2E2', color: cat.is_active ? '#16A34A' : '#EF4444', fontWeight: 600 }}>
              {cat.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          {cat.description && <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 5, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{cat.description}</div>}
          <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '2px 5px', background: '#F9FAFB', borderRadius: 4, fontSize: 9, color: '#6B7280' }}><Package size={8} /> {cat.product_count || 0}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '2px 5px', background: '#F9FAFB', borderRadius: 4, fontSize: 9, color: '#6B7280' }}><LayoutGrid size={8} /> {cat.subcategory_count || subs.length} sub</div>
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            <MiniBtn icon={<Edit3 size={10} />} color='#3B82F6' onClick={onEdit} />
            <MiniBtn icon={<Trash2 size={10} />} color='#EF4444' onClick={onDelete} />
          </div>
        </div>
        <Handle cx={CARD_W / 2} cy={CAT_H} color={color} />
      </motion.div>
    </motion.div>
  );
}

/* ── SUBCATEGORY NODE ── */
function SubNode({ sub, color, sp, hovered, onHover, onEdit, onDelete, onMove, nodePos, onPosChange, dragging, setDragging, dragOff, setDragOff }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      style={{ position: 'absolute', left: sp.x, top: sp.y, zIndex: hovered ? 5 : 1 }}
      onMouseEnter={() => onHover(sub.id)}
      onMouseLeave={() => onHover(null)}
    >
      <motion.div
        drag
        dragMomentum={false}
        onDragStart={() => setDragging(`sub-${sub.id}`)}
        onDrag={(_, info) => setDragOff(prev => ({ ...prev, [`sub-${sub.id}`]: { x: info.offset.x, y: info.offset.y } }))}
        onDragEnd={(_, info) => {
          setDragging(null);
          setDragOff(prev => { const n = { ...prev }; delete n[`sub-${sub.id}`]; return n; });
          const nx = Math.round((sp.x + info.offset.x) / 10) * 10;
          const ny = Math.round((sp.y + info.offset.y) / 10) * 10;
          onPosChange(`sub-${sub.id}`, { x: nx, y: ny });
        }}
        style={{
          width: SUB_W, background: '#fff', borderRadius: 10,
          border: `1.5px solid ${hovered ? color : '#E5E7EB'}`,
          boxShadow: hovered ? `0 4px 14px ${color}22` : '0 1px 5px rgba(0,0,0,0.03)',
          cursor: dragging === `sub-${sub.id}` ? 'grabbing' : 'grab',
          padding: '7px 9px',
        }}
        whileHover={{ boxShadow: `0 4px 16px ${color}18, 0 2px 8px rgba(0,0,0,0.06)` }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, minWidth: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.name}</span>
          </div>
          <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 5, background: sub.is_active ? '#DCFCE7' : '#FEE2E2', color: sub.is_active ? '#16A34A' : '#EF4444', fontWeight: 600, flexShrink: 0 }}>
            {sub.is_active ? 'A' : 'I'}
          </span>
        </div>
        <div style={{ fontSize: 9, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 3, marginBottom: 3 }}>
          <Package size={7} /> {sub.product_count || 0} products
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          <MiniBtn icon={<Edit3 size={8} />} color='#3B82F6' onClick={onEdit} />
          <MiniBtn icon={<Trash2 size={8} />} color='#EF4444' onClick={onDelete} />
          <MiniBtn icon={<Move size={8} />} color='#8B5CF6' onClick={onMove} />
        </div>
        <HandleTop cx={SUB_W / 2} color={color} />
      </motion.div>
    </motion.div>
  );
}

/* ── HANDLE DOTS for connector visual ── */
function Handle({ cx, cy, color }) {
  return (
    <div style={{ position: 'absolute', left: cx - 4, bottom: -4, width: 8, height: 8, borderRadius: '50%', background: '#fff', border: `2px solid ${color}88`, zIndex: 2 }} />
  );
}
function HandleTop({ cx, color }) {
  return (
    <div style={{ position: 'absolute', left: cx - 4, top: -4, width: 8, height: 8, borderRadius: '50%', background: '#fff', border: `2px solid ${color}88`, zIndex: 2 }} />
  );
}

/* ── SHARED UI ── */
function MiniBtn({ icon, color, onClick }) {
  return (
    <button onClick={onClick}
      style={{ padding: '2px 5px', borderRadius: 4, border: 'none', background: `${color}10`, color, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = `${color}20`}
      onMouseLeave={e => e.currentTarget.style.background = `${color}10`}>
      {icon}
    </button>
  );
}

function Layer({ show, onClose, title, accent, children }) {
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 13, width: 380, maxHeight: '70vh', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.18)', animation: 'slideIn 0.2s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #E5E7EB', background: accent ? 'linear-gradient(135deg,#7C3AED,#6D28D9)' : '#fff' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: accent ? '#fff' : '#111827' }}>{title}</span>
          <button onClick={onClose} style={{ width: 24, height: 24, borderRadius: 5, border: 'none', background: accent ? 'rgba(255,255,255,0.2)' : '#F3F4F6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={11} color={accent ? '#fff' : '#6B7280'} />
          </button>
        </div>
        <div style={{ padding: '14px 16px', overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ name, label, def, ph, area, req }) {
  const shared = { width: '100%', padding: '7px 10px', borderRadius: 6, border: '1.5px solid #E5E7EB', fontSize: 11, outline: 'none', background: '#F9FAFB', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' };
  const props = { name, required: req, defaultValue: def ?? '', placeholder: ph || `Enter ${label.toLowerCase()}...` };
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontSize: 10, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 3 }}>{label} {req && '*'}</label>
      {area ? <textarea rows={2} style={shared} {...props} /> : <input type='text' style={shared} {...props} />}
    </div>
  );
}

function Btn({ children, prim, sec, danger, icon, onClick }) {
  const base = { display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s' };
  let style;
  if (prim) style = { ...base, background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', color: '#fff' };
  else if (danger) style = { ...base, background: '#EF4444', color: '#fff' };
  else style = { ...base, background: '#fff', color: '#374151', border: '1.5px solid #E5E7EB' };
  return <button style={style} onClick={onClick} type={prim || danger ? 'submit' : 'button'}>{icon}{children}</button>;
}
