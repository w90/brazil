interface Props {
  medianPricePerSquareMeter: number;
}

export const ScoreLegend = (props: Props) => {
  const { medianPricePerSquareMeter } = props;
  const medianLabel = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(medianPricePerSquareMeter);

  return (
    <section className="legend" id="jak-liczymy">
      <h2>Jak liczona jest ocena</h2>
      <p>
        <strong>Jakość</strong> (0–100) patrzy na to, po co jedzie się do Angra dos Reis: dom na piasku albo przy
        wodzie, prywatna plaża, widok, miejsce na łódź, kondominium, basen, liczba suit i metraż.
        Punkty za wodę nie sumują się — liczy się najmocniejszy sygnał.
      </p>
      <p>
        <strong>Ocena</strong> w pierwszej tabeli to 75% jakości i 25% ceny za m². Mediana tej listy to{" "}
        {medianLabel}/m². Dom tańszy od mediany dostaje wyższą ocenę, droższy niższą. Druga tabela
        jest ułożona samą jakością, bez premii za niską cenę.
      </p>
    </section>
  );
};
