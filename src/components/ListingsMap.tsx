import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  buildMapGroups,
  countSharedPins,
  sharedCircleRadiusMeters,
  type MapGroup,
  type MapPoint,
} from "../domain/spreadMapPoints";
import type { ScoredListing } from "../types";

interface Props {
  listings: ScoredListing[];
  selectedListingId: string | null;
  focusToken: number;
  highlightedListingIds: string[];
  onSelectListing: (listingId: string) => void;
}

interface MarkerRecord {
  marker: L.Marker;
  rating: number;
  isHighlighted: boolean;
}

interface AppliedFocus {
  map: L.Map | null;
  token: number;
}

function pinClass(rating: number): string {
  const isHigh = rating >= 80;
  if (isHigh) {
    return "map-pin map-pin--high";
  }

  const isMid = rating >= 65;
  if (isMid) {
    return "map-pin map-pin--mid";
  }

  return "map-pin map-pin--low";
}

function pinIconSize(isSelected: boolean, isHighlighted: boolean): number {
  const isEnlarged = isSelected || isHighlighted;
  if (isEnlarged) {
    return 28;
  }

  return 18;
}

function createPinIcon(rating: number, isSelected: boolean, isHighlighted: boolean): L.DivIcon {
  const selectedClass = isSelected ? " map-pin--selected" : "";
  const highlightedClass = isHighlighted ? " map-pin--highlighted" : "";
  const iconSize = pinIconSize(isSelected, isHighlighted);

  return L.divIcon({
    className: "map-pin-wrap",
    html: `<span class="${pinClass(rating)}${selectedClass}${highlightedClass}"></span>`,
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize / 2, iconSize / 2],
  });
}

function createCountIcon(count: number): L.DivIcon {
  return L.divIcon({
    className: "map-count-wrap",
    html: `<span class="map-count">${count}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function addListingMarker(
  groupLayer: L.FeatureGroup,
  point: MapPoint,
  markers: Map<string, MarkerRecord>,
  onSelect: (listingId: string) => void,
  isHighlighted: boolean,
) {
  const marker = L.marker([point.latitude, point.longitude], {
    icon: createPinIcon(point.listing.rating, false, isHighlighted),
    title: point.listing.title,
    zIndexOffset: isHighlighted ? 500 : 0,
  });

  function handleMarkerClick() {
    onSelect(point.listing.id);
  }

  marker.on("click", handleMarkerClick);
  marker.bindTooltip(point.listing.title, { direction: "top", offset: [0, -8] });
  marker.addTo(groupLayer);
  markers.set(point.listing.id, { marker, rating: point.listing.rating, isHighlighted });
}

function paintSelection(markers: Map<string, MarkerRecord>, selectedListingId: string | null) {
  function paintMarker(record: MarkerRecord, listingId: string) {
    const isSelected = listingId === selectedListingId;
    record.marker.setIcon(createPinIcon(record.rating, isSelected, record.isHighlighted));
    const isRaised = isSelected || record.isHighlighted;
    const zIndexOffset = isRaised ? 2000 : 0;
    record.marker.setZIndexOffset(zIndexOffset);
  }

  markers.forEach(paintMarker);
}

function zoomToGroup(map: L.Map, group: MapGroup) {
  map.setView([group.latitude, group.longitude], 16);
}

function addSharedMarker(map: L.Map, groupLayer: L.FeatureGroup, group: MapGroup) {
  const isSharedGroup = group.points.length > 1;
  if (!isSharedGroup) {
    return;
  }

  const circle = L.circle([group.latitude, group.longitude], {
    radius: sharedCircleRadiusMeters(group.points.length),
    color: "#0c5c54",
    weight: 1,
    fillColor: "#0c5c54",
    fillOpacity: 0.08,
    interactive: false,
  });
  circle.addTo(groupLayer);

  const countMarker = L.marker([group.latitude, group.longitude], {
    icon: createCountIcon(group.points.length),
    zIndexOffset: 1000,
    title: `${group.points.length} ogłoszeń w tym punkcie`,
  });

  function handleCountClick() {
    zoomToGroup(map, group);
  }

  countMarker.on("click", handleCountClick);
  countMarker.addTo(groupLayer);
}

function extendBounds(bounds: L.LatLngBounds, groups: MapGroup[]) {
  function extendGroup(group: MapGroup) {
    function extendPoint(point: MapPoint) {
      bounds.extend([point.latitude, point.longitude]);
    }

    group.points.forEach(extendPoint);
  }

  groups.forEach(extendGroup);
}

function readGroupKey(group: MapGroup): string {
  return group.points
    .map(function readPointKey(point) {
      return point.listing.id;
    })
    .join(",");
}

export const ListingsMap = (props: Props) => {
  const { listings, selectedListingId, focusToken, highlightedListingIds, onSelectListing } = props;
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, MarkerRecord>>(new Map());
  const appliedFocusRef = useRef<AppliedFocus>({ map: null, token: 0 });
  const savedViewRef = useRef<L.LatLngTuple | null>(null);
  const savedZoomRef = useRef<number | null>(null);
  const onSelectRef = useRef(onSelectListing);
  const listingsRef = useRef(listings);
  const highlightedIdsRef = useRef(highlightedListingIds);
  listingsRef.current = listings;
  onSelectRef.current = onSelectListing;
  highlightedIdsRef.current = highlightedListingIds;
  const highlightedKey = highlightedListingIds.join("|");
  const groups = buildMapGroups(listings);
  const mapKey = groups.map(readGroupKey).join("|");
  const sharedPinCount = countSharedPins(groups);
  const pinCount = groups.reduce(function sumPins(total, group) {
    return total + group.points.length;
  }, 0);

  useEffect(
    function mountMap() {
      const host = hostRef.current;
      if (!host) {
        return;
      }

      const mapGroups = buildMapGroups(listingsRef.current);
      const isEmpty = mapGroups.length === 0;
      if (isEmpty) {
        return;
      }

      const map = L.map(host).setView([-23.006, -44.32], 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      const groupLayer = L.featureGroup();
      const markers = new Map<string, MarkerRecord>();

      function selectListing(listingId: string) {
        onSelectRef.current(listingId);
      }

      function drawGroup(group: MapGroup) {
        group.points.forEach(function drawPoint(point) {
          const isHighlighted = highlightedIdsRef.current.includes(point.listing.id);
          addListingMarker(groupLayer, point, markers, selectListing, isHighlighted);
        });
        addSharedMarker(map, groupLayer, group);
      }

      mapGroups.forEach(drawGroup);
      markersRef.current = markers;
      mapRef.current = map;
      groupLayer.addTo(map);

      const bounds = L.latLngBounds([]);
      extendBounds(bounds, mapGroups);
      const hasBounds = bounds.isValid();
      const savedView = savedViewRef.current;
      const savedZoom = savedZoomRef.current;
      const hasSavedView = savedView !== null && savedZoom !== null;
      if (hasSavedView) {
        map.setView(savedView, savedZoom);
      }

      if (!hasSavedView && hasBounds) {
        map.fitBounds(bounds.pad(0.12));
      }

      return function destroyMap() {
        savedViewRef.current = [map.getCenter().lat, map.getCenter().lng];
        savedZoomRef.current = map.getZoom();
        map.remove();
        mapRef.current = null;
        markersRef.current = new Map();
      };
    },
    [mapKey],
  );

  useEffect(
    function focusSelectedPin() {
      const map = mapRef.current;
      if (!map) {
        return;
      }

      function syncHighlight(record: MarkerRecord, listingId: string) {
        record.isHighlighted = highlightedIdsRef.current.includes(listingId);
      }

      markersRef.current.forEach(syncHighlight);
      paintSelection(markersRef.current, selectedListingId);
      const selectedMarker = selectedListingId ? markersRef.current.get(selectedListingId) : undefined;
      let highlight: L.Circle | null = null;
      if (selectedMarker) {
        highlight = L.circle(selectedMarker.marker.getLatLng(), {
          radius: 90,
          color: "#1c241f",
          weight: 3,
          fillColor: "#c47b2b",
          fillOpacity: 0.45,
          interactive: false,
        }).addTo(map);
      }

      const appliedFocus = appliedFocusRef.current;
      const isSameMap = appliedFocus.map === map;
      const isAlreadyPointed = isSameMap && appliedFocus.token === focusToken;
      const shouldPoint = focusToken !== 0 && !isAlreadyPointed && Boolean(selectedMarker);
      if (shouldPoint && selectedMarker) {
        appliedFocusRef.current = { map, token: focusToken };
        map.setView(selectedMarker.marker.getLatLng(), 16);
      }

      return function clearHighlight() {
        if (!highlight) {
          return;
        }

        highlight.remove();
      };
    },
    [selectedListingId, focusToken, mapKey, highlightedKey],
  );

  return (
    <div className="map-panel">
      <div ref={hostRef} className="listings-map" />
      <div className="map-key">
        <span>
          <i className="map-pin map-pin--high" /> ocena 80+
        </span>
        <span>
          <i className="map-pin map-pin--mid" /> 65–79
        </span>
        <span>
          <i className="map-pin map-pin--low" /> poniżej 65
        </span>
        <span>
          <i className="map-pin map-pin--highlighted" /> wyróżnione
        </span>
        <span>
          {pinCount} pinów, {sharedPinCount} stoi na wspólnym punkcie OLX
        </span>
      </div>
    </div>
  );
};
