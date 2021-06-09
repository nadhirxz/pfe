js_lang_text = {
    submit_text: "تأكيد",
    cancel_text: "إلغاء",
    from_text: "من",
    to_text: "إلى",
    choose_a_pos_text: "يرجى اختيار موقع",
    your_delivery_text: "طلب التسليم",
    clc_route_text: "يتم حساب المسافة ..",
    clc_price_text: "يتم حساب السعر ..",
    dstnc_too_far_text: "المسافة بعيدة جدًا لخدمتنا. يرجى اختيار أماكن أخرى",
    we_dont_wrk_now_text: "عذرا ، نحن لا نعمل في هذا الوقت",
    cant_fnsh_in_wrk_time_txt: "عذرًا ، لا يمكننا إنهاء التسليم خلال وقت العمل الخاص بنا",
    dlvr_info_txt: (distance, price, time, w) => {
        let text = `المسافة: ${distance} كم`;
        if (w) text += `<s><br>السعر : ${price} دج</s> مجانا!`
        else text += `<br>السعر : ${price} دج`;
        if (time) text += `<br>وقت الإنتظار : ~${time} د`;
        else text += '<br>لا يوجد أي سائق متاح للتوصيل الآن';
        return text;
    }
}