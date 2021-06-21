var js_lang_text = {
    other_text: "أخرى",
    next_text: "التالى",
    submit_text: "تأكيد",
    cancel_text: "إلغاء",
    from_text: "من",
    to_text: "إلى",
    shops_place: (shop) => { return `مكان ${shop}` },
    choose_a_pos_text: "يرجى اختيار موقع",
    your_delivery_text: "طلب التسليم",
    clc_route_text: "يتم حساب المسافة ..",
    clc_price_text: "يتم حساب السعر ..",
    dstnc_too_far_text: "المسافة بعيدة جدًا لخدمتنا. يرجى اختيار أماكن أخرى",
    we_dont_wrk_now_text: "عذرا ، نحن لا نعمل في هذا الوقت",
    dlvr_info_txt: (distance, price, time, thingsPrice) => {
        let text = `المسافة: ${distance} كم`;
        text += `<br>سعر التوصيل : ${price} دج<br>سعر الغرض : ${thingsPrice} دج<br>المجموع : ${price + thingsPrice} دج`;
        if (time) text += `<br>وقت الإنتظار : ~${time} د`;
        else text += '<br>لا يوجد أي سائق متاح للتوصيل الآن';
        return text;
    },
    shop_not_wrkn: (name) => {
        return `عذرا, "${name}" لا يعمل في هذا الوقت`;
    }
}