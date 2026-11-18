interface Props {
  traits: string[];
}

function renderTrait(trait: string) {
  return (
    <li key={trait} className="trait">
      {trait}
    </li>
  );
}

export const TraitList = (props: Props) => {
  const { traits } = props;

  return <ul className="traits">{traits.map(renderTrait)}</ul>;
};
