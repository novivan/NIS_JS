class Matrix {
    constructor(table) {
        this.body = new Array();
        for (let line in table) {
            let arr = new Array();
            for (let elem in line) {
                arr.push(elem)
            }
            this.body.push(arr);
        }
    }
}

class Pair extends Matrix{
    constructor(a, b) {
        super([[a], [b]]);
    }
}

function check_size_for_addition(a, b) {
    if (a.body.length != b.body.length) return false;
    if (a.body.length == 0) return true;
    const ln = a.body[0].length;
    for (let i = 0; i < a.body.length; ++i) {
        if (a.body[i].length != ln || ln != b.body[i].length) return false;
    }
    return true;
}

function add(a, b) {
    if (!check_size_for_addition(a, b)) return null;
    let ret = Object.create(Object.getPrototypeOf(a));
    ret.body = new Array(a.length).fill(new Array(a[0].length));
    for (let i = 0; i < a.body.length; i++) {
        for (let j = 0; j < a.body[0].length; j++) {
            ret.body[i][j] = a.body[i][j] + b.body[i][j];
        }
    }
    return ret;
}

function check_size_for_multiplication(a, b) {
    if (a.body[0].length != b.body.length) return false;
    return true;
}

function mult(a, b) {
    if (!check_size_for_multiplication(a, b)) return null;
    let ret = Object.create(Object.getPrototypeOf(a));
    ret.body = new Array(b.body.length).fill(new Array(a.body[0].length).fill(0));
    for (let i = 0; i < a.body.length; i++) {
        for (let j = 0; j < b.body[0].length; j++) {
            for (let k = 0; k < a.body[0].length; k++) {
                ret.body[i][j] += a.body[i][k] * b.body[k][j];
            }
        }
    }
    return ret;
}

const MATRIX_TO_RIGHT = new Matrix([[0, 1], [-1, 0]]);
const MATRIX_TO_LEFT = new Matrix([[0, -1], [1, 0]]);


class Ship { // Содержит точку кормы(координаты), направления корабля(координаты вектора), длину
    constructor(stern, direction, length) {
        this.stern = stern; //просто 2 координаты (тоже попобую сделать матрицу)
        this.direction = direction; //какой-то вектор на 2 координаты (попробую сделать матрицу)
        this.length = length; // число
    }
    turn_right() {
        this.direction = mult(MATRIX_TO_RIGHT, this.direction);
    }
    turn_left() {
        this.direction = mult(MATRIX_TO_LEFT, this.direction);
    }
    down() {
        this.direction = add(this.stern, Pair(-1, 0));
    }

    up() {
        this.direction = add(this.stern, Pair(1, 0));
    }

    right() {
        this.direction = add(this.stern, Pair(0, 1));
    }

    left() {
        this.direction = add(this.stern, Pair(0, -1));
    }
}


export { Matrix, Pair, add, mult, MATRIX_TO_RIGHT, MATRIX_TO_LEFT, Ship };