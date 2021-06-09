var js_lang_text = {
    confirm_page_data: (data) => { return "لقد أرسلنا رسالة قصيرة إلى " + data + "<br>تحتوي رمز التأكيد المكون من 6 أرقام." },
    didnt_receive_any_msg: "لم تتلق أي رسالة ؟",
    retry: "أعد المحاولة",
    you_can_retry_in: (m) => { return `<br>يمكنك إعادة المحاولة في غضون ${m} ${m > 1 ? 'دقائق' : 'دقيقة'}.` },
    tried_too_much: "لقد استخدمت العديد من المحاولات.",
    try_again_in : (m) => { return `<br> حاول مجددا في غضون ${m} ${m > 1 ? 'دقائق' : 'دقيقة'}.` },
    err_happened: "حدث خطأ. حاول مرة أخرى.",
}