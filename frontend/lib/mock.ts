export function getMockPrices(seed = 7, count = 4): number[] {
  let state = seed;
  let price = 100;
  const values: number[] = [];

  for (let index = 0; index < count; index += 1) {
    state = (state * 1664525 + 1013904223) % 4294967296;
    const drift = ((state / 4294967296) - 0.5) * 4;
    price = Number((price + drift).toFixed(2));
    values.push(price);
  }

  return values;
}
