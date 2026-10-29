export function lineAmount(quantity: number, price: number, discount = 0): number {
  const q = BigInt(Math.round(quantity * 10000));
  const p = BigInt(Math.round(price * 10000));
  const d = BigInt(Math.round(discount * 10000));
  return Number((q * p * (1000000n - d) + 5000000000n) / 10000000000n) / 10000;
}
export function sumAmounts(values: number[]): number { return Number(values.reduce((sum, value) => sum + BigInt(Math.round(value * 10000)), 0n)) / 10000; }
