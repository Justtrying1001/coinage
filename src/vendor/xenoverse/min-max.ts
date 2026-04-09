export class MinMax {
  public min = Number.POSITIVE_INFINITY;

  public max = Number.NEGATIVE_INFINITY;

  add(value: number): void {
    this.min = Math.min(this.min, value);
    this.max = Math.max(this.max, value);
  }

  toPair(): [number, number] {
    const min = Number.isFinite(this.min) ? this.min : 0;
    const max = Number.isFinite(this.max) ? this.max : 0;
    return [min, max];
  }
}

