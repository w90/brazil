import { useEffect, useRef, useState } from "react";
import listingsJson from "./data/listings.json";
import { AgencyPhoneList } from "./components/AgencyPhoneList";
import { AllListingsTable } from "./components/AllListingsTable";
import { AppHeader } from "./components/AppHeader";
import { FilterBar } from "./components/FilterBar";
import { ListingsMap } from "./components/ListingsMap";
import { RemovedListings } from "./components/RemovedListings";
import { ScoreLegend } from "./components/ScoreLegend";
import { SelectedListing } from "./components/SelectedListing";
import { TopPicksTable } from "./components/TopPicksTable";
import { medianPricePerSquareMeter, scoreListings } from "./domain/scoreListings";
import { useListingNotes } from "./hooks/useListingNotes";
import {
  filterListings,
  isRemovedListing,
  neighborhoodOptions,
  selectPricedListings,
  selectTopListings,
} from "./domain/selectListings";
import { sortHeading, sortListings } from "./domain/sortListings";
import type { Listing, ListingFilters, ScoredListing } from "./types";

const listings = listingsJson as Listing[];
const nowSeconds = Math.floor(Date.now() / 1000);
const scoredListings = scoreListings(listings, nowSeconds);
const pricedListings = selectPricedListings(scoredListings);
const topListings = selectTopListings(scoredListings, 25);
const removedListings = scoredListings.filter(isRemovedListing);
const neighborhoods = neighborhoodOptions(scoredListings);
const medianMeterPrice = medianPricePerSquareMeter(scoredListings);

function readSeller(listing: ScoredListing): string {
  return listing.seller ?? "";
}

function hasSeller(seller: string): boolean {
  return seller.length > 0;
}

const sellers = pricedListings.map(readSeller).filter(hasSeller);

const initialFilters: ListingFilters = {
  query: "",
  neighborhood: "all",
  trait: "all",
  sortKey: "price",
  sortDirection: "asc",
};

function increaseFocusToken(current: number): number {
  return current + 1;
}

export const App = () => {
  const [filters, setFilters] = useState(initialFilters);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [focusToken, setFocusToken] = useState(0);
  const [selectionSource, setSelectionSource] = useState<"map" | "list" | null>(null);
  const selectionRef = useRef<HTMLDivElement | null>(null);
  const { notesById, readNote, handleNoteChange, isNotesSaveFailed } = useListingNotes();

  function isVisibleOnMap(listing: ScoredListing): boolean {
    const note = notesById[listing.id];
    if (!note) {
      return true;
    }

    return !note.isRejected;
  }

  function readHighlightedId(listing: ScoredListing): string | null {
    const note = notesById[listing.id];
    if (!note) {
      return null;
    }

    const isHighlightedOnMap = note.isHighlighted && !note.isRejected;
    if (!isHighlightedOnMap) {
      return null;
    }

    return listing.id;
  }

  function isPresentId(listingId: string | null): listingId is string {
    return listingId !== null;
  }

  const mapListings = pricedListings.filter(isVisibleOnMap);
  const highlightedListingIds = mapListings.map(readHighlightedId).filter(isPresentId);
  const visibleListings = sortListings(
    filterListings(pricedListings, filters),
    filters.sortKey,
    filters.sortDirection,
  );

  function matchesSelected(listing: ScoredListing): boolean {
    return listing.id === selectedListingId;
  }

  const selectedListing = pricedListings.find(matchesSelected) ?? null;

  function handleFiltersChange(nextFilters: ListingFilters) {
    setFilters(nextFilters);
  }

  function handleMapSelect(listingId: string) {
    setSelectedListingId(listingId);
    setSelectionSource("map");
  }

  function handlePhotoSelect(listingId: string) {
    setSelectedListingId(listingId);
    setSelectionSource("list");
    setFocusToken(increaseFocusToken);
  }

  useEffect(
    function scrollToMap() {
      const isListSelection = selectionSource === "list";
      if (!isListSelection) {
        return;
      }

      const section = document.getElementById("mapa");
      if (!section) {
        return;
      }

      section.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [focusToken, selectionSource],
  );

  useEffect(
    function revealSelectedListing() {
      const isMapSelection = selectionSource === "map";
      if (!isMapSelection) {
        return;
      }

      selectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    },
    [selectedListingId, selectionSource],
  );

  return (
    <main>
      <AppHeader activeCount={pricedListings.length} removedCount={removedListings.length} scannedOn="17 listopada 2026" />
      {isNotesSaveFailed ? (
        <p className="notes-error">Nie udało się połączyć z bazą notatek. Wpisy zostają na tym urządzeniu.</p>
      ) : null}
      <ScoreLegend medianPricePerSquareMeter={medianMeterPrice} />

      <section id="mapa">
        <div className="section-head">
          <h2>Mapa ogłoszeń</h2>
          <p>
            Każdy pin to jedno aktywne ogłoszenie. Punkt pochodzi z mapy OLX i oznacza okolicę, nie
            drzwi. Liczba na wspólnym punkcie mówi, ile domów OLX położyło w tym samym miejscu —
            kliknięcie przybliża, a piny rozchodzą się w kółko. Wyróżnione ma większą złotą kropkę,
            odrzucone znika z mapy. Komentarz i pola zapisują się w bazie.
          </p>
        </div>
        <ListingsMap
          listings={mapListings}
          selectedListingId={selectedListingId}
          focusToken={focusToken}
          highlightedListingIds={highlightedListingIds}
          onSelectListing={handleMapSelect}
        />
        <div ref={selectionRef}>
          <SelectedListing
            listing={selectedListing}
            onPhotoSelect={handlePhotoSelect}
            readNote={readNote}
            onNoteChange={handleNoteChange}
          />
        </div>
      </section>

      <section id="telefony">
        <div className="section-head">
          <h2>Telefony biur</h2>
          <p>
            Numer, który na OLX jest ucięty, wzięty ze strony albo wizytówki tego samego biura.
            Kliknięcie otwiera czat w aplikacji WhatsApp. Do każdego numeru dopisany jest kierunkowy
            Brazylii, +55.
          </p>
        </div>
        <AgencyPhoneList sellers={sellers} />
      </section>

      <section id="wszystkie">
        <div className="section-head">
          <h2>{sortHeading(filters.sortKey, filters.sortDirection)}</h2>
          <p>Ocena łączy jakość domu z tym, ile kosztuje metr na tle reszty listy.</p>
        </div>
        <FilterBar
          filters={filters}
          neighborhoods={neighborhoods}
          matchCount={visibleListings.length}
          onChange={handleFiltersChange}
        />
        <AllListingsTable
          listings={visibleListings}
          selectedListingId={selectedListingId}
          onPhotoSelect={handlePhotoSelect}
          readNote={readNote}
          onNoteChange={handleNoteChange}
        />
      </section>

      <section id="top">
        <div className="section-head">
          <h2>25 najlepszych jakościowo</h2>
          <p>
            Ta sama lista, ale ułożona po domu, nie po cenie. Plaża, widok, łódź i suity wygrywają z
            okazją cenową. Filtr powyżej tej tabeli nie zmienia.
          </p>
        </div>
        <TopPicksTable
          listings={topListings}
          selectedListingId={selectedListingId}
          onPhotoSelect={handlePhotoSelect}
          readNote={readNote}
          onNoteChange={handleNoteChange}
        />
      </section>

      <section id="zdjete">
        <div className="section-head">
          <h2>Zdjęte ogłoszenia</h2>
          <p>Te linki zwracają już „anúncio não encontrado”. Zostawiam je, żeby było widać, co odpadło.</p>
        </div>
        <RemovedListings listings={removedListings} />
      </section>
    </main>
  );
};
