interface Props {
  activeCount: number;
  removedCount: number;
  scannedOn: string;
}

export const SiteIntro = (props: Props) => {
  const { activeCount, removedCount, scannedOn } = props;

  return (
    <section id="opis" className="site-intro">
      <p className="hero__lead">
        {activeCount} aktywnych ogłoszeń z Twojej listy OLX, od najtańszych. {removedCount} linków OLX
        już zdjęło. Skan z {scannedOn}. Jeden link był stroną wyników wyszukiwania, nie domem — został
        pominięty. Duplikaty też.
      </p>
      <p className="hero__note">
        Pełne numery są ze stron biur i wizytówek, dobrane do prefiksu z OLX. Trzy konta nie mają
        publicznego numeru: JP Mallet, Flávio Del Monte i Adriana Peres.
      </p>
    </section>
  );
};
