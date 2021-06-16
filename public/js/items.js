const l = {
	en: {
		in_stock: "In Stock",
		items_saved: "Items saved successfully",
		item_added: "Item added successfully",
		err: "An error happened. Please try again",
		add_item: "Add New Item"
	},
	fr: {
		in_stock: "En Stock",
		items_saved: "Éléments enregistrés avec succès",
		item_added: "Élément ajouté avec succès",
		err: "Une erreur s'est produite. Veuillez réessayer",
		add_item: "Ajouter un nouvel objet"
	},
	ar: {
		in_stock: "يوجد سلعة",
		items_saved: "تم حفظ العناصر بنجاح",
		item_added: "تمت إضافة العنصر بنجاح",
		err: "حدث خطأ. حاول مرة اخرى",
		add_item: "إضافة سلعة جديدة"
	}
}

$('#add-items').on('click', () => {
	click(null, true);
});

items.forEach(item => $('#' + item.id).on('click', () => click(item.id)));

const x = ' <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">		<path d="M1.293 1.293a1 1 0 0 1 1.414 0L8 6.586l5.293-5.293a1 1 0 1 1 1.414 1.414L9.414 8l5.293 5.293a1 1 0 0 1-1.414 1.414L8 9.414l-5.293 5.293a1 1 0 0 1-1.414-1.414L6.586 8 1.293 2.707a1 1 0 0 1 0-1.414z"/></svg>';
const y = ' <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-check-lg" viewBox="0 0 16 16"><path d="M13.485 1.431a1.473 1.473 0 0 1 2.104 2.062l-7.84 9.801a1.473 1.473 0 0 1-2.12.04L.431 8.138a1.473 1.473 0 0 1 2.084-2.083l4.111 4.112 6.82-8.69a.486.486 0 0 1 .04-.045z"/></svg>'

function click(id, add = false) {
	let item = add ? { name: '', price: 0, inStock: true } : [...items].find(e => e.id == id);

	$('#modal-label').html(add ? l[lng].add_item : item.name);
	$('#item-name').val(item.name);
	$('#item-price').val(item.price);

	if (item.inStock) {
		$('#stock-btn').removeClass('btn-danger').addClass('btn-success').html(l[lng].in_stock + y);
	} else {
		$('#stock-btn').removeClass('btn-success').addClass('btn-danger').html(l[lng].in_stock + x);
	}

	$('#stock-btn').off();
	$('#stock-btn').on('click', (e) => {
		item.inStock = !item.inStock;
		if (item.inStock) {
			$(e.target).removeClass('btn-danger').addClass('btn-success').html(l[lng].in_stock + y);
		} else {
			$(e.target).removeClass('btn-success').addClass('btn-danger').html(l[lng].in_stock + x);
		}
	});

	$('#save-btn').off();
	$('#save-btn').on('click', () => {
		item.name = $('#item-name').val() || item.name;
		let price = parseInt($('#item-price').val());
		item.price = (price || price == 0) && price > -1 ? price : item.price;
		post(`/partner/${add ? 'add' : 'edit'}-item${add ? '' : '/' + item.id}`, item);
	});
}

let url = location.search.substring(1); // url parameters
if (url) {
	let params = JSON.parse('{"' + decodeURI(url).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}'); // url params parser
	if ('success' in params) {
		if (params.success == 'add' || params.success == 'edit') {
			$('#alert').removeClass('d-none alert-info alert-warning').addClass('alert-info').html(params.success == 'add' ? l[lng].item_added : l[lng].items_saved);
		} else {
			$('#alert').removeClass('d-none alert-info alert-warning').addClass('alert-warning').html(l[lng].err);
		}
	}
	if ('err' in params) $('#alert').removeClass('d-none alert-info alert-warning').addClass('alert-warning').html(l[lng].err);
	setTimeout(() => {
		$('#alert').fadeOut();
	}, 2500);
}

function post(path, params, method = 'post') {

	// The rest of this code assumes you are not using a library.
	// It can be made less wordy if you use one.
	const form = document.createElement('form');
	form.method = method;
	form.action = path;

	for (const key in params) {
		if (params.hasOwnProperty(key)) {
			const hiddenField = document.createElement('input');
			hiddenField.type = 'hidden';
			hiddenField.name = key;
			hiddenField.value = params[key];

			form.appendChild(hiddenField);
		}
	}

	document.body.appendChild(form);
	form.submit();
}

function onlyNumberKey(evt) {
	// Only ASCII charactar in that range allowed
	var ASCIICode = (evt.which) ? evt.which : evt.keyCode
	if (ASCIICode > 31 && (ASCIICode < 48 || ASCIICode > 57))
		return false;
	return true;
}