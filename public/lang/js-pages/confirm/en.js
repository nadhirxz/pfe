var js_lang_text = {
    confirm_page_data: (data) => { return "We've sent an sms to " + data + "<br>containing a 6-digit verification code." },
    didnt_receive_any_msg: "Didn't receive any message ?",
    retry: "Retry",
    you_can_retry_in: (m) => { return `<br>You can retry in ${m} ${m > 1 ? 'minutes' : 'minute'}.` },
    tried_too_much: "You tried too much.",
    try_again_in : (m) => { return `<br> try again in ${m} ${m > 1 ? 'minutes' : 'minute'}.` },
    err_happened: "An error happened. Please try again.",
	invld: (n) => `Invalid Code. You have ${n} retries left`,
}