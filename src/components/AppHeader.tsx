interface Props {
  activeCount: number;
  removedCount: number;
  scannedOn: string;
}

export const AppHeader = (props: Props) => {
  const { activeCount, removedCount, scannedOn } = props;

  return (
    <header className="hero">
      <p className="hero__kicker">Costa Verde · Angra dos Reis</p>
      <h1>Domy, które warto zobaczyć</h1>
      <p className="hero__lead">
        {activeCount} aktywnych ogłoszeń z Twojej listy OLX, od najtańszych. {removedCount} linków
        OLX już zdjęło. Skan z {scannedOn}. Jeden link był stroną wyników wyszukiwania, nie domem —
        został pominięty. Duplikaty też.
      </p>
      <p className="hero__note">
        Pełne numery są ze stron biur i wizytówek, dobrane do prefiksu z OLX. Trzy konta nie mają
        publicznego numeru: JP Mallet, Flávio Del Monte i Adriana Peres.
      </p>
      <nav className="hero__nav">
        <a href="#mapa">Mapa</a>
        <a href="#telefony">Telefony biur</a>
        <a href="#wszystkie">Wszystkie wg ceny</a>
        <a href="#top">25 najlepszych</a>
        <a href="#zdjete">Zdjęte</a>
      </nav>
    </header>
  );
};
