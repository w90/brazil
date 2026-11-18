import type { ChangeEvent } from "react";
import { FILTER_TRAITS } from "../domain/traits";
import type { ListingFilters, ListingSortDirection, ListingSortKey } from "../types";

interface Props {
  filters: ListingFilters;
  neighborhoods: string[];
  matchCount: number;
  onChange: (filters: ListingFilters) => void;
}

function renderNeighborhood(name: string) {
  return (
    <option key={name} value={name}>
      {name}
    </option>
  );
}

function renderTrait(trait: string) {
  return (
    <option key={trait} value={trait}>
      {trait}
    </option>
  );
}

export const FilterBar = (props: Props) => {
  const { filters, neighborhoods, matchCount, onChange } = props;

  function handleQueryChange(event: ChangeEvent<HTMLInputElement>) {
    onChange({ ...filters, query: event.target.value });
  }

  function handleNeighborhoodChange(event: ChangeEvent<HTMLSelectElement>) {
    onChange({ ...filters, neighborhood: event.target.value });
  }

  function handleTraitChange(event: ChangeEvent<HTMLSelectElement>) {
    onChange({ ...filters, trait: event.target.value });
  }

  function isSortKey(value: string): value is ListingSortKey {
    const isPrice = value === "price";
    const isRating = value === "rating";
    const isQuality = value === "quality";
    return isPrice || isRating || isQuality;
  }

  function isSortDirection(value: string): value is ListingSortDirection {
    const isAscending = value === "asc";
    const isDescending = value === "desc";
    return isAscending || isDescending;
  }

  function handleSortKeyChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    if (!isSortKey(value)) {
      return;
    }

    onChange({ ...filters, sortKey: value });
  }

  function handleSortDirectionChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    if (!isSortDirection(value)) {
      return;
    }

    onChange({ ...filters, sortDirection: value });
  }

  return (
    <div className="filters">
      <label className="filters__field filters__field--search">
        <span>Szukaj</span>
        <input
          value={filters.query}
          onChange={handleQueryChange}
          placeholder="tytuł, agencja, okolica"
        />
      </label>
      <label className="filters__field">
        <span>Okolica</span>
        <select value={filters.neighborhood} onChange={handleNeighborhoodChange}>
          <option value="all">Wszystkie</option>
          {neighborhoods.map(renderNeighborhood)}
        </select>
      </label>
      <label className="filters__field">
        <span>Atut</span>
        <select value={filters.trait} onChange={handleTraitChange}>
          <option value="all">Wszystkie</option>
          {FILTER_TRAITS.map(renderTrait)}
        </select>
      </label>
      <label className="filters__field">
        <span>Sortuj</span>
        <select value={filters.sortKey} onChange={handleSortKeyChange}>
          <option value="price">Cena</option>
          <option value="rating">Ocena</option>
          <option value="quality">Jakość</option>
        </select>
      </label>
      <label className="filters__field">
        <span>Kolejność</span>
        <select value={filters.sortDirection} onChange={handleSortDirectionChange}>
          <option value="asc">Rosnąco</option>
          <option value="desc">Malejąco</option>
        </select>
      </label>
      <p className="filters__count">{matchCount} w tabeli</p>
    </div>
  );
};
