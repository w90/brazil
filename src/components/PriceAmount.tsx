import { formatBrl, formatEurFromBrl, formatPlnFromBrl } from "../domain/format";

interface Props {
  price: number | null | undefined;
  previousPrice?: number | null;
}

export const PriceAmount = (props: Props) => {
  const { price, previousPrice } = props;
  const hasPrice = typeof price === "number";
  const hasPreviousPrice = Boolean(previousPrice);

  if (!hasPrice) {
    return <strong>—</strong>;
  }

  return (
    <span className="price">
      <strong>{formatBrl(price)}</strong>
      {hasPreviousPrice ? <span className="muted strike">{formatBrl(previousPrice)}</span> : null}
      <span className="price__rule" />
      <span>{formatEurFromBrl(price)}</span>
      <span className="price__rule" />
      <span>{formatPlnFromBrl(price)}</span>
    </span>
  );
};
