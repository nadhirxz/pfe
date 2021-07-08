let input = document.getElementById('code-field');
let invalid = document.getElementById('code-feed');
let button = document.getElementById('confirm');
let error = document.getElementById('err-msg');
let try_again = document.getElementById('try-again');
let loadingImage = document.getElementById('loading-img');

socket.emit("confirm_page");

socket.on("confirm_page_data", (data) => {
    loadingImage.classList.add('d-none');
    document.getElementById("info-msg").innerHTML = js_lang_text.confirm_page_data(data);
});

socket.on("retry_time_left", (data) => {
    if(data.time_left) {
        try_again.innerHTML = js_lang_text.you_can_retry_in(data.time_left);
    } else {
        try_again.innerHTML = `${js_lang_text.didnt_receive_any_msg}<br><a id="retry" href="#">${js_lang_text.retry}</a>`;
        document.getElementById("retry").addEventListener("click",() => {
            socket.emit("retry", data);
            setTimeout(window.location.reload(false),2000);
        });
    }
    loadingImage.classList.add('d-none');
});
socket.on("pin_confirmed", () => {
    window.location.href = "/";
});
socket.on("pin_invalid", (data) => {
    input.classList.add("is-invalid");
    invalid.innerHTML = js_lang_text.invld(data);
    loadingImage.classList.add('d-none');
});
socket.on("tried_too_much", (data) => {
    error.innerHTML = js_lang_text.tried_too_much;
    if (data) {
        error.innerHTML+= try_again_in(data);
    }
    try_again.remove();
    loadingImage.classList.add('d-none');
});
socket.on("err_happened", (data) => {
    error.innerHTML = js_lang_text.err_happened;
    loadingImage.className = 'd-none py-1';
});

button.addEventListener("click",() => {
    loadingImage.classList.remove('d-none');
    socket.emit("confirm_pin", input.value);
});



function onlyNumberKey(evt) {
    // Only ASCII charactar in that range allowed
    var ASCIICode = (evt.which) ? evt.which : evt.keyCode
    if (ASCIICode > 31 && (ASCIICode < 48 || ASCIICode > 57))
        return false;
    return true;
}