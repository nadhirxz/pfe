js_lang_text = {
    next_text: "Next",
    prev_text: "Previous",
    submit_text: "Submit",
    cancel_text: "Cancel",
    from_text: "From",
    to_text: "To",
    choose_a_pos_text: "Please choose a position",
    your_delivery_text: "Your Delivery",
    clc_route_text: "Calculating Route ..",
    clc_price_text: "Calculating Price ..",
    dstnc_too_far_text: "Distance is too far for our service. Please try other places",
    we_dont_wrk_now_text: "Sorry, we don't work around this time",
    cant_fnsh_in_wrk_time_txt: "Sorry, we cannot finish your delivery within our working time",
    dlvr_info_txt: (distance, price, time) => {
        let text = `Distance: ${distance} km`;
        text += `<br>Price : ${price} DZD`;
        if (time) text += `<br>Waiting time : ~${time} min`;
        else text += '<br>No drivers available right now';
        return text;
    }
}