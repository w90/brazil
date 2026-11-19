interface Props {
  visitorName: string;
}

export const AppHeader = (props: Props) => {
  const { visitorName } = props;
  const flagSrc = `${import.meta.env.BASE_URL}favicon.svg`;

  return (
    <header className="hero">
      <div className="hero__brand">
        <img className="hero__logo" src={flagSrc} alt="Flaga Brazylii" />
        <div>
          <p className="hero__kicker">Costa Verde · Angra dos Reis</p>
          <h1>Domy, które warto zobaczyć</h1>
          <p className="hero__hello">Witaj {visitorName}</p>
        </div>
      </div>
      <nav className="hero__nav">
        <a href="#mapa">Mapa</a>
        <a href="#oznaczone">Wyróżnione</a>
        <a href="#wszystkie">Pozostałe</a>
        <a href="#telefony">Telefony biur</a>
        <a href="#top">25 najlepszych</a>
        <a href="#zdjete">Zdjęte</a>
        <a href="#odrzucone">Odrzucone</a>
      </nav>
    </header>
  );
};
