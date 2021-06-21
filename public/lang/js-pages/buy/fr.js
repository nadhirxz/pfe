var js_lang_text = {
    other_text: "Autre",
    next_text: "Prochain",
    submit_text: "Soumettre",
    cancel_text: "Annuler",
    from_text: "De",
    to_text: "À",
    shops_place: (shop) => {return "Place de "+ shop},
    choose_a_pos_text: "Veuillez choisir un poste",
    your_delivery_text: "Votre livraison",
    clc_route_text: "Calcul de l'itinéraire ..",
    clc_price_text: "Calcul du prix ..",
    dstnc_too_far_text: "La distance est trop loin pour notre service. Veuillez essayer d'autres endroits",
    we_dont_wrk_now_text: "Désolé, nous ne travaillons pas à cette heure",
    dlvr_info_txt: (distance, price, time, thingsPrice) => {
        let text = `Distance: ${distance} km`;
        text += `<br>Prix du livraison : ${price} DZD<br>Prix du chose : ${thingsPrice} DZD<br>Total : ${price + thingsPrice} DZD`;
        if (time) text += `<br>Temps d'attente : ~${time} min`;
        else text += '<br>Aucun livreur disponible pour le moment';
        return text;
    },
    shop_not_wrkn: (name) => {
        return `Désolé, "${name}" ne travaille pas à cette heure de la journée.`;
    }
}