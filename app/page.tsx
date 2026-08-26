'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

type Sheep = {
  id: number; tag_number: string; age: number; weight: number; breed: string;
  gender: string; status: string; medications: string; notes: string; updated_at: string; created_at: string;
};
type SheepForm = Omit<Sheep, 'id' | 'updated_at' | 'created_at'>;
const emptyForm: SheepForm = { tag_number: '', age: 1, weight: 50, breed: 'Akkaraman', gender: 'Dişi', status: 'Sağlıklı', medications: '', notes: '' };
const breeds = ['Akkaraman', 'Kıvırcık', 'Merinos', 'Karayaka', 'İvesi', 'Diğer'];

function formatDate(value: string) {
  const date = new Date(value.endsWith('Z') ? value : `${value.replace(' ', 'T')}Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
}

export default function Home() {
  const [records, setRecords] = useState<Sheep[]>([]);
  const [total, setTotal] = useState(364);
  const [resultTotal, setResultTotal] = useState(364);
  const [healthy, setHealthy] = useState(351);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Sheep | null>(null);
  const [form, setForm] = useState<SheepForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const loadRecords = useCallback(async (search = '') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sheep${search ? `?q=${encodeURIComponent(search)}` : ''}`);
      const data = await response.json();
      setRecords(data.records ?? []); setTotal(data.total ?? 0); setResultTotal(data.resultTotal ?? 0); setHealthy(data.healthy ?? 0);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { const timer = setTimeout(() => loadRecords(query), 260); return () => clearTimeout(timer); }, [query, loadRecords]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 2800); return () => clearTimeout(timer); }, [toast]);

  const controlCount = Math.max(0, total - healthy);
  const today = useMemo(() => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }).format(new Date()), []);

  function openCreate() { setEditing(null); setForm(emptyForm); setError(''); setModalOpen(true); }
  function openEdit(sheep: Sheep) {
    setEditing(sheep);
    setForm({ tag_number: sheep.tag_number, age: sheep.age, weight: sheep.weight, breed: sheep.breed, gender: sheep.gender, status: sheep.status, medications: sheep.medications, notes: sheep.notes });
    setError(''); setModalOpen(true);
  }

  async function submitForm(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError('');
    const response = await fetch(editing ? `/api/sheep/${editing.id}` : '/api/sheep', {
      method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    const data = await response.json(); setSaving(false);
    if (!response.ok) { setError(data.error || 'Kayıt sırasında bir sorun oluştu.'); return; }
    setModalOpen(false); setToast(editing ? `${form.tag_number} kaydı güncellendi.` : `${form.tag_number} sürüye eklendi.`); await loadRecords(query);
  }

  async function deleteSheep() {
    if (!editing || !window.confirm(`${editing.tag_number} numaralı koyun kaydı kalıcı olarak silinsin mi?`)) return;
    setSaving(true); const response = await fetch(`/api/sheep/${editing.id}`, { method: 'DELETE' }); setSaving(false);
    if (!response.ok) { setError('Kayıt silinemedi.'); return; }
    setModalOpen(false); setToast(`${editing.tag_number} kaydı silindi.`); await loadRecords(query);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark">İM</div><div><strong>İbrahim Müdürün Çiftliği</strong><span>Hayvan Yönetim Sistemi</span></div></div>
        <div className="top-actions"><span className="sync"><i /> Sistem güncel</span><button className="avatar" aria-label="Kullanıcı menüsü">İM</button></div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <nav aria-label="Ana menü">
            <a className="nav-item active" href="#"><span>⌂</span> Genel Bakış</a>
            <a className="nav-item" href="#suruler"><span>♧</span> Sürü Yönetimi</a>
            <a className="nav-item" href="#suruler"><span>♡</span> Sağlık Kayıtları</a>
            <a className="nav-item" href="#suruler"><span>▥</span> Raporlar</a>
          </nav>
          <div className="sidebar-note"><span>Çiftlik durumu</span><strong>Her şey yolunda</strong><small>Veriler anlık olarak kaydediliyor</small></div>
        </aside>

        <section className="content">
          <div className="eyebrow">{today}</div>
          <div className="page-heading"><div><h1>Günaydın, İbrahim Müdür</h1><p>Çiftliğinizin güncel durumuna genel bakış.</p></div><button className="primary-button" onClick={openCreate}><b>＋</b> Yeni koyun ekle</button></div>

          <div className="stats-grid">
            <article className="stat-card highlight"><div className="stat-icon">♧</div><div><span>Toplam koyun</span><strong>{total}</strong><small>Güncel sürü mevcudu</small></div></article>
            <article className="stat-card"><div className="stat-icon">✓</div><div><span>Sağlıklı</span><strong>{healthy}</strong><small>Sürünün %{total ? ((healthy / total) * 100).toFixed(1) : '0'}'i</small></div></article>
            <article className="stat-card"><div className="stat-icon amber">!</div><div><span>Kontrol bekleyen</span><strong>{controlCount}</strong><small>Sağlık takibi gerekli</small></div></article>
            <article className="stat-card"><div className="stat-icon blue">◷</div><div><span>Son güncelleme</span><strong className="date-stat">Şimdi</strong><small>Veriler güncel</small></div></article>
          </div>

          <section className="registry" id="suruler">
            <div className="registry-head"><div><h2>Sürü Kayıtları</h2><p>Kimlik, kilo ve sağlık bilgilerini tek yerden yönetin</p></div><button className="secondary-add" onClick={openCreate}>＋ Kayıt ekle</button></div>
            <div className="toolbar">
              <label className="search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value.toUpperCase())} aria-label="Küpe numarasıyla ara" placeholder="Küpe numarasıyla ara (örn. T1111)" />{query && <button onClick={() => setQuery('')} aria-label="Aramayı temizle">×</button>}</label>
              <div className="result-count">{loading ? 'Aranıyor…' : `${resultTotal} kayıt`}</div>
            </div>
            <div className="table-wrap">
              <table><thead><tr><th>KÜPE NO</th><th>YAŞ</th><th>KİLO</th><th>IRK</th><th>İLAÇ / TEDAVİ</th><th>DURUM</th><th>SON GÜNCELLEME</th><th /></tr></thead>
                <tbody>
                  {!loading && records.map((sheep) => <tr key={sheep.id} onClick={() => openEdit(sheep)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && openEdit(sheep)}>
                    <td><div className="tag-cell"><span className="sheep-dot">♧</span><strong>{sheep.tag_number}</strong></div></td><td>{sheep.age} yaş</td><td>{sheep.weight} kg</td><td>{sheep.breed}</td><td className="medication">{sheep.medications || '—'}</td><td><span className={`status ${sheep.status === 'Kontrol' ? 'warning' : ''}`}><i />{sheep.status}</span></td><td>{formatDate(sheep.updated_at)}</td><td><button className="row-more" onClick={(e) => { e.stopPropagation(); openEdit(sheep); }} aria-label={`${sheep.tag_number} kaydını aç`}>•••</button></td>
                  </tr>)}
                  {loading && <tr><td colSpan={8}><div className="empty-state">Kayıtlar yükleniyor…</div></td></tr>}
                  {!loading && records.length === 0 && <tr><td colSpan={8}><div className="empty-state"><strong>Kayıt bulunamadı</strong><span>Farklı bir küpe numarası deneyin.</span></div></td></tr>}
                </tbody>
              </table>
            </div>
            <div className="registry-foot"><span>{query ? `“${query}” araması için ${resultTotal} sonuç` : `Toplam ${total} kayıt · En son güncellenenler gösteriliyor`}</span><button onClick={openCreate}>Yeni koyun ekle →</button></div>
          </section>
        </section>
      </div>

      {modalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setModalOpen(false)}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal-head"><div><span className="modal-kicker">SÜRÜ KAYDI</span><h2 id="modal-title">{editing ? `${editing.tag_number} bilgilerini düzenle` : 'Yeni koyun ekle'}</h2><p>Kimlik, ölçüm ve sağlık bilgilerini kaydedin.</p></div><button className="close-button" onClick={() => setModalOpen(false)} aria-label="Pencereyi kapat">×</button></div>
          <form onSubmit={submitForm}>
            <div className="form-grid">
              <label><span>Küpe numarası *</span><input required pattern="T[0-9]{4,}" placeholder="T1111" value={form.tag_number} onChange={(e) => setForm({ ...form, tag_number: e.target.value.toUpperCase() })} /></label>
              <label><span>Irk *</span><select value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })}>{breeds.map((breed) => <option key={breed}>{breed}</option>)}</select></label>
              <label><span>Yaş *</span><div className="input-unit"><input required type="number" min="0" max="30" value={form.age} onChange={(e) => setForm({ ...form, age: Number(e.target.value) })} /><b>yaş</b></div></label>
              <label><span>Kilo *</span><div className="input-unit"><input required type="number" min="1" max="250" value={form.weight} onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })} /><b>kg</b></div></label>
              <label><span>Cinsiyet</span><select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option>Dişi</option><option>Koç</option></select></label>
              <label><span>Sağlık durumu</span><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Sağlıklı</option><option>Kontrol</option></select></label>
              <label className="full-field"><span>Kullanılan ilaçlar / tedaviler</span><input placeholder="Örn. İç parazit ilacı · 18.08.2026" value={form.medications} onChange={(e) => setForm({ ...form, medications: e.target.value })} /></label>
              <label className="full-field"><span>Notlar</span><textarea rows={3} placeholder="Hayvanla ilgili önemli notlar…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
            </div>
            {editing && <div className="record-meta">Son güncelleme: <strong>{formatDate(editing.updated_at)}</strong></div>}
            {error && <div className="form-error">{error}</div>}
            <div className="modal-actions">{editing && <button type="button" className="delete-button" onClick={deleteSheep} disabled={saving}>Kaydı sil</button>}<span /><button type="button" className="cancel-button" onClick={() => setModalOpen(false)}>Vazgeç</button><button className="save-button" disabled={saving}>{saving ? 'Kaydediliyor…' : editing ? 'Değişiklikleri kaydet' : 'Sürüye ekle'}</button></div>
          </form>
        </section>
      </div>}
      {toast && <div className="toast" role="status"><b>✓</b>{toast}</div>}
    </main>
  );
}

