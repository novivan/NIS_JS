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
    for (i = 0; i < a.body.length; ++i) {
        if (a.body[i].length != ln || ln != b.body[i].length) return false;
    }
    return true;
}

function add(a, b) {
    if (!check_size_for_addition(a, b)) return null;
    let ret = Object.create(Object.getPrototypeOf(a));
    ret.body = new Array(a.length).fill(new Array(a[0].length));
    for (i = 0; i < a.body.length; i++) {
        for (j = 0; j < a.body[0].length; j++) {
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
    for (i = 0; i < a.body.length; i++) {
        for (j = 0; j < b.body[0].length; j++) {
            for (k = 0; k < a.body[0].length; k++) {
                ret.body[i][j] += a.body[i][k] * b.body[k][j];
            }
        }
    }
    return ret;
}



const MATRIX_TO_RIGHT = new Matrix([[0, 1], [-1, 0]]);
const MATRIX_TO_LEFT = new Matrix([[0, -1], [1, 0]]);

let button_play_with_bot = document.getElementById("bot");
let field_size;



function get_selected_size() {
    field_size = document.querySelector('input[name="field-size"]:checked');
    if (field_size == null) {
        alert("Для начала, выберите размер поля, пожалуйста");
        return 1;
        // код возврата, чтоб обработать в основной функции
    }
    // Получаем из ввода сторону квадрата
    field_size = Number(field_size.value.substring(0, 2));
    return 0;
}

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

function make_placing() {

}

button_play_with_bot.addEventListener("click", function(){
    let errno = get_selected_size();
    if (errno) {
        return;
    }
    alert(typeof(field_size));
    alert(field_size);
    alert("Hooray!!!");
    
});