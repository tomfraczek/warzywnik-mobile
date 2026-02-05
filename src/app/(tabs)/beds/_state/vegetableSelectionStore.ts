type SelectedVegetable = {
  id: string;
  name: string;
};

let selectedVegetable: SelectedVegetable | null = null;

export const setSelectedVegetable = (vegetable: SelectedVegetable) => {
  selectedVegetable = vegetable;
};

export const consumeSelectedVegetable = () => {
  const vegetable = selectedVegetable;
  selectedVegetable = null;
  return vegetable;
};
