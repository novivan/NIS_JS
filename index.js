import { Matrix, Pair, add, mult, MATRIX_TO_RIGHT, MATRIX_TO_LEFT, Ship } from "./ArithmNshipClasses.js"

let button_play_with_bot = document.getElementById("bot");
let field_size;
let board;


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

function make_placing() {
    board = document.getElementById("board");
    
    document.getElementById("gameType").style.display = 'none';
    alert("Oookay!!!");
    //document.getElementById("size").style.display = 'none';
    document.getElementById('size').querySelectorAll('label').forEach(label => {
        label.style.display = 'none';
    });
    return 1;
}

button_play_with_bot.addEventListener("click", function(){
    let errno = get_selected_size();
    if (errno) {
        return;
    }
    alert(typeof(field_size));
    alert(field_size);
    alert("Hooray!!!");
    make_placing();
});