var js_lang_text = {
    other_text: "Other",
    next_text: "Next",
    submit_text: "Submit",
    cancel_text: "Cancel",
    from_text: "From",
    to_text: "To",
    shops_place: (shop) => { return shop + "'s place" },
    choose_a_pos_text: "Please choose a position",
    your_delivery_text: "Your Delivery",
    clc_route_text: "Calculating Route ..",
    clc_price_text: "Calculating Price ..",
    dstnc_too_far_text: "Distance is too far for our service. Please try other places",
    we_dont_wrk_now_text: "Sorry, we don't work around this time",
    dlvr_info_txt: (distance, price, time, thingsPrice) => {
        let text = `Distance: ${distance} km`;
		text += `<br>Price : ${price} DZD<br>Thing's Price : ${thingsPrice} DZD<br>Total : ${price + thingsPrice} DZD`;
        if (time) text += `<br>Waiting time : ~${time} min`;
        else text += '<br>No drivers available right now';
        return text;
    },
    shop_not_wrkn: (name) => {
        return `Sorry, "${name}" isn't working around this time of the day`;
    }
}