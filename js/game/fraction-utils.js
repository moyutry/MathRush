// Pure fraction math helpers -- gcd/lcm/reduce/mixed-conversion and the
// four arithmetic ops on {n, d} pairs. No randomness/generation here (see
// fraction-math.js); every function is a pure transform, always returning
// an already-reduced result so callers never need to reduce again.
MR.Game = MR.Game || {};

MR.Game.FractionUtils = {
  gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { [a, b] = [b, a % b]; }
    return a || 1;
  },

  lcm(a, b) {
    return Math.abs(a * b) / this.gcd(a, b);
  },

  reduce(f) {
    const g = this.gcd(f.n, f.d);
    return { n: f.n / g, d: f.d / g };
  },

  // Improper fraction (n/d, n >= d) -> {whole, n, d} with a proper remainder.
  toMixed(f) {
    const whole = Math.floor(f.n / f.d);
    return { whole, n: f.n - whole * f.d, d: f.d };
  },

  fromMixed(mixed) {
    return this.reduce({ n: mixed.whole * mixed.d + mixed.n, d: mixed.d });
  },

  add(a, b) {
    return this.reduce({ n: a.n * b.d + b.n * a.d, d: a.d * b.d });
  },

  sub(a, b) {
    return this.reduce({ n: a.n * b.d - b.n * a.d, d: a.d * b.d });
  },

  mul(a, b) {
    return this.reduce({ n: a.n * b.n, d: a.d * b.d });
  },

  div(a, b) {
    return this.reduce({ n: a.n * b.d, d: a.d * b.n });
  }
};
