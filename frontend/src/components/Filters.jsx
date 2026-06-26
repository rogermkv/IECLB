import { Search } from 'lucide-react';

export default function Filters({ filters, setFilters, categories, locations }) {
  function update(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  return (
    <section className="filters" aria-label="Filtros da agenda">
      <label>
        <span>Mês</span>
        <input type="month" value={filters.month} onChange={(event) => update('month', event.target.value)} />
      </label>
      <label>
        <span>Categoria</span>
        <select value={filters.category} onChange={(event) => update('category', event.target.value)}>
          <option value="">Todas</option>
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <label>
        <span>Local</span>
        <select value={filters.location} onChange={(event) => update('location', event.target.value)}>
          <option value="">Todos</option>
          {locations.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <label className="search-field">
        <span>Busca</span>
        <div>
          <Search size={20} aria-hidden="true" />
          <input type="search" placeholder="Buscar evento" value={filters.search} onChange={(event) => update('search', event.target.value)} />
        </div>
      </label>
      <button className="button ghost" type="button" onClick={() => setFilters({ month: '', category: '', location: '', search: '' })}>Limpar</button>
    </section>
  );
}
