import * as React from "react";

export function floorTo(v: number, round: number) {
  return Math.floor(v / round) * round;
}

export function ceilTo(v: number, round: number) {
  return Math.ceil(v / round) * round;
}

export function epsilonEquals(value: number, other: number): boolean {
  return Math.abs(value - other) < 0.0000001;
}

export class Size {
  w: number;
  h: number;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
  }

  setElements(w: number, h: number): Size {
    this.w = w;
    this.h = h;
    return this;
  }
}

export class Point {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  setElements(x: number, y: number): Point {
    this.x = x;
    this.y = y;
    return this;
  }

  set(other: Point): Point {
    this.x = other.x;
    this.y = other.y;
    return this;
  }

  dot(other: Point): number {
    return this.x * other.x + this.y * other.y;
  }

  squaredLength(): number {
    return this.dot(this);
  }

  distanceTo(other: Point): number {
    return Math.sqrt(this.dot(other));
  }

  sub(other: Point): Point {
    this.x -= other.x;
    this.y -= other.y;
    return this;
  }

  mul(value: number): Point {
    this.x *= value;
    this.y *= value;
    return this;
  }

  clone(): Point {
    return new Point(this.x, this.y);
  }

  toString(digits: number = 2) {
    return "{x: " + this.x.toFixed(digits) + ", y: " + this.y.toFixed(digits) + "}";
  }

  static createEmpty(): Point {
    return new Point(0, 0);
  }

  static createEmptyPoints(count: number): Point[] {
    var result = [];
    for (var i = 0; i < count; i++) {
      result.push(new Point(0, 0));
    }
    return result;
  }
}

export class Rectangle {
  static allocationCount = 0;

  x: number;
  y: number;
  w: number;
  h: number;

  private static _temporary = new Rectangle(0, 0, 0, 0);

  private static _dirtyStack: Rectangle[] = [];

  constructor(x: number, y: number, w: number, h: number) {
    this.setElements(x, y, w, h);
    Rectangle.allocationCount++;
  }

  setElements(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  set(other: Rectangle) {
    this.x = other.x;
    this.y = other.y;
    this.w = other.w;
    this.h = other.h;
  }

  contains(other: Rectangle): boolean {
    var r1 = other.x + other.w;
    var b1 = other.y + other.h;
    var r2 = this.x + this.w;
    var b2 = this.y + this.h;
    return (other.x >= this.x) &&
      (other.x < r2) &&
      (other.y >= this.y) &&
      (other.y < b2) &&
      (r1 > this.x) &&
      (r1 <= r2) &&
      (b1 > this.y) &&
      (b1 <= b2);
  }

  containsPoint(point: Point): boolean {
    return (point.x >= this.x) &&
      (point.x < this.x + this.w) &&
      (point.y >= this.y) &&
      (point.y < this.y + this.h);
  }

  extendPoint(point: Point) {
    if (this.containsPoint(point)) {
      return;
    }
    let x = this.x, y = this.y;
    this.x = Math.min(x, point.x);
    this.y = Math.min(y, point.y);
    let x0 = x + this.w;
    let y0 = y + this.h;
    x0 = Math.max(x0, point.x);
    y0 = Math.max(y0, point.y);
    this.w = x0 - this.x;
    this.h = y0 - this.y;
  }

  isContained(others: Rectangle[]) {
    for (var i = 0; i < others.length; i++) {
      if (others[i].contains(this)) {
        return true;
      }
    }
    return false;
  }

  isSmallerThan(other: Rectangle): boolean {
    return this.w < other.w && this.h < other.h;
  }

  isLargerThan(other: Rectangle): boolean {
    return this.w > other.w && this.h > other.h;
  }

  union(other: Rectangle) {
    if (this.isEmpty()) {
      this.set(other);
      return;
    } else if (other.isEmpty()) {
      return;
    }
    var x = this.x, y = this.y;
    if (this.x > other.x) {
      x = other.x;
    }
    if (this.y > other.y) {
      y = other.y;
    }
    var x0 = this.x + this.w;
    if (x0 < other.x + other.w) {
      x0 = other.x + other.w;
    }
    var y0 = this.y + this.h;
    if (y0 < other.y + other.h) {
      y0 = other.y + other.h;
    }
    this.x = x;
    this.y = y;
    this.w = x0 - x;
    this.h = y0 - y;
  }

  isEmpty(): boolean {
    return this.w <= 0 || this.h <= 0;
  }

  setEmpty() {
    this.x = 0;
    this.y = 0;
    this.w = 0;
    this.h = 0;
  }

  intersect(other: Rectangle) {
    var result = Rectangle.createEmpty();
    if (this.isEmpty() || other.isEmpty()) {
      result.setEmpty();
      return result;
    }
    result.x = Math.max(this.x, other.x);
    result.y = Math.max(this.y, other.y);
    result.w = Math.min(this.x + this.w, other.x + other.w) - result.x;
    result.h = Math.min(this.y + this.h, other.y + other.h) - result.y;
    if (result.isEmpty()) {
      result.setEmpty();
    }
    this.set(result);
  }

  intersects(other: Rectangle): boolean {
    if (this.isEmpty() || other.isEmpty()) {
      return false;
    }
    var x = Math.max(this.x, other.x);
    var y = Math.max(this.y, other.y);
    var w = Math.min(this.x + this.w, other.x + other.w) - x;
    var h = Math.min(this.y + this.h, other.y + other.h) - y;
    return !(w <= 0 || h <= 0);
  }

  /**
   * Tests if this rectangle intersects the AABB of the given rectangle.
   */
  intersectsTransformedAABB(other: Rectangle, matrix: Matrix): boolean {
    var rectangle = Rectangle._temporary;
    rectangle.set(other);
    matrix.transformRectangleAABB(rectangle);
    return this.intersects(rectangle);
  }

  intersectsTranslated(other: Rectangle, tx: number, ty: number): boolean {
    if (this.isEmpty() || other.isEmpty()) {
      return false;
    }
    var x = Math.max(this.x, other.x + tx);
    var y = Math.max(this.y, other.y + ty);
    var w = Math.min(this.x + this.w, other.x + tx + other.w) - x;
    var h = Math.min(this.y + this.h, other.y + ty + other.h) - y;
    return !(w <= 0 || h <= 0);
  }

  area(): number {
    return this.w * this.h;
  }

  clone(): Rectangle {
    var rectangle: Rectangle = Rectangle.allocate();
    rectangle.set(this);
    return rectangle;
  }

  static allocate(): Rectangle {
    var dirtyStack = Rectangle._dirtyStack;
    if (dirtyStack.length) {
      return dirtyStack.pop();
    } else {
      return new Rectangle(12345, 67890, 12345, 67890);
    }
  }

  free() {
    Rectangle._dirtyStack.push(this);
  }

  /**
   * Snaps the rectangle to pixel boundaries. The computed rectangle covers
   * the original rectangle.
   */
  snap(): Rectangle {
    var x1 = Math.ceil(this.x + this.w);
    var y1 = Math.ceil(this.y + this.h);
    this.x = Math.floor(this.x);
    this.y = Math.floor(this.y);
    this.w = x1 - this.x;
    this.h = y1 - this.y;
    return this;
  }

  snapTo(dx: number, dy: number): Rectangle {
    var x1 = ceilTo(this.x + this.w, dx);
    var y1 = ceilTo(this.y + this.h, dy);
    this.x = floorTo(this.x, dx);
    this.y = floorTo(this.y, dy);
    this.w = x1 - this.x;
    this.h = y1 - this.y;
    return this;
  }

  scale(x: number, y: number): Rectangle {
    this.x *= x;
    this.y *= y;
    this.w *= x;
    this.h *= y;
    return this;
  }

  offset(x: number, y: number): Rectangle {
    this.x += x;
    this.y += y;
    return this;
  }

  resize(w: number, h: number): Rectangle {
    this.w += w;
    this.h += h;
    return this;
  }

  expand(w: number, h: number): Rectangle {
    this.offset(-w, -h).resize(2 * w, 2 * h);
    return this;
  }

  expandPercent(w: number, h: number): Rectangle {
    w = this.w *= w;
    h = this.h *= h;
    this.offset(-w, -h).resize(2 * w, 2 * h);
    return this;
  }

  getCenter(): Point {
    return new Point(this.x + this.w / 2, this.y + this.h / 2);
  }

  getAbsoluteBounds(): Rectangle {
    return new Rectangle(0, 0, this.w, this.h);
  }

  toString(digits: number = 2): string {
    return "{" +
      this.x.toFixed(digits) + ", " +
      this.y.toFixed(digits) + ", " +
      this.w.toFixed(digits) + ", " +
      this.h.toFixed(digits) +
      "}";
  }

  static createEmpty(): Rectangle {
    var rectangle = Rectangle.allocate();
    rectangle.setEmpty();
    return rectangle;
  }

  static createFromPoints(points: number [][]) {
    let minX = minArray(points, 0);
    let maxX = maxArray(points, 0);
    let minY = minArray(points, 1);
    let maxY = maxArray(points, 1);
    return new Rectangle(minX, minY, maxX - minX, maxY - minY);
  }

  static createSquare(size: number): Rectangle {
    return new Rectangle(-size / 2, -size / 2, size, size);
  }

  getCorners(points: Point[]) {
    points[0].x = this.x;
    points[0].y = this.y;

    points[1].x = this.x + this.w;
    points[1].y = this.y;

    points[2].x = this.x + this.w;
    points[2].y = this.y + this.h;

    points[3].x = this.x;
    points[3].y = this.y + this.h;
  }
}

/**
   * Used to write fast paths for common matrix types.
   */
export const enum MatrixType {
  Unknown = 0x0000,
  Identity = 0x0001,
  Translation = 0x0002
}

export class Matrix {
  static allocationCount = 0;

  private _data: Float64Array;
  private _type: MatrixType;

  private static _dirtyStack: Matrix[] = [];

  public set a(a: number) {
    this._data[0] = a;
    this._type = MatrixType.Unknown;
  }

  public get a(): number {
    return this._data[0];
  }

  public set b(b: number) {
    this._data[1] = b;
    this._type = MatrixType.Unknown;
  }

  public get b(): number {
    return this._data[1];
  }

  public set c(c: number) {
    this._data[2] = c;
    this._type = MatrixType.Unknown;
  }

  public get c(): number {
    return this._data[2];
  }

  public set d(d: number) {
    this._data[3] = d;
    this._type = MatrixType.Unknown;
  }

  public get d(): number {
    return this._data[3];
  }

  public set tx(tx: number) {
    this._data[4] = tx;
    if (this._type === MatrixType.Identity) {
      this._type = MatrixType.Translation;
    }
  }

  public get tx(): number {
    return this._data[4];
  }

  public set ty(ty: number) {
    this._data[5] = ty;
    if (this._type === MatrixType.Identity) {
      this._type = MatrixType.Translation;
    }
  }

  public get ty(): number {
    return this._data[5];
  }

  private static _svg: SVGSVGElement;


  constructor(a: number, b: number, c: number, d: number, tx: number, ty: number) {
    this._data = new Float64Array(6);
    this._type = MatrixType.Unknown;
    this.setElements(a, b, c, d, tx, ty);
    Matrix.allocationCount++;
  }



  setElements(a: number, b: number, c: number, d: number, tx: number, ty: number) {
    var m = this._data;
    m[0] = a;
    m[1] = b;
    m[2] = c;
    m[3] = d;
    m[4] = tx;
    m[5] = ty;
    this._type = MatrixType.Unknown;
  }

  set(other: Matrix) {
    var m = this._data, n = other._data;
    m[0] = n[0];
    m[1] = n[1];
    m[2] = n[2];
    m[3] = n[3];
    m[4] = n[4];
    m[5] = n[5];
    this._type = other._type;
  }

  /**
   * Whether the transformed query rectangle is empty after this transform is applied to it.
   */
  emptyArea(query: Rectangle): boolean {
    var m = this._data;
    // TODO: Work out the details here.
    if (m[0] === 0 || m[3] === 0) {
      return true;
    }
    return false;
  }

  /**
   * Whether the area of transformed query rectangle is infinite after this transform is applied to it.
   */
  infiniteArea(query: Rectangle): boolean {
    var m = this._data;
    // TODO: Work out the details here.
    if (Math.abs(m[0]) === Infinity ||
      Math.abs(m[3]) === Infinity) {
      return true;
    }
    return false;
  }

  isEqual(other: Matrix) {
    if (this._type === MatrixType.Identity && other._type === MatrixType.Identity) {
      return true;
    }
    var m = this._data, n = other._data;
    return m[0] === n[0] &&
      m[1] === n[1] &&
      m[2] === n[2] &&
      m[3] === n[3] &&
      m[4] === n[4] &&
      m[5] === n[5];
  }

  clone(): Matrix {
    var matrix = Matrix.allocate();
    matrix.set(this);
    return matrix;
  }

  static allocate(): Matrix {
    var dirtyStack = Matrix._dirtyStack;
    var matrix = null;
    if (dirtyStack.length) {
      return dirtyStack.pop();
    } else {
      return new Matrix(12345, 12345, 12345, 12345, 12345, 12345);
    }
  }

  free() {
    Matrix._dirtyStack.push(this);
  }

  transform(a: number, b: number, c: number, d: number, tx: number, ty: number): Matrix {
    var m = this._data;
    var _a = m[0], _b = m[1], _c = m[2], _d = m[3], _tx = m[4], _ty = m[5];
    m[0] = _a * a + _c * b;
    m[1] = _b * a + _d * b;
    m[2] = _a * c + _c * d;
    m[3] = _b * c + _d * d;
    m[4] = _a * tx + _c * ty + _tx;
    m[5] = _b * tx + _d * ty + _ty;
    this._type = MatrixType.Unknown;
    return this;
  }

  transformRectangle(rectangle: Rectangle, points: Point[]) {
    var m = this._data, a = m[0], b = m[1], c = m[2], d = m[3], tx = m[4], ty = m[5];

    var x = rectangle.x;
    var y = rectangle.y;
    var w = rectangle.w;
    var h = rectangle.h;

    /*
     0---1
     | / |
     3---2
     */

    points[0].x = a * x + c * y + tx;
    points[0].y = b * x + d * y + ty;
    points[1].x = a * (x + w) + c * y + tx;
    points[1].y = b * (x + w) + d * y + ty;
    points[2].x = a * (x + w) + c * (y + h) + tx;
    points[2].y = b * (x + w) + d * (y + h) + ty;
    points[3].x = a * x + c * (y + h) + tx;
    points[3].y = b * x + d * (y + h) + ty;
  }

  isTranslationOnly(): boolean {
    if (this._type === MatrixType.Translation) {
      return true;
    }
    var m = this._data;
    if (m[0] === 1 &&
      m[1] === 0 &&
      m[2] === 0 &&
      m[3] === 1) {
      this._type = MatrixType.Translation;
      return true;
    } else if (epsilonEquals(m[0], 1) &&
      epsilonEquals(m[1], 0) &&
      epsilonEquals(m[2], 0) &&
      epsilonEquals(m[3], 1)) {
      this._type = MatrixType.Translation;
      return true;
    }
    return false;
  }

  transformRectangleAABB(rectangle: Rectangle) {
    var m = this._data;
    if (this._type === MatrixType.Identity) {
      return;
    } else if (this._type === MatrixType.Translation) {
      rectangle.x += m[4];
      rectangle.y += m[5];
      return;
    }

    var a = m[0], b = m[1], c = m[2], d = m[3], tx = m[4], ty = m[5];
    var x = rectangle.x;
    var y = rectangle.y;
    var w = rectangle.w;
    var h = rectangle.h;

    /*
     0---1
     | / |
     3---2
     */

    var x0 = a * x + c * y + tx;
    var y0 = b * x + d * y + ty;

    var x1 = a * (x + w) + c * y + tx;
    var y1 = b * (x + w) + d * y + ty;

    var x2 = a * (x + w) + c * (y + h) + tx;
    var y2 = b * (x + w) + d * (y + h) + ty;

    var x3 = a * x + c * (y + h) + tx;
    var y3 = b * x + d * (y + h) + ty;

    var tmp = 0;

    // Manual Min/Max is a lot faster than calling Math.min/max
    // X Min-Max
    if (x0 > x1) { tmp = x0; x0 = x1; x1 = tmp; }
    if (x2 > x3) { tmp = x2; x2 = x3; x3 = tmp; }

    rectangle.x = x0 < x2 ? x0 : x2;
    rectangle.w = (x1 > x3 ? x1 : x3) - rectangle.x;

    // Y Min-Max
    if (y0 > y1) { tmp = y0; y0 = y1; y1 = tmp; }
    if (y2 > y3) { tmp = y2; y2 = y3; y3 = tmp; }

    rectangle.y = y0 < y2 ? y0 : y2;
    rectangle.h = (y1 > y3 ? y1 : y3) - rectangle.y;
  }

  scale(x: number, y: number): Matrix {
    var m = this._data;
    m[0] *= x;
    m[1] *= y;
    m[2] *= x;
    m[3] *= y;
    m[4] *= x;
    m[5] *= y;
    this._type = MatrixType.Unknown;
    return this;
  }

  scaleClone(x: number, y: number): Matrix {
    if (x === 1 && y === 1) {
      return this;
    }
    return this.clone().scale(x, y);
  }

  rotate(angle: number): Matrix {
    var m = this._data, a = m[0], b = m[1], c = m[2], d = m[3], tx = m[4], ty = m[5];
    var cos = Math.cos(angle);
    var sin = Math.sin(angle);
    m[0] = cos * a - sin * b;
    m[1] = sin * a + cos * b;
    m[2] = cos * c - sin * d;
    m[3] = sin * c + cos * d;
    m[4] = cos * tx - sin * ty;
    m[5] = sin * tx + cos * ty;
    this._type = MatrixType.Unknown;
    return this;
  }

  concat(other: Matrix): Matrix {
    if (other._type === MatrixType.Identity) {
      return this;
    }

    var m = this._data, n = other._data;
    var a = m[0] * n[0];
    var b = 0.0;
    var c = 0.0;
    var d = m[3] * n[3];
    var tx = m[4] * n[0] + n[4];
    var ty = m[5] * n[3] + n[5];

    if (m[1] !== 0.0 || m[2] !== 0.0 || n[1] !== 0.0 || n[2] !== 0.0) {
      a += m[1] * n[2];
      d += m[2] * n[1];
      b += m[0] * n[1] + m[1] * n[3];
      c += m[2] * n[0] + m[3] * n[2];
      tx += m[5] * n[2];
      ty += m[4] * n[1];
    }

    m[0] = a;
    m[1] = b;
    m[2] = c;
    m[3] = d;
    m[4] = tx;
    m[5] = ty;

    this._type = MatrixType.Unknown;
    return this;
  }

  concatClone(other: Matrix): Matrix {
    return this.clone().concat(other);
  }

  /**
   * this = other * this
   */
  public preMultiply(other: Matrix): void {
    var m = this._data, n = other._data;
    if (other._type === MatrixType.Translation &&
      (this._type & (MatrixType.Identity | MatrixType.Translation))) {
      m[4] += n[4];
      m[5] += n[5];
      this._type = MatrixType.Translation;
      return;
    } else if (other._type === MatrixType.Identity) {
      return;
    }
    var a = n[0] * m[0];
    var b = 0.0;
    var c = 0.0;
    var d = n[3] * m[3];
    var tx = n[4] * m[0] + m[4];
    var ty = n[5] * m[3] + m[5];

    if (n[1] !== 0.0 || n[2] !== 0.0 || m[1] !== 0.0 || m[2] !== 0.0) {
      a += n[1] * m[2];
      d += n[2] * m[1];
      b += n[0] * m[1] + n[1] * m[3];
      c += n[2] * m[0] + n[3] * m[2];
      tx += n[5] * m[2];
      ty += n[4] * m[1];
    }

    m[0] = a;
    m[1] = b;
    m[2] = c;
    m[3] = d;
    m[4] = tx;
    m[5] = ty;
    this._type = MatrixType.Unknown;
  }

  translate(x: number, y: number): Matrix {
    var m = this._data;
    m[4] += x;
    m[5] += y;
    if (this._type === MatrixType.Identity) {
      this._type = MatrixType.Translation;
    }
    return this;
  }

  setIdentity() {
    var m = this._data;
    m[0] = 1;
    m[1] = 0;
    m[2] = 0;
    m[3] = 1;
    m[4] = 0;
    m[5] = 0;
    this._type = MatrixType.Identity;
  }

  isIdentity(): boolean {
    if (this._type === MatrixType.Identity) {
      return true;
    }
    var m = this._data;
    return m[0] === 1 && m[1] === 0 && m[2] === 0 &&
      m[3] === 1 && m[4] === 0 && m[5] === 0;
  }

  transformPoint(point: Point): Point {
    if (this._type === MatrixType.Identity) {
      return point;
    }
    var m = this._data;
    var x = point.x;
    var y = point.y;
    point.x = m[0] * x + m[2] * y + m[4];
    point.y = m[1] * x + m[3] * y + m[5];
    return point;
  }

  transformPoints(points: Point[]) {
    if (this._type === MatrixType.Identity) {
      return;
    }
    for (var i = 0; i < points.length; i++) {
      this.transformPoint(points[i]);
    }
  }

  deltaTransformPoint(point: Point) {
    if (this._type === MatrixType.Identity) {
      return;
    }
    var m = this._data;
    var x = point.x;
    var y = point.y;
    point.x = m[0] * x + m[2] * y;
    point.y = m[1] * x + m[3] * y;
  }

  inverse(result: Matrix) {
    var m = this._data, r = result._data;
    if (this._type === MatrixType.Identity) {
      result.setIdentity();
      return;
    } else if (this._type === MatrixType.Translation) {
      r[0] = 1;
      r[1] = 0;
      r[2] = 0;
      r[3] = 1;
      r[4] = -m[4];
      r[5] = -m[5];
      result._type = MatrixType.Translation;
      return;
    }
    var b = m[1];
    var c = m[2];
    var tx = m[4];
    var ty = m[5];
    if (b === 0 && c === 0) {
      var a = r[0] = 1 / m[0];
      var d = r[3] = 1 / m[3];
      r[1] = 0;
      r[2] = 0;
      r[4] = -a * tx;
      r[5] = -d * ty;
    } else {
      var a = m[0];
      var d = m[3];
      var determinant = a * d - b * c;
      if (determinant === 0) {
        result.setIdentity();
        return;
      }
      determinant = 1 / determinant;
      r[0] = d * determinant;
      b = r[1] = -b * determinant;
      c = r[2] = -c * determinant;
      d = r[3] = a * determinant;
      r[4] = -(r[0] * tx + c * ty);
      r[5] = -(b * tx + d * ty);
    }
    result._type = MatrixType.Unknown;
    return;
  }

  getTranslateX(): number {
    return this._data[4];
  }

  getTranslateY(): number {
    return this._data[4];
  }

  getScaleX(): number {
    var m = this._data;
    if (m[0] === 1 && m[1] === 0) {
      return 1;
    }
    var result = Math.sqrt(m[0] * m[0] + m[1] * m[1]);
    return m[0] > 0 ? result : -result;
  }

  getScaleY(): number {
    var m = this._data;
    if (m[2] === 0 && m[3] === 1) {
      return 1;
    }
    var result = Math.sqrt(m[2] * m[2] + m[3] * m[3]);
    return m[3] > 0 ? result : -result;
  }

  getScale(): number {
    return (this.getScaleX() + this.getScaleY()) / 2;
  }

  getAbsoluteScaleX(): number {
    return Math.abs(this.getScaleX());
  }

  getAbsoluteScaleY(): number {
    return Math.abs(this.getScaleY());
  }

  getRotation(): number {
    var m = this._data;
    return Math.atan(m[1] / m[0]) * 180 / Math.PI;
  }

  isScaleOrRotation(): boolean {
    var m = this._data;
    return Math.abs(m[0] * m[2] + m[1] * m[3]) < 0.01;
  }

  toString(digits: number = 2): string {
    var m = this._data;
    return "{" +
      m[0].toFixed(digits) + ", " +
      m[1].toFixed(digits) + ", " +
      m[2].toFixed(digits) + ", " +
      m[3].toFixed(digits) + ", " +
      m[4].toFixed(digits) + ", " +
      m[5].toFixed(digits) + "}";
  }

  public toWebGLMatrix(): Float32Array {
    var m = this._data;
    return new Float32Array([
      m[0], m[1], 0, m[2], m[3], 0, m[4], m[5], 1
    ]);
  }

  public toCSSTransform(): string {
    var m = this._data;
    return "matrix(" +
      m[0] + ", " +
      m[1] + ", " +
      m[2] + ", " +
      m[3] + ", " +
      m[4] + ", " +
      m[5] + ")";
  }

  public static createIdentity(): Matrix {
    var matrix = Matrix.allocate();
    matrix.setIdentity();
    return matrix;
  }

  static multiply = function (dst: Matrix, src: Matrix) {
    var n = src._data;
    dst.transform(n[0], n[1], n[2], n[3], n[4], n[5]);
  };

  public snap(): boolean {
    var m = this._data;
    if (this.isTranslationOnly()) {
      m[0] = 1;
      m[1] = 0;
      m[2] = 0;
      m[3] = 1;
      m[4] = Math.round(m[4]);
      m[5] = Math.round(m[5]);
      this._type = MatrixType.Translation;
      return true;
    }
    return false;
  }
}

interface PlotProps {
  width: number;
  height: number;
}

interface PlotState {
}

export interface PlotAxis {
  title?: string;
  min?: number;
  max?: number;
}

export class Plot<P extends PlotProps, S> extends React.Component<P, S> {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  ratio: number = window.devicePixelRatio;
  transform = Matrix.createIdentity();

  device: Rectangle;
  viewport: Rectangle;
  logical: Rectangle;

  textSize = 6;
  textPadding = 4;

  componentDidMount() {
    //this.resetDeviceAndViewport(this.props.width, this.props.height);
  }
  resetDeviceAndViewport(w: number, h: number) {
    this.device = new Rectangle(0, 0, w * this.ratio, h * this.ratio);
    this.canvas.width = this.device.w;
    this.canvas.height = this.device.h;
    let ratio = this.device.h / this.device.w;
    this.viewport = new Rectangle(0, 0, 1, 1);
    this.logical = new Rectangle(-1024, -1024, 2048, 2048);
    this.ctx.setTransform(1, 0, 0, -1, 0, this.device.h);
  }
  componentWillReceiveProps(nextProps: P, nextContext: any) {
    if (this.props.width != nextProps.width || this.props.height != nextProps.height) {
      this.resetDeviceAndViewport(nextProps.width, nextProps.height);
    }
  }
  canvasDidMount(canvas: HTMLCanvasElement) {
    if (!canvas || this.canvas) {
      return;
    }
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.resetDeviceAndViewport(this.props.width, this.props.height);
    this.draw();
  }

  draw() {
    this.updateTransform();
    this.drawBackground();
    this.drawGridLines();
    this.drawAxis();
  }
  updateTransform() {
    let xScale = this.device.w / this.viewport.w;
    let yScale = this.device.h / this.viewport.h;
    let xOffset = -this.viewport.x * xScale;
    let yOffset = -this.viewport.y * yScale;
    this.transform.setElements(xScale, 0, 0, yScale, xOffset, yOffset);
  }
  drawBackground() {
    this.ctx.fillStyle = "#F0F0F0";
    let r = this.device;
    this.ctx.fillRect(0, 0, r.w, r.h);
  }
  drawLine(a: Point, b: Point) {
    let c = this.ctx;
    a = this.transform.transformPoint(a.clone());
    b = this.transform.transformPoint(b.clone());
    c.beginPath()
    c.moveTo(a.x, a.y);
    c.lineTo(b.x, b.y);
    c.stroke();
  }
  drawDot(a: Point) {
    let c = this.ctx;
    a = this.transform.transformPoint(a.clone());
    c.beginPath()
    c.beginPath();
    c.arc(a.x, a.y, 2 * this.ratio, 0, 2 * Math.PI);
    c.stroke();
    c.fill();
  }
  drawDeviceText(a: Point, text: string, dx = 0, dy = 0, hAlign = "left", vAlign = "bottom") {
    let c = this.ctx;
    c.font = (this.textSize * this.ratio) + "pt Roboto Mono";
    c.save();
    c.setTransform(1, 0, 0, 1, 0, this.device.h);
    c.textAlign = hAlign;
    c.textBaseline = vAlign;
    c.fillText(text, a.x + dx, -a.y + -dy);
    c.restore();
  }
  drawAxis() {
    let c = this.ctx;
    c.strokeStyle = "#000000";
    c.lineWidth = 2;

    let a = Point.createEmpty();
    let b = Point.createEmpty();

    // X
    a.setElements(this.logical.x, 0);
    b.setElements(this.logical.x + this.logical.w, 0);
    this.drawLine(a, b);

    // Y
    a.setElements(0, this.logical.y);
    b.setElements(0, this.logical.y + this.logical.h);
    this.drawLine(a, b);
  }
  tickBarW = 32;
  tickBarH = 16;
  drawTickBars() {
    let c = this.ctx;
    c.strokeStyle = "#FFFFFF";
    c.fillStyle = "#AAAAAA";
    c.lineWidth = 2;

    let dx = this.viewport.w / 10;
    let dy = this.viewport.h / 10;

    let r = this.viewport.clone().snapTo(dx, dy);
    let a = Point.createEmpty();
    let b = Point.createEmpty();

    let p = 4 * this.ratio;

    // Horizontal Bar
    c.fillStyle = "#FFFFFF";
    c.fillRect(0, 0, this.device.w, this.tickBarH * this.ratio);
    c.fillStyle = "#AAAAAA";

    // Horizontal Labels
    for (let x = r.x; x < r.x + r.w; x += dx) {
      a.setElements(x, 0);
      this.transform.transformPoint(a);
      a.y = 0;
      this.drawDeviceText(a, x.toFixed(2), 0, p, "center");
    }

    // Vertical Bar
    c.fillStyle = "#FFFFFF";
    c.fillRect(0, 0, this.tickBarW * this.ratio, this.device.h);
    c.fillStyle = "#AAAAAA";

    // Vertical Labels
    for (let y = r.y; y < r.y + r.h; y += dy) {
      a.setElements(0, y);
      this.transform.transformPoint(a);
      a.x = 0;
      this.drawDeviceText(a, y.toFixed(2), p, 0, "left", "middle");
    }
  }
  drawGridLines() {
    let c = this.ctx;
    c.strokeStyle = "#FFFFFF";
    c.fillStyle = "#AAAAAA";
    c.lineWidth = 2;

    let dx = this.viewport.w / 10;
    let dy = this.viewport.h / 10;
    let r = this.viewport.clone().snapTo(dx, dy);
    let a = Point.createEmpty();
    let b = Point.createEmpty();

    // Horizontal
    for (let x = r.x; x < r.x + r.w; x += dx) {
      a.setElements(x, r.y);
      b.setElements(x, r.y + r.h);
      this.drawLine(a, b);
    }

    // Vertical
    for (let y = r.y; y < r.y + r.h; y += dy) {
      a.setElements(r.x, y);
      b.setElements(r.x + r.w, y);
      this.drawLine(a, b);
    }
  }
  render() {
    if (this.canvas && this.ctx) {
      this.draw();
    }
    // return <canvas width={this.device.w} height={this.device.h} style={{ width: this.props.width, height: this.props.height }} ref={this.canvasDidMount.bind(this)} />
    return <canvas style={{ width: this.props.width, height: this.props.height }} ref={this.canvasDidMount.bind(this)} />
  }
}

export interface ScatterPlotSeries {
  name: string;
  color: string;
  values: number[][];
  xAxis: PlotAxis;
  yAxis: PlotAxis;
}

export interface ScatterPlotProps extends PlotProps {
  series: ScatterPlotSeries[];
}

export interface ScatterPlotState extends PlotState {
  series: ScatterPlotSeries[];
}

function minArray(array: number[][], index: number) {
  let min = Number.MAX_VALUE;
  for (let i = 0; i < array.length; i++) {
    let v = array[i][index];
    if (isNaN(v)) continue
    min = Math.min(min, v);
  }
  return min;
}

function maxArray(array: number[][], index: number) {
  let max = Number.MIN_VALUE;
  for (let i = 0; i < array.length; i++) {
    let v = array[i][index];
    if (isNaN(v)) continue
    max = Math.max(max, v);
  }
  return max;
}

export function sortArray(array: number[][], index: number) {
  array.sort((a, b) => {
    return a[index] - b[index];
  });
}

export class ScatterPlot extends Plot<ScatterPlotProps, ScatterPlotState> {
  constructor(props: ScatterPlotProps) {
    super();
    this.state = { series: props.series };
  }

  componentWillReceiveProps(nextProps: ScatterPlotProps, nextContext: any) {
    super.componentWillReceiveProps(nextProps, nextContext);
    if (this.props.series != nextProps.series ||
        this.props.width != nextProps.width ||
        this.props.height != nextProps.height) {
      this.setState({series: nextProps.series}, () => {
        this.fitSeries();
        this.draw();
      })
    }
  }

  componentDidMount() {
    super.componentDidMount();
    this.fitSeries();
  }

  resetDeviceAndViewport(w: number, h: number) {
    super.resetDeviceAndViewport(w, h);
    this.fitSeries();
  }

  fitSeries() {
    let series = this.state.series;
    let viewport = Rectangle.createEmpty();
    let a = Point.createEmpty();
    let r = new Rectangle(0, 0, 0, 0);
    series.forEach(s => {
      let v = s.values.slice(0);
      let xAxis = s.xAxis || {};
      let yAxis = s.yAxis || {};
      v.push([+xAxis.min, +yAxis.min]);
      v.push([+xAxis.max, +yAxis.max]);
      r.union(Rectangle.createFromPoints(v));
    });

    this.viewport = r;

    let dx = ((this.tickBarW + 10) * this.ratio) * (this.viewport.w / this.device.w);
    let dy = ((this.tickBarH + 10) * this.ratio) * (this.viewport.h / this.device.h);

    this.viewport.x -= dx;
    this.viewport.y -= dy;
    this.viewport.w += dx * 2;
    this.viewport.h += dy * 2;
  }
  draw() {
    super.draw();
    let c = this.ctx;
    let series = this.state.series;
    let a = Point.createEmpty();
    let b = Point.createEmpty();

    for (let j = 0; j < series.length; j++) {
      c.fillStyle = c.strokeStyle = series[j].color;
      let s = series[j];
      let v = s.values;
      for (let i = 1; i < v.length; i++) {
        a.setElements(v[i - 1][0], v[i - 1][1]);
        b.setElements(v[i][0], v[i][1]);
        this.drawLine(a, b);
        this.drawDot(a);
        if (i == v.length - 1) {
          this.drawDot(b);
        }
      }
    }

    this.drawTickBars();
  }
}