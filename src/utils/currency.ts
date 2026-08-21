export const unformatNumber = (value: string | number | null | undefined) =>
  String(value ?? '').replace(/,/g, '').trim();

export const formatNumberWithCommas = (value: string | number | null | undefined) => {
  const rawValue = String(value ?? '').replace(/[^\d.]/g, '');
  if (!rawValue) return '';

  const [wholePart, decimalPart] = rawValue.split('.');
  const formattedWhole = Number(wholePart || 0).toLocaleString('en-US');

  return decimalPart !== undefined ? `${formattedWhole}.${decimalPart.slice(0, 2)}` : formattedWhole;
};

export const formatEtb = (value: string | number | null | undefined) => {
  const numericValue = Number(unformatNumber(value));
  return `ETB ${Number.isFinite(numericValue) ? numericValue.toLocaleString('en-US') : '0'}`;
};

export const getEtbCurrency = <T extends Record<string, any>>(currencies: T[] = []) =>
  currencies.find((currency) => {
    const searchable = `${currency.sign || ''} ${currency.description || ''} ${currency.name || ''}`.toLowerCase();
    return searchable.includes('etb') || searchable.includes('birr');
  });
