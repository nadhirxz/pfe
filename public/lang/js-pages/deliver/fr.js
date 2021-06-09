js_lang_text = {
    next_text: "Suivant",
    prev_text: "Précédent",
    submit_text: "Soumettre",
    cancel_text: "Annuler",
    from_text: "De",
    to_text: "À",
    choose_a_pos_text: "Veuillez choisir un poste",
    your_delivery_text: "Votre livraison",
    clc_route_text: "Calcul de l'itinéraire ..",
    clc_price_text: "Calcul du prix ..",
    dstnc_too_far_text: "La distance est trop loin pour notre service. Veuillez essayer d'autres endroits",
    we_dont_wrk_now_text: "Désolé, nous ne travaillons pas à cette heure",
    cant_fnsh_in_wrk_time_txt: "Désolé, nous ne pouvons pas terminer votre livraison pendant notre temps de travail",
    dlvr_info_txt: (distance, price, time, w) => {
        let text = `Distance: ${distance} km`;
        if (w) text += `<s><br>Prix : ${price} DZD</s> GRATUIT!`
        else text += `<br>Prix : ${price} DZD`;
        if (time) text += `<br>Temps d'attente : ~${time} min`;
        else text += '<br>Aucun livreur disponible pour le moment';
        return text;
    }
}