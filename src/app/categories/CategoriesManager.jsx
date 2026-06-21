'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Search, X, Edit3, Trash2, Move, Image, Package,
  DollarSign, ShoppingCart, TrendingUp, AlertTriangle,
  FolderTree, LayoutGrid, Save, SlidersHorizontal
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_BASE || '';

const COLORS = ['#3B82F6', '#8B5CF6', '#14B8A6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'];
const getColor = (i) => COLORS[i % COLORS.length];

function formatCurrency(n) {
  if (!n || isNaN(n)) return '₹0';
  return '₹' + Number(n).toLocaleString('en-IN');
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function CategoriesManager() {
  const [categories, setCategories] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateCat, setShowCreateCat] = useState(false);
  const [showCreateSub, setShowCreateSub] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [moveConfirm, setMoveConfirm] = useState(null);
  const [draggedSubId, setDraggedSubId] = useState(null);
  const [hoveredParent, setHoveredParent] = useState(null);
  const [hoveredConnection, setHoveredConnection] = useState(null);
  const canvasRef = useRef(null);
  const cardRefs = useRef({});
  const [positions, setPositions] = useState({});
  const [showDeleteOptions, setShowDeleteOptions] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/categories`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      const json = await res.json();
      if (json.success) {
        setCategories(json.data.categories || []);
        setAllItems(json.data.all || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!canvasRef.current) return;
      const rects = {};
      Object.entries(cardRefs.current).forEach(([key, el]) => {
        if (el) {
          const r = el.getBoundingClientRect();
          const cr = canvasRef.current.getBoundingClientRect();
          rects[key] = { x: r.left - cr.left + r.width / 2, y: r.top - cr.top + r.height, w: r.width, h: r.height };
        }
      });
      setPositions(rects);
    }, 100);
    return () => clearTimeout(t);
  }, [categories, search]);

  const filteredCats = categories.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.subcategories.some(s => s.name.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredSubs = (subs) =>
    !search ? subs : subs.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.slug = slugify(data.name);
    try {
      const res = await fetch(`${API}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) { setShowCreateCat(false); fetchData(); }
    } catch (e) { console.error(e); }
  };

  const handleCreateSubcategory = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.slug = slugify(data.name);
    try {
      const res = await fetch(`${API}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) { setShowCreateSub(false); fetchData(); }
    } catch (e) { console.error(e); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    if (data.name) data.slug = slugify(data.name);
    try {
      const res = await fetch(`${API}/api/categories/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) { setEditing(null); fetchData(); }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async () => {
    if (!showDeleteOptions) return;
    try {
      const res = await fetch(`${API}/api/categories/${showDeleteOptions.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ strategy: 'delete_tree' }),
      });
      const json = await res.json();
      if (json.success) { setShowDeleteOptions(null); fetchData(); }
    } catch (e) { console.error(e); }
  };

  const handleMoveSubcategory = async (subId, newParentId) => {
    try {
      const res = await fetch(`${API}/api/categories/${subId}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ new_parent_id: newParentId }),
      });
      const json = await res.json();
      if (json.success) { setMoveConfirm(null); fetchData(); }
    } catch (e) { console.error(e); }
  };

  const onDragStart = (e, subId) => {
    setDraggedSubId(subId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e, catId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setHoveredParent(catId);
  };

  const onDragLeave = () => setHoveredParent(null);

  const onDrop = (e, catId) => {
    e.preventDefault();
    setHoveredParent(null);
    if (!draggedSubId) return;
    const sub = allItems.find(i => i.id === draggedSubId);
    const target = allItems.find(i => i.id === catId);
    if (!sub || !target || sub.parent_id === catId) return;
    setMoveConfirm({ sub, from: allItems.find(i => i.id === sub.parent_id), to: target });
    setDraggedSubId(null);
  };

  const CatCard = ({ cat, index }) => {
    const subs = filteredSubs(cat.subcategories || []);
    return (
      <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        <div
          ref={el => { cardRefs.current[`cat-${cat.id}`] = el; }}
          onDragOver={e => onDragOver(e, cat.id)}
          onDragLeave={onDragLeave}
          onDrop={e => onDrop(e, cat.id)}
          style={{
            width: 220, background: '#fff', borderRadius: 16, border: `2px solid ${hoveredParent === cat.id ? getColor(index) : '#E5E7EB'}`,
            boxShadow: hoveredParent === cat.id ? `0 8px 30px ${getColor(index)}22` : '0 4px 12px rgba(0,0,0,0.06)',
            transition: 'all 0.25s ease', cursor: 'default', position: 'relative', overflow: 'hidden',
            transform: hoveredParent === cat.id ? 'scale(1.02)' : 'scale(1)',
          }}
        >
          {cat.image_url && (
            <div style={{ height: 80, background: `url(${cat.image_url}) center/cover`, borderBottom: '1px solid #F3F4F6' }} />
          )}
          {!cat.image_url && (
            <div style={{ height: 80, background: `linear-gradient(135deg, ${getColor(index)}22, ${getColor(index)}11)`, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #F3F4F6' }}>
              <LayoutGrid size={28} color={getColor(index)} opacity={0.4} />
            </div>
          )}
          <div style={{ padding: '14px 16px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{cat.name}</span>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: cat.is_active ? '#DCFCE7' : '#FEE2E2', color: cat.is_active ? '#16A34A' : '#EF4444', fontWeight: 600 }}>{cat.is_active ? 'Active' : 'Inactive'}</span>
            </div>
            {cat.description && <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 8, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{cat.description}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: 10 }}>
              <Metric icon={<Package size={10} />} label='Products' value={String(cat.product_count || 0)} />
              <Metric icon={<LayoutGrid size={10} />} label='Subcats' value={String(cat.subcategory_count || subs.length)} />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <CtaBtn icon={<Edit3 size={12} />} label='Edit' color='#3B82F6' onClick={() => setEditing(cat)} />
              <CtaBtn icon={<Trash2 size={12} />} label='Delete' color='#EF4444' onClick={() => setShowDeleteOptions(cat)} />
            </div>
          </div>
          {hoveredParent === cat.id && (
            <div style={{ position: 'absolute', inset: 0, border: '3px dashed ' + getColor(index), borderRadius: 14, pointerEvents: 'none', animation: 'pulse-border 1.5s infinite' }} />
          )}
        </div>

        {subs.length > 0 && (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', padding: '8px 0 0' }}>
            {subs.map((sub, si) => {
              const subKey = `sub-${sub.id}`;
              return (
                <div
                  key={sub.id}
                  ref={el => { cardRefs.current[subKey] = el; }}
                  draggable
                  onDragStart={e => onDragStart(e, sub.id)}
                  style={{
                    width: 160, background: '#fff', borderRadius: 12, border: `1.5px solid ${hoveredConnection === sub.id ? getColor(index) : '#E5E7EB'}`,
                    boxShadow: hoveredConnection === sub.id ? `0 4px 16px ${getColor(index)}22` : '0 2px 8px rgba(0,0,0,0.04)',
                    padding: '10px 12px', cursor: 'grab', transition: 'all 0.2s ease', position: 'relative',
                    opacity: draggedSubId === sub.id ? 0.4 : 1,
                    transform: draggedSubId === sub.id ? 'scale(0.95)' : 'scale(1)',
                  }}
                  onMouseEnter={() => setHoveredConnection(sub.id)}
                  onMouseLeave={() => setHoveredConnection(null)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{sub.name}</span>
                    <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 8, background: sub.is_active ? '#DCFCE7' : '#FEE2E2', color: sub.is_active ? '#16A34A' : '#EF4444', fontWeight: 600 }}>{sub.is_active ? 'A' : 'I'}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 6 }}>
                    <Package size={10} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />
                    {sub.product_count || 0} products
                  </div>
                  <div style={{ display: 'flex', gap: 3 }}>
                    <button onClick={() => setEditing(sub)} style={{ padding: '2px 6px', borderRadius: 4, border: 'none', background: '#F3F4F6', color: '#3B82F6', fontSize: 9, cursor: 'pointer' }}><Edit3 size={10} /></button>
                    <button onClick={() => setShowDeleteOptions(sub)} style={{ padding: '2px 6px', borderRadius: 4, border: 'none', background: '#F3F4F6', color: '#EF4444', fontSize: 9, cursor: 'pointer' }}><Trash2 size={10} /></button>
                    <button onClick={() => {
                      const fromCat = categories.find(p => p.subcategories.some(s => s.id === sub.id));
                      setMoveConfirm({ sub, from: fromCat, to: null });
                    }} style={{ padding: '2px 6px', borderRadius: 4, border: 'none', background: '#F3F4F6', color: '#8B5CF6', fontSize: 9, cursor: 'pointer' }}><Move size={10} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9CA3AF', fontSize: 14 }}>
        <div className='animate-spin' style={{ width: 20, height: 20, border: '2px solid #E5E7EB', borderTopColor: '#7C3AED', borderRadius: '50%', marginRight: 8 }} />
        Loading categories...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', background: '#F8FAFC', overflow: 'hidden' }}>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-border { 0%,100% { border-color: transparent; } 50% { border-color: inherit; } }
        @keyframes line-dash { to { stroke-dashoffset: -20; } }
        .cat-card { animation: slideIn 0.3s ease both; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 4px; }
      `}</style>

      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #E5E7EB', background: '#fff', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FolderTree size={16} color='#fff' />
          </div>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Category Builder</h1>
          <span style={{ fontSize: 11, color: '#9CA3AF', background: '#F3F4F6', padding: '2px 10px', borderRadius: 12 }}>{categories.length} categories</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 8, color: '#9CA3AF' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder='Search categories or subcategories...' style={{ width: 240, padding: '7px 12px 7px 32px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 12, outline: 'none', background: '#F9FAFB' }} />
          </div>
          <button onClick={() => setShowCreateCat(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Create Category
          </button>
          <button onClick={() => setShowCreateSub(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1.5px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Create Subcategory
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={canvasRef} style={{ flex: 1, overflow: 'auto', padding: '32px 40px', position: 'relative' }}>
        {categories.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9CA3AF', gap: 16 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderTree size={32} color='#D1D5DB' />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#6B7280' }}>Create your first category to organize products</div>
            <div style={{ fontSize: 12, color: '#9CA3AF' }}>Use the buttons above to add categories and subcategories</div>
            <button onClick={() => setShowCreateCat(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>
              <Plus size={16} /> Create Category
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'flex-start', position: 'relative' }}>
            {filteredCats.map((cat, i) => <CatCard key={cat.id} cat={cat} index={i} />)}
          </div>
        )}
      </div>

      {/* Create Category Modal */}
      {showCreateCat && (
        <Modal onClose={() => setShowCreateCat(false)} title='Create Category' icon={<LayoutGrid size={16} />}>
          <form onSubmit={handleCreateCategory}>
            <Field label='Category Name' name='name' required />
            <Field label='Description' name='description' textarea />
            <Field label='Image URL' name='image_url' placeholder='https://...' />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button type='button' onClick={() => setShowCreateCat(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
              <button type='submit' style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}><Save size={14} /> Create</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Subcategory Modal */}
      {showCreateSub && (
        <Modal onClose={() => setShowCreateSub(false)} title='Create Subcategory' icon={<LayoutGrid size={16} />}>
          <form onSubmit={handleCreateSubcategory}>
            <Field label='Subcategory Name' name='name' required />
            <Field label='Description' name='description' textarea />
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Parent Category *</label>
              <select name='parent_id' required style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 12, outline: 'none', background: '#F9FAFB' }}>
                <option value=''>Select parent category...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button type='button' onClick={() => setShowCreateSub(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
              <button type='submit' style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}><Save size={14} /> Create</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editing && (
        <Modal onClose={() => setEditing(null)} title={`Edit: ${editing.name}`} icon={<Edit3 size={16} />}>
          <form onSubmit={handleUpdate}>
            <Field label='Name' name='name' defaultValue={editing.name} />
            <Field label='Description' name='description' textarea defaultValue={editing.description} />
            <Field label='Image URL' name='image_url' defaultValue={editing.image_url} />
            {editing.parent_id !== null && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Parent Category</label>
                <select name='parent_id' defaultValue={editing.parent_id || ''} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 12, outline: 'none', background: '#F9FAFB' }}>
                  <option value=''>None (make it a category)</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button type='button' onClick={() => setEditing(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
              <button type='submit' style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#3B82F6,#2563EB)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}><Save size={14} /> Update</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {showDeleteOptions && (
        <Modal onClose={() => setShowDeleteOptions(null)} title={`Delete: ${showDeleteOptions.name}`} icon={<AlertTriangle size={16} color='#EF4444' />}>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 16, lineHeight: 1.5 }}>
            This will permanently delete <strong>{showDeleteOptions.name}</strong>
            {showDeleteOptions.subcategory_count > 0 && ` and all its ${showDeleteOptions.subcategory_count} subcategories`}.
            {showDeleteOptions.product_count > 0 && ` ${showDeleteOptions.product_count} products will be unlinked.`}
            <br />This action cannot be undone.
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => setShowDeleteOptions(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleDelete} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#EF4444', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}><Trash2 size={14} /> Delete</button>
          </div>
        </Modal>
      )}

      {/* Move Confirmation */}
      {moveConfirm && (
        <Modal onClose={() => setMoveConfirm(null)} title='Move Subcategory' icon={<Move size={16} color='#8B5CF6' />}>
          <div style={{ fontSize: 12, color: '#374151', marginBottom: 16 }}>
            Move <strong>{moveConfirm.sub.name}</strong>
            {moveConfirm.from && ` from "${moveConfirm.from.name}"`}
            {moveConfirm.to ? ` to "${moveConfirm.to.name}"?` : ' — select destination:'}
          </div>
          {!moveConfirm.to && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              {categories.filter(c => c.id !== moveConfirm.sub.parent_id).map(c => (
                <button key={c.id} onClick={() => setMoveConfirm({ ...moveConfirm, to: c })}
                  style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <LayoutGrid size={14} color='#7C3AED' />
                  <span style={{ fontWeight: 600 }}>{c.name}</span>
                  <span style={{ color: '#9CA3AF', marginLeft: 'auto' }}>{c.subcategory_count || 0} subcategories</span>
                </button>
              ))}
            </div>
          )}
          {moveConfirm.to && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setMoveConfirm(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleMoveSubcategory(moveConfirm.sub.id, moveConfirm.to.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}><Move size={14} /> Move</button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function Modal({ onClose, title, icon, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: 420, maxHeight: '80vh', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.2)', animation: 'slideIn 0.2s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {icon}
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{title}</span>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: '#F3F4F6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} color='#6B7280' />
          </button>
        </div>
        <div style={{ padding: '16px 20px', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, textarea, required, defaultValue, placeholder }) {
  const props = {
    name,
    defaultValue: defaultValue ?? '',
    required,
    placeholder: placeholder || `Enter ${label.toLowerCase()}...`,
    style: { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 12, outline: 'none', background: '#F9FAFB', fontFamily: 'inherit', resize: 'vertical' },
  };
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{label} {required && '*'}</label>
      {textarea ? <textarea rows={3} {...props} /> : <input type='text' {...props} />}
    </div>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: '#F9FAFB', borderRadius: 6 }}>
      <span style={{ color: '#6B7280', display: 'flex' }}>{icon}</span>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: 8, color: '#9CA3AF' }}>{label}</div>
      </div>
    </div>
  );
}

function CtaBtn({ icon, label, color, onClick }) {
  return (
    <button onClick={onClick} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '5px 0', borderRadius: 6, border: `1px solid ${color}22`, background: `${color}08`, color, fontSize: 10, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
      onMouseEnter={e => { e.target.style.background = `${color}15`; }} onMouseLeave={e => { e.target.style.background = `${color}08`; }}>
      {icon} {label}
    </button>
  );
}
