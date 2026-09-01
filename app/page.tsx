'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

type Sheep = {
  id: number; tag_number: string; business_tag_number: string; birth_date: string; mother_tag_number: string;
  breed: string; activity_status: 'Aktif' | 'Pasif'; passive_reason: string; notes: string;
  latest_treatment?: string; latest_treatment_date?: string; updated_at: string; created_at: string;
};
type RelatedSheep = Pick<Sheep, 'id' | 'tag_number' | 'business_tag_number'>;
type Treatment = { id: number; description: string; treatment_date: string };
type Detail = { record: Sheep; treatments: Treatment[]; children: RelatedSheep[]; siblings: RelatedSheep[] };
type SheepForm = {
  tag_number: string; business_tag_number: string; birth_date: string; mother_tag_number: string; breed: string;
  activity_status: 'Aktif' | 'Pasif'; passive_reason: string; notes: string; treatment_description: string; treatment_date: string;
};

const breeds = ['Merinos Anaç', 'Merinos Erkek', 'Merinos Dişi', 'Kıvırcık Anaç', 'Kıvırcık Erkek', 'Kıvırcık Dişi'];
const todayIso = () => new Date().toISOString().slice(0, 10);
const emptyForm = (): SheepForm => ({
  tag_number: '', business_tag_number: '', birth_date: todayIso(), mother_tag_number: '', breed: breeds[0],
  activity_status: 'Aktif', passive_reason: '', notes: '', treatment_description: '', treatment_date: todayIso(),
});

function formatDate(value?: string, withTime = false) {
  if (!value) return '—';
  const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}${withTime ? 'Z' : 'T00:00:00'}`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('tr-TR', withTime
    ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export default function Home() {
  const [records, setRecords] = useState<Sheep[]>([]);
  const [total, setTotal] = useState(364);
  const [active, setActive] = useState(364);
  const [passive, setPassive] = useState(0);
  const [resultTotal, setResultTotal] = useState(364);
  const [activity, setActivity] = useState<'Aktif' | 'Pasif'>('Aktif');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Sheep | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [form, setForm] = useState<SheepForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const loadRecords = useCallback(async (search = '', status: 'Aktif' | 'Pasif' = 'Aktif') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ activity: status });
      if (search) params.set('q', search);
      const response = await fetch(`/api/sheep?${params}`);
      const data = await response.json();
      setRecords(data.records ?? []); setTotal(data.total ?? 0); setActive(data.active ?? 0); setPassive(data.passive ?? 0); setResultTotal(data.resultTotal ?? 0);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { const timer = setTimeout(() => loadRecords(query, activity), 260); return () => clearTimeout(timer); }, [query, activity, loadRecords]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 2800); return () => clearTimeout(timer); }, [toast]);
  const today = useMemo(() => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }).format(new Date()), []);

  function openCreate(motherTag = '') {
    setEditing(null); setDetail(null); setForm({ ...emptyForm(), mother_tag_number: motherTag }); setError(''); setModalOpen(true);
  }

  async function openEdit(sheep: Pick<Sheep, 'id'> & Partial<Sheep>) {
    setModalOpen(true); setDetailLoading(true); setError('');
    try {
      const response = await fetch(`/api/sheep/${sheep.id}`);
      const data = await response.json() as Detail;
      if (!response.ok) throw new Error('Kayıt açılamadı.');
      const record = data.record;
      setEditing(record); setDetail(data);
      setForm({
        tag_number: record.tag_number, business_tag_number: record.business_tag_number || '', birth_date: record.birth_date || todayIso(),
        mother_tag_number: record.mother_tag_number || '', breed: record.breed, activity_status: record.activity_status || 'Aktif',
        passive_reason: record.passive_reason || '', notes: record.notes || '', treatment_description: '', treatment_date: todayIso(),
      });
    } catch { setError('Kayıt bilgileri yüklenemedi.'); } finally { setDetailLoading(false); }
  }

  async function submitForm(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError('');
    const response = await fetch(editing ? `/api/sheep/${editing.id}` : '/api/sheep', {
      method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    const data = await response.json(); setSaving(false);
    if (!response.ok) { setError(data.error || 'Kayıt sırasında bir sorun oluştu.'); return; }
    setModalOpen(false); setToast(editing ? `${form.tag_number} kaydı güncellendi.` : `${form.tag_number} sürüye eklendi.`); await loadRecords(query, activity);
  }

  async function deleteSheep() {
    if (!editing || !window.confirm(`${editing.tag_number} numaralı koyun kaydı kalıcı olarak silinsin mi?`)) return;
    setSaving(true); const response = await fetch(`/api/sheep/${editing.id}`, { method: 'DELETE' }); setSaving(false);
    if (!response.ok) { setError('Kayıt silinemedi.'); return; }
    setModalOpen(false); setToast(`${editing.tag_number} kaydı silindi.`); await loadRecords(query, activity);
  }

  const legacyBreed = editing && !breeds.includes(form.breed) ? form.breed : '';

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark">İM</div><div><strong>İbrahim Müdürün Çiftliği</strong><span>Hayvan Yönetim Sistemi</span></div></div>
        <div className="top-actions"><span className="sync"><i /> Sistem güncel</span><button className="avatar" aria-label="Kullanıcı menüsü">İM</button></div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div>
            <nav aria-label="Ana menü"><a className="nav-item active" href="#suruler"><span>⌂</span> Genel Bakış</a><a className="nav-item" href="#suruler"><span>♧</span> Sürü Yönetimi</a></nav>
            <div className="status-query">
              <span>DURUM SORGULAMA</span>
              <button className={activity === 'Aktif' ? 'selected' : ''} onClick={() => setActivity('Aktif')}><i className="active-dot" /> Aktif hayvanlar <b>{active}</b></button>
              <button className={activity === 'Pasif' ? 'selected' : ''} onClick={() => setActivity('Pasif')}><i className="passive-dot" /> Pasif hayvanlar <b>{passive}</b></button>
            </div>
          </div>
          <div className="sidebar-note"><span>Çiftlik durumu</span><strong>{active} aktif hayvan</strong><small>Ölen ve satılan hayvanlar pasif listede tutulur</small></div>
        </aside>

        <section className="content">
          <div className="eyebrow">{today}</div>
          <div className="page-heading"><div><h1>Günaydın, İbrahim Müdür</h1><p>Çiftliğinizin güncel durumuna genel bakış.</p></div><button className="primary-button" onClick={() => openCreate()}><b>＋</b> Yeni koyun ekle</button></div>
          <div className="stats-grid">
            <article className="stat-card highlight"><div className="stat-icon">♧</div><div><span>Aktif koyun</span><strong>{active}</strong><small>Güncel sürü mevcudu</small></div></article>
            <article className="stat-card"><div className="stat-icon blue">▥</div><div><span>Toplam kayıt</span><strong>{total}</strong><small>Tüm zamanlar</small></div></article>
            <article className="stat-card"><div className="stat-icon amber">○</div><div><span>Pasif kayıt</span><strong>{passive}</strong><small>Satılan veya ölen</small></div></article>
            <article className="stat-card"><div className="stat-icon blue">◷</div><div><span>Son güncelleme</span><strong className="date-stat">Şimdi</strong><small>Veriler güncel</small></div></article>
          </div>

          <section className="registry" id="suruler">
            <div className="registry-head"><div><h2>{activity} Sürü Kayıtları</h2><p>Küpe, soy bağı ve sağlık bilgilerini tek yerden yönetin</p></div><button className="secondary-add" onClick={() => openCreate()}>＋ Kayıt ekle</button></div>
            <div className="toolbar">
              <label className="search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value.toUpperCase())} aria-label="Küpe numarasıyla ara" placeholder="Normal veya işletme küpe no ile ara" />{query && <button onClick={() => setQuery('')} aria-label="Aramayı temizle">×</button>}</label>
              <select className="mobile-status-filter" value={activity} onChange={(e) => setActivity(e.target.value as 'Aktif' | 'Pasif')}><option>Aktif</option><option>Pasif</option></select>
              <div className="result-count">{loading ? 'Aranıyor…' : `${resultTotal} kayıt`}</div>
            </div>
            <div className="table-wrap">
              <table><thead><tr><th>NORMAL KÜPE NO</th><th>İŞLETME KÜPE NO</th><th>DOĞUM TARİHİ</th><th>IRK</th><th>SON İLAÇ / TEDAVİ</th><th>DURUM</th><th>SON GÜNCELLEME</th><th /></tr></thead>
                <tbody>
                  {!loading && records.map((sheep) => <tr key={sheep.id} onClick={() => openEdit(sheep)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && openEdit(sheep)}>
                    <td><div className="tag-cell"><span className="sheep-dot">♧</span><strong>{sheep.tag_number}</strong></div></td>
                    <td><strong>{sheep.business_tag_number || '—'}</strong></td><td>{formatDate(sheep.birth_date)}</td><td>{sheep.breed}</td>
                    <td className="medication">{sheep.latest_treatment ? <><strong>{sheep.latest_treatment}</strong><small>{formatDate(sheep.latest_treatment_date)}</small></> : '—'}</td>
                    <td><span className={`status ${sheep.activity_status === 'Pasif' ? 'inactive' : ''}`}><i />{sheep.activity_status}</span></td>
                    <td>{formatDate(sheep.updated_at, true)}</td><td><button className="row-more" onClick={(e) => { e.stopPropagation(); openEdit(sheep); }} aria-label={`${sheep.tag_number} kaydını aç`}>•••</button></td>
                  </tr>)}
                  {loading && <tr><td colSpan={8}><div className="empty-state">Kayıtlar yükleniyor…</div></td></tr>}
                  {!loading && records.length === 0 && <tr><td colSpan={8}><div className="empty-state"><strong>Kayıt bulunamadı</strong><span>Farklı bir küpe numarası veya durum deneyin.</span></div></td></tr>}
                </tbody>
              </table>
            </div>
            <div className="registry-foot"><span>{query ? `“${query}” araması için ${resultTotal} sonuç` : `${resultTotal} ${activity.toLocaleLowerCase('tr-TR')} kayıt gösteriliyor`}</span><button onClick={() => openCreate()}>Yeni koyun ekle →</button></div>
          </section>
        </section>
      </div>

      {modalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setModalOpen(false)}>
        <section className="modal wide-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal-head"><div><span className="modal-kicker">SÜRÜ KAYDI</span><h2 id="modal-title">{editing ? `${editing.tag_number} hayvan kartı` : form.mother_tag_number ? 'Yeni yavru ekle' : 'Yeni koyun ekle'}</h2><p>Kimlik, soy bağı ve sağlık bilgilerini yönetin.</p></div><button className="close-button" onClick={() => setModalOpen(false)} aria-label="Pencereyi kapat">×</button></div>
          {detailLoading ? <div className="modal-loading">Hayvan kartı yükleniyor…</div> : <form onSubmit={submitForm}>
            {editing && detail && <div className="family-panel">
              <div><span>ANNE KÜPE NO</span><strong>{editing.mother_tag_number || '—'}</strong></div>
              <div><span>YAVRULARI</span><div className="relation-list">{detail.children.length ? detail.children.map((child) => <button type="button" key={child.id} onClick={() => openEdit(child)}>{child.tag_number}</button>) : <strong>—</strong>}</div></div>
              <div><span>KARDEŞLERİ</span><div className="relation-list">{detail.siblings.length ? detail.siblings.map((sibling) => <button type="button" key={sibling.id} onClick={() => openEdit(sibling)}>{sibling.tag_number}</button>) : <strong>—</strong>}</div></div>
              <button type="button" className="add-child-button" onClick={() => openCreate(editing.tag_number)}>＋ Yavru ekle</button>
            </div>}
            <div className="form-grid">
              <label><span>Normal küpe numarası *</span><input required pattern="T[0-9]{4,}" placeholder="T1111" value={form.tag_number} onChange={(e) => setForm({ ...form, tag_number: e.target.value.toUpperCase() })} /></label>
              <label><span>İşletme küpe numarası</span><input placeholder="İşletme küpe no" value={form.business_tag_number} onChange={(e) => setForm({ ...form, business_tag_number: e.target.value.toUpperCase() })} /></label>
              <label><span>Doğum tarihi *</span><input required type="date" max={todayIso()} value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} /></label>
              <label><span>Irk *</span><select value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })}>{legacyBreed && <option>{legacyBreed}</option>}{breeds.map((breed) => <option key={breed}>{breed}</option>)}</select></label>
              <label><span>Anne küpe numarası</span><input pattern="T[0-9]{4,}" placeholder="T1111" value={form.mother_tag_number} onChange={(e) => setForm({ ...form, mother_tag_number: e.target.value.toUpperCase() })} /></label>
              <label><span>Aktif / Pasif</span><select value={form.activity_status} onChange={(e) => setForm({ ...form, activity_status: e.target.value as 'Aktif' | 'Pasif', passive_reason: e.target.value === 'Aktif' ? '' : form.passive_reason })}><option>Aktif</option><option>Pasif</option></select></label>
              {form.activity_status === 'Pasif' && <label className="full-field"><span>Pasif olma nedeni *</span><select required value={form.passive_reason} onChange={(e) => setForm({ ...form, passive_reason: e.target.value })}><option value="">Neden seçin</option><option>Satıldı</option><option>Öldü</option></select></label>}
              <label className="full-field"><span>Notlar</span><textarea rows={3} placeholder="Hayvanla ilgili önemli notlar…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
            </div>

            <section className="treatment-section">
              <div className="section-title"><div><h3>İlaç ve tedavi geçmişi</h3><p>Yeni işlemi girin; eski kayıtlar tarih sırasıyla saklanır.</p></div></div>
              <div className="treatment-entry">
                <label><span>Yeni işlem</span><input placeholder="Örn. İç parazit ilacı" value={form.treatment_description} onChange={(e) => setForm({ ...form, treatment_description: e.target.value })} /></label>
                <label><span>İşlem tarihi</span><input type="date" max={todayIso()} value={form.treatment_date} onChange={(e) => setForm({ ...form, treatment_date: e.target.value })} /></label>
              </div>
              {editing && <div className="treatment-history">{detail?.treatments.length ? detail.treatments.map((item) => <div key={item.id}><i /><span><strong>{item.description}</strong><small>{formatDate(item.treatment_date)}</small></span></div>) : <p>Henüz ilaç veya tedavi kaydı yok.</p>}</div>}
            </section>

            {editing && <div className="record-meta">Son güncelleme: <strong>{formatDate(editing.updated_at, true)}</strong></div>}
            {error && <div className="form-error">{error}</div>}
            <div className="modal-actions">{editing && <button type="button" className="delete-button" onClick={deleteSheep} disabled={saving}>Kaydı sil</button>}<span /><button type="button" className="cancel-button" onClick={() => setModalOpen(false)}>Vazgeç</button><button className="save-button" disabled={saving}>{saving ? 'Kaydediliyor…' : editing ? 'Değişiklikleri kaydet' : 'Sürüye ekle'}</button></div>
          </form>}
        </section>
      </div>}
      {toast && <div className="toast" role="status"><b>✓</b>{toast}</div>}
    </main>
  );
}

