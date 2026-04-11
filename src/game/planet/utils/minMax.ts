export class MinMax {
  private minValue = Number.POSITIVE_INFINITY;
  private maxValue = Number.NEGATIVE_INFINITY;

  add(value: number) {
    this.minValue = Math.min(this.minValue, value);
    this.maxValue = Math.max(this.maxValue, value);
  }

  get min() {
    return this.minValue;
  }

  get max() {
    return this.maxValue;
  }
}
