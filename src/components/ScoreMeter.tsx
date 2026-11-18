interface Props {
  score: number;
  label: string;
}

export const ScoreMeter = (props: Props) => {
  const { score, label } = props;
  const width = `${Math.max(0, Math.min(100, score))}%`;

  return (
    <span className="score" title={label}>
      <span className="score__value">{score}</span>
      <span className="score__track" aria-hidden="true">
        <span className="score__fill" style={{ width }} />
      </span>
    </span>
  );
};
