import { useEffect, useMemo, useRef, useState } from "react";
import listingsJson from "./data/listings.json";
import { AccessGate } from "./components/AccessGate";
import { AddListingForm } from "./components/AddListingForm";
import { AgencyPhoneList } from "./components/AgencyPhoneList";
import { AllListingsTable } from "./components/AllListingsTable";
import { AppHeader } from "./components/AppHeader";
import { FilterBar } from "./components/FilterBar";
import { ListingsMap } from "./components/ListingsMap";
import { RemovedListings } from "./components/RemovedListings";
import { ScoreLegend } from "./components/ScoreLegend";
import { SelectedListing } from "./components/SelectedListing";
import { SiteIntro } from "./components/SiteIntro";
import { TopPicksTable } from "./components/TopPicksTable";
import { phoneDraftForListing, resolveAgencyPhones } from "./domain/agencyPhoneKey";
import { importOlxListing } from "./domain/fetchOlxListing";
import { findListingById, mergeListings } from "./domain/mergeListings";
import { readOlxListingId } from "./domain/olxUrl";
import { medianPricePerSquareMeter, scoreListings } from "./domain/scoreListings";
import { useAccessGate } from "./hooks/useAccessGate";
import { useAgencyPhones } from "./hooks/useAgencyPhones";
import { useCustomListings } from "./hooks/useCustomListings";
import { useListingNicknames } from "./hooks/useListingNicknames";
import { useListingNotes } from "./hooks/useListingNotes";
import { useListingStarRatings } from "./hooks/useListingStarRatings";
import {
  filterListings,
  isRemovedListing,
  neighborhoodOptions,
  selectPricedListings,
  selectTopListings,
} from "./domain/selectListings";
import { sortHeading, sortListings } from "./domain/sortListings";
import type { Listing, ListingFilters, ScoredListing } from "./types";

const baseListings = listingsJson as Listing[];
const nowSeconds = Math.floor(Date.now() / 1000);

function readListingId(listing: ScoredListing): string {
  return listing.id;
}

function readSeller(listing: ScoredListing): string {
  return listing.seller ?? "";
}

function hasSeller(seller: string): boolean {
  return seller.length > 0;
}

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
  const { isLocked, isReadOnly, handleUnlock } = useAccessGate();
  const { notesById, readNote, handleNoteChange, isNotesSaveFailed } = useListingNotes();
  const { readStarRating, handleRate, isStarRatingsSaveFailed } = useListingStarRatings();
  const { customListings, addCustomListing, isListingsSaveFailed } = useCustomListings();
  const { phoneTextBySeller, handlePhoneChange, isPhonesSaveFailed } = useAgencyPhones();
  const listings = mergeListings(baseListings, customListings);
  const scoredListings = scoreListings(listings, nowSeconds);
  const pricedListings = selectPricedListings(scoredListings);
  const topListings = selectTopListings(scoredListings, 25);
  const removedListings = scoredListings.filter(isRemovedListing);
  const neighborhoods = neighborhoodOptions(scoredListings);
  const medianMeterPrice = medianPricePerSquareMeter(scoredListings);
  const sellers = pricedListings.map(readSeller).filter(hasSeller);
  const listingIdKey = scoredListings.map(readListingId).join("\n");
  const listingIds = useMemo(function rememberListingIds() {
    const isEmpty = listingIdKey.length === 0;
    if (isEmpty) {
      return [];
    }

    return listingIdKey.split("\n");
  }, [listingIdKey]);
  const { nicknames: nicknamesById, isNicknamesSaveFailed } = useListingNicknames(listingIds);
  const isDatabaseSaveFailed =
    isNotesSaveFailed || isPhonesSaveFailed || isListingsSaveFailed || isNicknamesSaveFailed || isStarRatingsSaveFailed;

  function readPhones(listing: ScoredListing): string[] {
    return resolveAgencyPhones(listing, phoneTextBySeller);
  }

  function readPhoneDraft(listing: ScoredListing): string {
    return phoneDraftForListing(listing, phoneTextBySeller);
  }

  function readSellerPhones(seller: string): string[] {
    return resolveAgencyPhones({ id: seller, seller }, phoneTextBySeller);
  }

  function readNickname(listingId: string): string {
    return nicknamesById[listingId] ?? "";
  }

  async function handleImportListing(pageUrl: string): Promise<string> {
    const requestedId = readOlxListingId(pageUrl);
    const existingListing = findListingById(scoredListings, requestedId);
    if (existingListing) {
      setSelectedListingId(existingListing.id);
      setSelectionSource("list");
      setFocusToken(increaseFocusToken);
      return "To ogłoszenie już jest na liście.";
    }

    const listing = await importOlxListing(pageUrl);
    const importedListing = findListingById(scoredListings, listing.id);
    if (importedListing) {
      setSelectedListingId(importedListing.id);
      setSelectionSource("list");
      setFocusToken(increaseFocusToken);
      return "To ogłoszenie już jest na liście.";
    }

    addCustomListing(listing);
    setSelectedListingId(listing.id);
    setSelectionSource("list");
    setFocusToken(increaseFocusToken);
    return `Dodano: ${listing.title}`;
  }

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
  function isHighlightedListing(listing: ScoredListing): boolean {
    const note = notesById[listing.id];
    if (!note) {
      return false;
    }

    return note.isHighlighted;
  }

  function isRejectedListing(listing: ScoredListing): boolean {
    const note = notesById[listing.id];
    if (!note) {
      return false;
    }

    return note.isRejected;
  }

  function isKeptInAllListings(listing: ScoredListing): boolean {
    const isSetAside = isHighlightedListing(listing) || isRejectedListing(listing);
    return !isSetAside;
  }

  const visibleListings = sortListings(
    filterListings(pricedListings.filter(isKeptInAllListings), filters),
    filters.sortKey,
    filters.sortDirection,
    notesById,
  );
  const highlightedListings = sortListings(
    pricedListings.filter(isHighlightedListing),
    "price",
    "asc",
    notesById,
  );
  const rejectedListings = sortListings(pricedListings.filter(isRejectedListing), "price", "asc", notesById);

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

  if (isLocked) {
    return <AccessGate onUnlock={handleUnlock} />;
  }

  return (
    <main>
      <AppHeader />
      {isDatabaseSaveFailed ? (
        <p className="notes-error">
          Nie udało się zapisać w bazie. Notatki, telefony, ogłoszenia, pseudonimy i oceny zostają na tym urządzeniu.
        </p>
      ) : null}
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
            readNickname={readNickname}
            onNoteChange={handleNoteChange}
            readStarRating={readStarRating}
            onRate={handleRate}
            readPhones={readPhones}
            readPhoneDraft={readPhoneDraft}
            onPhoneChange={handlePhoneChange}
            isReadOnly={isReadOnly}
          />
        </div>
      </section>

      <section id="oznaczone">
        <div className="section-head">
          <h2>Wyróżnione</h2>
          <p>Domy z zaznaczeniem Wyróżnione. Komentarz może być albo go nie być.</p>
        </div>
        <AllListingsTable
          listings={highlightedListings}
          selectedListingId={selectedListingId}
          onPhotoSelect={handlePhotoSelect}
          readNote={readNote}
          readNickname={readNickname}
          onNoteChange={handleNoteChange}
          readStarRating={readStarRating}
          onRate={handleRate}
          readPhones={readPhones}
          readPhoneDraft={readPhoneDraft}
          onPhoneChange={handlePhoneChange}
          isReadOnly={isReadOnly}
          emptyMessage="Żadne ogłoszenie nie jest wyróżnione."
        />
      </section>

      <SiteIntro activeCount={pricedListings.length} removedCount={removedListings.length} scannedOn="17 listopada 2026" />
      <ScoreLegend medianPricePerSquareMeter={medianMeterPrice} />

      <section id="wszystkie">
        <div className="section-head">
          <h2>{sortHeading(filters.sortKey, filters.sortDirection)}</h2>
          <p>Ocena łączy jakość domu z tym, ile kosztuje metr na tle reszty listy.</p>
        </div>
        {isReadOnly ? null : <AddListingForm onImport={handleImportListing} />}
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
          readNickname={readNickname}
          onNoteChange={handleNoteChange}
          readStarRating={readStarRating}
          onRate={handleRate}
          readPhones={readPhones}
          readPhoneDraft={readPhoneDraft}
          onPhoneChange={handlePhoneChange}
          isReadOnly={isReadOnly}
        />
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
        <AgencyPhoneList sellers={sellers} readPhones={readSellerPhones} />
      </section>

      <section id="top">
        <div className="section-head">
          <h2>25 najlepszych jakościowo</h2>
          <p>
            Ranking z całej listy aktywnych ogłoszeń, nie tylko z tych z komentarzem. Plaża, widok,
            łódź i suity wygrywają z okazją cenową.
          </p>
        </div>
        <TopPicksTable
          listings={topListings}
          selectedListingId={selectedListingId}
          onPhotoSelect={handlePhotoSelect}
          readNote={readNote}
          readNickname={readNickname}
          onNoteChange={handleNoteChange}
          readStarRating={readStarRating}
          onRate={handleRate}
          readPhones={readPhones}
          readPhoneDraft={readPhoneDraft}
          onPhoneChange={handlePhoneChange}
          isReadOnly={isReadOnly}
        />
      </section>

      <section id="zdjete">
        <div className="section-head">
          <h2>Zdjęte ogłoszenia</h2>
          <p>Te linki zwracają już „anúncio não encontrado”. Zostawiam je, żeby było widać, co odpadło.</p>
        </div>
        <RemovedListings listings={removedListings} readNickname={readNickname} />
      </section>

      <section id="odrzucone">
        <div className="section-head">
          <h2>Odrzucone</h2>
          <p>Domy z zaznaczeniem Odrzucone. Nie ma ich w tabeli pozostałych.</p>
        </div>
        <AllListingsTable
          listings={rejectedListings}
          selectedListingId={selectedListingId}
          onPhotoSelect={handlePhotoSelect}
          readNote={readNote}
          readNickname={readNickname}
          onNoteChange={handleNoteChange}
          readStarRating={readStarRating}
          onRate={handleRate}
          readPhones={readPhones}
          readPhoneDraft={readPhoneDraft}
          onPhoneChange={handlePhoneChange}
          isReadOnly={isReadOnly}
          emptyMessage="Żadne ogłoszenie nie jest odrzucone."
        />
      </section>
    </main>
  );
};
