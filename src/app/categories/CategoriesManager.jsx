'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, X, Edit3, Trash2, Move, FolderTree, LayoutGrid,
  Save, ChevronDown, ChevronRight, ZoomIn, ZoomOut, Maximize2,
  Package, GripVertical
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_BASE || '';
const COLORS = ['#3B82F6', '#8B5CF6', '#14B8A6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'];
const getColor = (i) => COLORS[i % COLORS.length];
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function CategoriesManager() {
  const [categories, setCategories] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState({});
  const [hoverCat, setHoverCat] = useState(null);
  const [draggedSub, setDraggedSub] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [modal, setModal] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [moveWizard, setMoveWizard] = useState(null);
  const [lines, setLines] = useState([]);
  const canvasRef = useRef(null);
  const zoomRef = useRef(null);
  const cardRefs = useRef({});

  const fetchData = useCallback(async () => {
    try {
      const h = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
      const r = await fetch(`${API}/api/categories`, { headers: h });
      const j = await r.json();
      if (j.success) { setCategories(j.data.categories || []); setAllItems(j.data.all || []); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const recalcLines = useCallback(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const cr = canvasEl.getBoundingClientRect();
    const zoomVal = zoomRef.current ? zoom : 1;
    const result = [];
    Object.entries(cardRefs.current).forEach(([key, el]) => {
      if (!el || !key.startsWith('sub-')) return;
      const subId = parseInt(key.replace('sub-', ''));
      const item = allItems.find(i => i.id === subId);
      if (!item || !item.parent_id) return;
      const parentEl = cardRefs.current[`cat-${item.parent_id}`];
      if (!parentEl) return;
      const pr = parentEl.getBoundingClientRect();
      const sr = el.getBoundingClientRect();
      result.push({
        id: `${item.parent_id}-${subId}`,
        x1: (pr.left - cr.left + pr.width / 2) / zoomVal,
        y1: (pr.top - cr.top + pr.height) / zoomVal,
        x2: (sr.left - cr.left + sr.width / 2) / zoomVal,
        y2: (sr.top - cr.top) / zoomVal,
        color: getColor(categories.findIndex(c => c.id === item.parent_id)),
        highlighted: hoverCat === item.parent_id || hoverCat === subId,
      });
    });
    setLines(result);
  }, [categories, allItems, hoverCat, zoom]);

  useEffect(() => {
    const t = setTimeout(recalcLines, 60);
    return () => clearTimeout(t);
  }, [categories, collapsed, recalcLines]);

  useEffect(() => {
    window.addEventListener('resize', recalcLines);
    return () => window.removeEventListener('resize', recalcLines);
  }, [recalcLines]);

  const filtered = categories.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.subcategories.some(s => s.name.toLowerCase().includes(search.toLowerCase()))
  );

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

  const onDragStart = (e, subId) => { setDraggedSub(subId); e.dataTransfer.effectAllowed = 'move'; };
  const onDragOver = (e, catId) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDropTarget(catId); };
  const onDrop = (e, catId) => {
    e.preventDefault(); setDropTarget(null);
    if (!draggedSub) return;
    const sub = allItems.find(i => i.id === draggedSub);
    if (!sub || sub.parent_id === catId) { setDraggedSub(null); return; }
    const from = categories.find(c => c.id === sub.parent_id);
    const to = categories.find(c => c.id === catId);
    setMoveWizard({ sub, from: from?.name, to: to?.name, toId: catId, subId: draggedSub });
    setDraggedSub(null);
  };
  const toggleCollapse = (id) => setCollapsed(p => ({ ...p, [id]: !p[id] }));

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9CA3AF', fontSize: 14 }}>
        <div className='animate-spin' style={{ width: 18, height: 18, border: '2px solid #E5E7EB', borderTopColor: '#7C3AED', borderRadius: '50%', marginRight: 8 }} />
        Loading categories...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', background: '#F4F6F9', overflow: 'hidden' }}>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 4px; }
      `}</style>

      {/* TOP BAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #E5E7EB', background: '#fff', flexShrink: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FolderTree size={14} color='#fff' />
          </div>
          <h1 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Category Hierarchy</h1>
          <span style={{ fontSize: 10, color: '#9CA3AF', background: '#F3F4F6', padding: '2px 8px', borderRadius: 10 }}>{categories.length} categories</span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={12} style={{ position: 'absolute', left: 8, top: 7, color: '#9CA3AF' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder='Search...' style={{ width: 180, padding: '5px 8px 5px 26px', borderRadius: 6, border: '1.5px solid #E5E7EB', fontSize: 11, outline: 'none', background: '#F9FAFB' }} />
          </div>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.15))} style={{ padding: 4, borderRadius: 5, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', display: 'flex' }}><ZoomIn size={13} color='#6B7280' /></button>
          <span style={{ fontSize: 10, color: '#9CA3AF', minWidth: 28, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.max(0.4, z - 0.15))} style={{ padding: 4, borderRadius: 5, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', display: 'flex' }}><ZoomOut size={13} color='#6B7280' /></button>
          <button onClick={() => setZoom(1)} style={{ padding: 4, borderRadius: 5, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', display: 'flex' }}><Maximize2 size={13} color='#6B7280' /></button>
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
      <div ref={canvasRef} style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {/* SVG WIRES (outside zoom container, so coords match canvasRef) */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, overflow: 'visible' }}>
          {lines.map(l => (
            <path
              key={l.id}
              d={`M${l.x1},${l.y1} C${l.x1},${l.y1 + 22} ${l.x2},${l.y2 - 22} ${l.x2},${l.y2}`}
              fill='none'
              stroke={l.highlighted ? l.color : '#CBD5E1'}
              strokeWidth={l.highlighted ? 2.5 : 1.5}
              opacity={l.highlighted ? 1 : 0.45}
              style={{
                transition: 'all 0.25s ease',
                strokeDasharray: l.highlighted ? 'none' : '5 4',
                filter: l.highlighted ? `drop-shadow(0 0 5px ${l.color}55)` : 'none',
              }}
            />
          ))}
        </svg>
        <div ref={zoomRef} style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', minHeight: '100%', padding: '20px 28px', transition: 'transform 0.2s' }}>

          {categories.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#9CA3AF', gap: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FolderTree size={26} color='#D1D5DB' />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#6B7280' }}>Create your first category</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>Organize products with categories and subcategories</div>
              <button onClick={() => setModal('createCat')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', marginTop: 6 }}>
                <Plus size={14} /> Create Category
              </button>
            </div>
          ) : (
            <>
              {/* CATEGORY GROUPS */}
              <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                {filtered.map((cat, ci) => {
                  const subs = cat.subcategories || [];
                  const color = getColor(ci);
                  const isCollapsed = collapsed[cat.id];
                  const isHovered = hoverCat === cat.id;
                  return (
                    <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, animation: 'slideIn 0.3s ease both', animationDelay: `${ci * 0.04}s` }}
                      onMouseEnter={() => setHoverCat(cat.id)} onMouseLeave={() => setHoverCat(null)}>

                      {/* PARENT CARD */}
                      <div
                        ref={el => { cardRefs.current[`cat-${cat.id}`] = el; }}
                        onDragOver={e => onDragOver(e, cat.id)}
                        onDragLeave={() => setDropTarget(null)}
                        onDrop={e => onDrop(e, cat.id)}
                        style={{
                          width: 190, background: '#fff', borderRadius: 13,
                          border: `2px solid ${dropTarget === cat.id ? color : isHovered ? color + '88' : '#E5E7EB'}`,
                          boxShadow: isHovered ? `0 8px 25px ${color}22, 0 2px 8px rgba(0,0,0,0.06)` : '0 2px 8px rgba(0,0,0,0.04)',
                          transition: 'all 0.2s ease', overflow: 'hidden', cursor: 'default',
                          transform: dropTarget === cat.id ? 'scale(1.03)' : 'scale(1)',
                          position: 'relative',
                        }}
                      >
                        {/* Image area */}
                        <div style={{ height: 64, background: cat.image_url ? `url(${cat.image_url}) center/cover` : `linear-gradient(135deg, ${color}18, ${color}06)`, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #F3F4F6', position: 'relative' }}>
                          {!cat.image_url && <LayoutGrid size={22} color={color} opacity={0.25} />}
                          <button onClick={() => toggleCollapse(cat.id)}
                            style={{ position: 'absolute', top: 5, right: 5, width: 20, height: 20, borderRadius: 5, border: 'none', background: 'rgba(255,255,255,0.92)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                            {isCollapsed ? <ChevronRight size={11} color='#6B7280' /> : <ChevronDown size={11} color='#6B7280' />}
                          </button>
                        </div>
                        {/* Body */}
                        <div style={{ padding: '9px 12px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{cat.name}</span>
                            <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 7, background: cat.is_active ? '#DCFCE7' : '#FEE2E2', color: cat.is_active ? '#16A34A' : '#EF4444', fontWeight: 600 }}>
                              {cat.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          {cat.description && <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 6, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{cat.description}</div>}
                          <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '2px 5px', background: '#F9FAFB', borderRadius: 4, fontSize: 9, color: '#6B7280' }}>
                              <Package size={8} /> {cat.product_count || 0}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '2px 5px', background: '#F9FAFB', borderRadius: 4, fontSize: 9, color: '#6B7280' }}>
                              <LayoutGrid size={8} /> {cat.subcategory_count || subs.length} sub
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 3 }}>
                            <MiniBtn icon={<Edit3 size={10} />} color='#3B82F6' onClick={() => { setEditTarget(cat); setModal('edit'); }} />
                            <MiniBtn icon={<Trash2 size={10} />} color='#EF4444' onClick={() => setDeleteTarget(cat)} />
                          </div>
                        </div>
                        {dropTarget === cat.id && (
                          <div style={{ position: 'absolute', inset: 0, border: '2px dashed ' + color, borderRadius: 11, pointerEvents: 'none', background: `${color}08` }} />
                        )}
                      </div>

                      {/* Connector stem */}
                      <AnimatePresence>
                        {!isCollapsed && (
                          <motion.div initial={{ height: 0 }} animate={{ height: subs.length ? 14 : 0 }} exit={{ height: 0 }} style={{ width: 2, background: `linear-gradient(to bottom, ${color}77, ${color}22)`, transition: 'height 0.3s' }} />
                        )}
                      </AnimatePresence>

                      {/* SUBCATEGORIES ROW */}
                      <AnimatePresence>
                        {!isCollapsed && subs.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', overflow: 'hidden', paddingTop: 6 }}
                          >
                            {subs.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase())).map(sub => (
                              <div
                                key={sub.id}
                                ref={el => { cardRefs.current[`sub-${sub.id}`] = el; }}
                                draggable
                                onDragStart={e => onDragStart(e, sub.id)}
                                style={{
                                  width: 138, background: '#fff', borderRadius: 9,
                                  border: `1.5px solid ${hoverCat === sub.id ? color : '#E5E7EB'}`,
                                  boxShadow: hoverCat === sub.id ? `0 4px 12px ${color}22` : '0 1px 5px rgba(0,0,0,0.03)',
                                  padding: '7px 9px', cursor: 'grab', transition: 'all 0.2s ease',
                                  opacity: draggedSub === sub.id ? 0.25 : 1,
                                  transform: draggedSub === sub.id ? 'scale(0.92)' : 'scale(1)',
                                }}
                                onMouseEnter={() => setHoverCat(sub.id)}
                                onMouseLeave={() => setHoverCat(null)}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, minWidth: 0 }}>
                                    <GripVertical size={9} color='#D1D5DB' style={{ flexShrink: 0 }} />
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
                                  <MiniBtn icon={<Edit3 size={8} />} color='#3B82F6' onClick={() => { setEditTarget(sub); setModal('edit'); }} />
                                  <MiniBtn icon={<Trash2 size={8} />} color='#EF4444' onClick={() => setDeleteTarget(sub)} />
                                  <MiniBtn icon={<Move size={8} />} color='#8B5CF6' onClick={() => {
                                    const fr = categories.find(p => p.subcategories.some(s => s.id === sub.id));
                                    setMoveWizard({ sub, from: fr?.name, to: null, toId: null, subId: sub.id });
                                  }} />
                                </div>
                              </div>
                            ))}
                            {subs.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase())).length === 0 && null}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {!isCollapsed && subs.length === 0 && (
                        <div style={{ fontSize: 9, color: '#D1D5DB', padding: '4px 0', fontStyle: 'italic' }}>No subcategories</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* CREATE CATEGORY */}
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

      {/* CREATE SUBCATEGORY */}
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

      {/* EDIT */}
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

      {/* DELETE */}
      <Layer show={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={`Delete ${deleteTarget?.name || ''}?`}>
        <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.6, marginBottom: 12 }}>
          Permanently delete <strong>{deleteTarget?.name}</strong>
          {deleteTarget?.subcategory_count > 0 && ` and ${deleteTarget.subcategory_count} subcategories`}.
          {deleteTarget?.product_count > 0 && ` ${deleteTarget.product_count} products will be unlinked.`}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Btn sec onClick={() => setDeleteTarget(null)}>Cancel</Btn>
          <Btn danger icon={<Trash2 size={12} />} onClick={handleDelete}>Delete</Btn>
        </div>
      </Layer>

      {/* MOVE - SELECT DESTINATION */}
      <Layer show={!!moveWizard && !moveWizard?.toId} onClose={() => setMoveWizard(null)} title='Move Subcategory'>
        <div style={{ fontSize: 11, color: '#374151', marginBottom: 12 }}>
          Move <strong>{moveWizard?.sub?.name}</strong>
          {moveWizard?.from ? ` from "${moveWizard.from}"` : ''} — choose destination:
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

      {/* MOVE - CONFIRM */}
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

/* ── Shared Components ── */

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
