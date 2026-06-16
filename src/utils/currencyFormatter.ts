export const currencyFormatter = (value: string | number | undefined | null) => {
  if (value === undefined || value === null || value === "") return "";
  const stringValue = String(value);
  const parts = stringValue.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${parts.join(',')}`;
};

export const currencyParser = (value: string | undefined) => {
  if (!value) return "" as unknown as number;
  const cleanValue = value.replace(/R\$\s?/g, '').replace(/\./g, '');
  return cleanValue.replace(/,/g, '.') as unknown as number;
};
