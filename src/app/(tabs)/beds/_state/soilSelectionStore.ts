type SelectedSoil = {
  id: string;
  name: string;
};

let selectedSoil: SelectedSoil | null = null;

export const setSelectedSoil = (soil: SelectedSoil) => {
  selectedSoil = soil;
};

export const consumeSelectedSoil = () => {
  const soil = selectedSoil;
  selectedSoil = null;
  return soil;
};
