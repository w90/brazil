import { useState, type FocusEvent } from "react";
import { formatStarRatingSummary, type StarRatingView } from "../domain/listingStarRatings";

interface Props {
  listingId: string;
  starRating: StarRatingView;
  onRate: (listingId: string, stars: number | null) => void;
}

const starValues = [1, 2, 3, 4, 5];

export const StarRating = (props: Props) => {
  const { listingId, starRating, onRate } = props;
  const [hoveredStars, setHoveredStars] = useState<number | null>(null);
  const summary = formatStarRatingSummary(starRating);

  function clearHover() {
    setHoveredStars(null);
  }

  function handleGroupBlur(event: FocusEvent<HTMLDivElement>) {
    const nextTarget = event.relatedTarget;
    const isStillInside = nextTarget instanceof Node && event.currentTarget.contains(nextTarget);
    if (isStillInside) {
      return;
    }

    clearHover();
  }

  function renderStar(starValue: number) {
    const isHovering = hoveredStars !== null;
    const isInHover = isHovering && starValue <= hoveredStars;
    const isFull = !isHovering && starRating.ownStars !== null && starValue <= starRating.ownStars;
    const isPressed = starRating.ownStars === starValue;

    function starClassName(): string {
      if (isInHover) {
        return "star-rating__star is-hover";
      }

      if (isFull) {
        return "star-rating__star is-full";
      }

      return "star-rating__star is-empty";
    }

    function handleStarClick() {
      const isSameRating = starRating.ownStars === starValue;
      if (isSameRating) {
        return;
      }

      onRate(listingId, starValue);
    }

    function handleStarEnter() {
      setHoveredStars(starValue);
    }

    return (
      <button
        key={starValue}
        className={starClassName()}
        type="button"
        aria-label={`Ocena ${starValue} na 5`}
        aria-pressed={isPressed}
        onClick={handleStarClick}
        onMouseEnter={handleStarEnter}
        onFocus={handleStarEnter}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2.4 14.8 8l6.2.9-4.5 4.4 1.1 6.2L12 16.6 6.4 19.5l1.1-6.2L3 8.9 9.2 8 12 2.4z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="star-rating" onMouseLeave={clearHover} onBlur={handleGroupBlur}>
      <div className="star-rating__stars" role="group" aria-label={`Twoja ocena: ${listingId}`}>
        {starValues.map(renderStar)}
      </div>
      <p className="star-rating__summary">{summary}</p>
    </div>
  );
};
