import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    connect()
    {
        let uri = window.location.pathname;
        let isBasket = uri.match('/clinics/basket');
        let isSavedBaskets = uri.match('/clinics/saved/baskets');

        $('.panel-item-facts').show();
        $('.panel-shipping').hide();
        $('.panel-taxes').hide();
        $('.modal_availability').hide();

        if(isBasket != null)
        {
            let basketId = $('#btn_basket').attr('data-basket-id');

            this.getBasket(basketId, true, '');
        }

        if(isSavedBaskets != null)
        {
            this.getSavedBaskets();
        }
    }

    onSubmitAddtoBasket(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let data = new FormData($(clickedElement)[0]);
        let productId = data.get('product_id');
        let distributorId = data.get('distributor_id');
        let qty = data.get('qty');
        let qtyError = $('#error_qty_'+ productId +'_'+ distributorId);
        let isValid = true;
        let self = this;

        qtyError.hide()

        if(qty == '' || qty == 'undefined')
        {
            qtyError.show();
            isValid = false;
        }

        if(isValid)
        {
            $.ajax({
                async: "true",
                url: "/clinics/inventory/inventory-add-to-basket",
                type: 'POST',
                contentType: false,
                processData: false,
                cache: false,
                timeout: 600000,
                dataType: 'json',
                data: data,
                beforeSend: function ()
                {
                    self.isLoading(true);
                },
                complete: function(e)
                {
                    if(e.status === 500)
                    {
                        //window.location.href = '/clinics/error';
                    }
                },
                success: function (response)
                {
                    if(response.error.length == '')
                    {
                        self.getFlash(response.message)
                        $(clickedElement).closest('.modal').modal('toggle');
                        $('.modal-backdrop').removeClass('modal-backdrop');
                        $('.fade').removeClass('fade');
                        $('.modal-basket-qty').val(1);
                        self.isLoading(false);

                    }
                    else
                    {
                        $('#error_stock_'+ response.product_id +'_'+ response.distributor_id).show().empty().append(response.error);
                    }
                }
            });
        }
    }

    onClickBackToSearch(e)
    {
        e.preventDefault();

        $('.basket-id').attr('data-basket-id', $('#btn_basket').attr('data-basket-id'));
        $('#clinic_container').empty().append($.session.get('search-results'));
        window.history.pushState(null, "Fluid", '/clinics/inventory');
    }

    onClickBasketLink(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let basketId = $(clickedElement).attr('data-basket-id');

        $('#btn_basket').attr('data-basket-id', basketId);

        if(basketId > 0)
        {
            this.getBasket(basketId, true, '');
        }
    }

    onChangeQty(e)
    {
        let clickedElement = e.currentTarget;
        let itemId = $(clickedElement).data('basket-item-id');
        let qty = $(clickedElement).val();
        let isValid = true;
        let self = this;

        if(isValid)
        {
            $(this).val(1);

            $.ajax({
                async: "true",
                url: "/clinics/inventory/inventory-update-basket",
                type: 'POST',
                dataType: 'json',
                data: {
                    'item-id': itemId,
                    qty: qty
                },
                beforeSend: function ()
                {
                    self.isLoading(true);
                },
                success: function (response)
                {
                    if(response.error.length == 0)
                    {
                        $('#inventory_container').fadeOut(900);

                        let basketId = response.basketId;

                        self.getBasket(basketId, true, '');
                    }
                    else
                    {
                        self.isLoading(false);
                        $('#stock_count_error_'+ response.itemId).show().empty().append(response.error);
                    }
                }
            });
        }
    }

    onClickRemoveItem(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let itemId = $(clickedElement).data('item-id');
        let self = this;

        if(itemId > 0)
        {
            $.ajax({
                async: "true",
                url: "/clinics/inventory/inventory-remove-basket-item",
                type: 'POST',
                dataType: 'json',
                data: {
                    'item-id': itemId
                },
                beforeSend: function ()
                {
                    self.isLoading(true);
                },
                complete: function(e)
                {
                    if(e.status === 500)
                    {
                        window.location.href = '/clinics/error';
                    }
                },
                success: function (response)
                {
                    $('#inventory_container').hide();

                    let basketId = response.basketId;

                    self.getBasket(basketId, true, '');
                }
            });
        }
    }

    onClickClearBasket(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let basketId = $(clickedElement).attr('data-basket-id');

        if(basketId > 0)
        {
            $.ajax({
                async: "true",
                url: "/clinics/inventory/inventory-clear-basket",
                type: 'POST',
                dataType: 'json',
                data: {
                    'basket-id': basketId
                },
                beforeSend: function ()
                {
                    self.isLoading(true);
                },
                success: function (response)
                {
                    $('#inventory_container').hide();

                    let basketId = response.basketId;

                    self.getBasket(basketId, true, '');
                }
            });
        }
    }

    onClickRefreshBasket(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let basketId = $(clickedElement).data('basket-id');

        if(basketId > 0)
        {
            let flash = '<b><i class="fas fa-check-circle"></i> Basket Refreshed.<div class="flash-close"><i class="fa-solid fa-xmark"></i></div>';

            this.getBasket(basketId, true, '');
            this.getFlash(flash);
        }
    }

    onClickPrintBasket(e)
    {
        let clone = $('#basket_items').clone();
        clone.find('#basket_action_row_1').remove();
        clone.find('#basket_action_row_2').remove();
        clone.find('#btn_checkout').remove();
        let htm = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Fluid Commerce</title>';
        htm += '<link rel="stylesheet" media="all" href="/css/bootstrap.min.css"><link rel="stylesheet" media="all" href="/css/style.min.css">';
        htm += '<style type="text/css" media="print">@page { size: landscape; }</style>';
        htm += '<link rel="stylesheet" href="/css/fontawesome/css/all.min.css"></head><body><div class="container-fluid">'+ clone.html();
        htm += '</container></body></html>';

        let w = window.open( '', "Customer Listing", "menubar=0,location=0,height=670,width=700" );
        w.document.write(htm);

        setTimeout(function(){w.print();w.close();},1000);
    }

    onClickSaveItem(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let productId = $(clickedElement).data('product-id');
        let distributorId = $(clickedElement).data('distributor-id');
        let itemId = $(clickedElement).data('item-id');

        if(distributorId > 0 && productId > 0) {

            $.ajax({
                async: "true",
                url: "/clinics/inventory/save-item",
                type: 'POST',
                dataType: 'json',
                data: {
                    'product-id': productId,
                    'distributor-id': distributorId,
                    'item-id': itemId
                },
                beforeSend: function ()
                {
                    self.isLoading(true);
                },
                complete: function(e)
                {
                    if(e.status === 500){
                        window.location.href = '/clinics/error';
                    }
                },
                success: function (response)
                {
                    let basketId = response.basketId;
                    let flash = response.message;

                    self.getBasket(basketId, true, '');
                    self.getFlash(flash);
                }
            });
        }
    }

    onClickRestoreItem(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let productId = $(clickedElement).data('product-id');
        let distributorId = $(clickedElement).data('distributor-id');
        let itemId = $(clickedElement).data('item-id');
        let basketId = $(clickedElement).data('basket-id');

        if(distributorId > 0 && productId > 0) {

            $.ajax({
                async: "true",
                url: "/clinics/inventory/restore-item",
                type: 'POST',
                dataType: 'json',
                data: {
                    'product-id': productId,
                    'distributor-id': distributorId,
                    'item-id': itemId,
                    'basket-id': basketId
                },
                beforeSend: function ()
                {
                    self.isLoading(true);
                },
                complete: function(e)
                {
                    if(e.status === 500)
                    {
                        window.location.href = '/clinics/error';
                    }
                },
                success: function (response)
                {
                    let basketId = response.basketId;
                    let flash = response.message;

                    self.getBasket(basketId, true, '');
                    self.getFlash(flash);
                }
            });
        }
    }

    onClickRemoveSavedItem(e)
    {
        e.preventDefault();

        let self = this;
        let selectedElement = e.currentTarget;
        let itemId = $(selectedElement).data('item-id');
        let productRow = $(selectedElement).closest('.saved-item-row');

        if(itemId > 0)
        {
            $.ajax({
                async: "true",
                url: "/clinics/inventory/remove-saved-item",
                type: 'POST',
                dataType: 'json',
                data: {
                    'item-id': itemId
                },
                beforeSend: function ()
                {
                    self.isLoading(true);
                },
                complete: function(e)
                {
                    if(e.status === 500)
                    {
                        window.location.href = '/clinics/error';
                    }
                },
                success: function (response)
                {
                    if(response.count == 0)
                    {
                        $('#saved_items_container').hide();
                        $('#saved_items').css({
                            'position': 'absolute',
                            'right': 0,
                            'left': 12,
                            'bottom': 0,
                        });
                    }
                    productRow.remove();
                    self.getFlash(response.message);
                    self.isLoading(false);
                }
            });
        }
    }

    onClickSaveAllItems(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let basketId = $(clickedElement).data('basket-id');

        if(basketId > 0)
        {
            $.ajax({
                async: "true",
                url: "/clinics/inventory/save-all-items",
                type: 'POST',
                dataType: 'json',
                data: {
                    'basket-id': basketId
                },
                beforeSend: function ()
                {
                    self.isLoading(true);
                },
                success: function (response)
                {
                    let basketId = response.basketId;
                    let flash = response.message;

                    self.getBasket(basketId, true, '');
                    self.getFlash(flash);
                }
            });
        }
    }

    onClickRestoreAllItems(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let basketId = $(clickedElement).data('basket-id');

        if(basketId > 0) {

            $.ajax({
                async: "true",
                url: "/clinics/inventory/restore-all-items",
                type: 'POST',
                dataType: 'json',
                data: {
                    'basket-id': basketId
                },
                beforeSend: function ()
                {
                    self.isLoading(true);
                },
                complete: function(e, xhr, settings)
                {
                    if(e.status === 500){
                        window.location.href = '/clinics/error';
                    }
                },
                success: function (response)
                {
                    let basketId = response.basketId;
                    let flash = response.message;

                    self.getBasket(basketId, true, '');
                    self.getFlash(flash);
                }
            });
        }
    }

    onClickSavedItemsLink(e)
    {
        e.preventDefault();

        if($('#saved_items_container:visible').length)
        {
            $('#saved_items_container').hide(700);
            $('#saved_items').css({'position':'absolute', 'right': 0, 'left':12});
        }
        else
        {
            $('#saved_items_container').show(700);
            $('#saved_items').css({'position':'relative', 'right': '', 'left':''});
            $(this).closest('.col-12').removeClass('border-bottom');
        }
    }

    onSubmitSaveBasket(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let btn = $(clickedElement).find("button[type=submit]:focus" ).html();
        let clear = 0;

        if(btn == 'SAVE AND CLEAR')
        {
            clear = 1;
        }

        $("<input />").attr("type", "hidden").attr("name", "clear").attr("value", clear).appendTo("#form_save_basket");

        let data = new FormData($(clickedElement)[0]);
        let basketName = $('#basket_name').val();
        let errorBasketName = $('#error_basket_name');
        let isValid = true;

        errorBasketName.hide();

        if(basketName == '' || basketName == 'undefined')
        {
            errorBasketName.show();
            isValid = false;
        }

        if(isValid)
        {
            $.ajax({
                async: "true",
                url: "/clinics/inventory/save-basket",
                type: 'POST',
                contentType: false,
                processData: false,
                cache: false,
                timeout: 600000,
                dataType: 'json',
                data: data,
                success: function (response)
                {
                    self.getFlash(response.message);
                    $('#modal_save_basket').modal('toggle').modal('hide');
                    $('.modal-backdrop').removeClass('modal-backdrop');
                    $('.fade').removeClass('fade');
                    self.getBasket(response.basketId, true, '');
                }
            });
        }
    }

    onClickSavedBaskets(e)
    {
        e.preventDefault();
        this.getSavedBaskets();
    }

    onClickEditBasket(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let basketId = $(clickedElement).data('basket-id');

        $('#basket_name_string_'+ basketId).hide();
        $('#basket_name_input_'+ basketId).show();
        $(clickedElement).replaceWith('<a href="" class="update-saved-basket" id="update_saved_basket_'+ basketId +'" data-basket-id="'+ basketId +'" data-action="click->basket--basket#onClickUpdateSavedBasket"><i class="fa-solid fa-floppy-disk float-end me-3"></i></a>');
        $('#saved_basket_first_'+ basketId).removeClass('saved-basket-link');
    }

    onClickUpdateSavedBasket(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let basketId = $(clickedElement).data('basket-id');
        let basketName = $('#basket_name_'+ basketId).val();

        $.ajax({
            async: "true",
            url: "/clinics/inventory/update-saved-baskets",
            type: 'POST',
            dataType: 'json',
            data: {
                'basket-id':basketId,
                'basket-name':basketName
            },
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            success: function (response)
            {
                self.isLoading(false);
                $('#basket_name_string_'+ basketId).empty().append(basketName).show();
                $('#basket_name_input_'+ basketId).hide();
                $('#update_saved_basket_'+ basketId).replaceWith('<a href="" class="basket-edit" data-basket-id="'+ basketId +'"><i class="fa-solid fa-pencil float-end me-3"></i></a>');
                $('#basket_left_col').empty().append(response);
                $('#saved_basket_first_'+ basketId).addClass('saved-basket-link');
            }
        });
    }

    onClickSavedBasketsLink(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let basketId = $(clickedElement).data('basket-id');
        $('.saved-basket-link').removeClass('bg-secondary');
        $('.saved-basket-panel').hide(700);

        $.ajax({
            async: "true",
            url: "/clinics/inventory/get-saved-basket-details",
            type: 'POST',
            dataType: 'json',
            data: {
                'basket-id':basketId
            },
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            success: function (response)
            {
                $('#saved_basket_panel_'+ basketId).empty().append(response);
                self.isLoading(false);

                $('.saved_basket_header').removeClass('bg-secondary');

                if($('#saved_basket_panel_'+ basketId +':visible').length)
                {
                    $('#saved_basket_panel_' + basketId).hide(700);
                }
                else
                {
                    $('#saved_basket_panel_' + basketId).show(700);
                    $('#saved_basket_header_'+ basketId).addClass('bg-secondary');
                }
            }
        });
    }

    onClickDeleteBasket(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let basketId = $(clickedElement).data('basket-id');

        $.ajax({
            async: "true",
            url: "/clinics/inventory/delete-saved-basket",
            type: 'POST',
            dataType: 'json',
            data: {
                'basket-id':basketId
            },
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            success: function (response)
            {
                self.isLoading(false);
                $('#basket_left_col').empty().append(response.left_col);
                $('#basket_items').empty().append(response.right_col);
            }
        });
    }

    onClickDistributorBasketLink(e)
    {
        e.preventDefault();
        hidePaginator();
        $('.btn-basket-panel-active').removeClass('btn-basket-panel-active');
        $('.btn_item_facts').addClass('btn-basket-panel-active');

        let self = this;
        let clickedElement = e.currentTarget;
        let distributorId = $(clickedElement).data('distributor-id');
        let productId = $(clickedElement).data('product-id');

        $('#error_stock_'+ productId +'_'+ distributorId).empty();
        $('#qty_'+ productId +'_'+ distributorId).val(1);
        $('#panel_item_facts_'+ productId +'_'+ distributorId).show();
        $('#btn_item_facts_'+ productId +'_'+ distributorId).addClass('btn-basket-panel-active');
        $('#panel_shipping_'+ productId +'_'+ distributorId).hide();
        $('#panel_taxes_'+ productId +'_'+ distributorId).hide();

        if($(clickedElement).data('basket-id') == 'undefined')
        {
            self.getBasket($(clickedElement).data('basket-id'), true);
        }
    }

    onClickBtnItemFacts(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let panelItemFacts = $(clickedElement).closest('.modal-footer').find('.panel-item-facts');
        let panelShipping = $(clickedElement).closest('.modal-footer').find('.panel-shipping');
        let panelTaxes = $(clickedElement).closest('.modal-footer').find('.panel-taxes');

        $('.btn-basket-panel-active').removeClass('btn-basket-panel-active');

        if(panelItemFacts.is(':visible'))
        {
            $(panelItemFacts).slideUp(700);
            $(panelShipping).slideUp(700);
            $(panelTaxes).slideUp(700);
        }
        else
        {
            $(panelItemFacts).slideDown(700);
            $(panelShipping).slideUp(700);
            $(panelTaxes).slideUp(700);
            $(clickedElement).addClass('btn-basket-panel-active');
        }
    }

    onClickBtnShipping(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let panelItemFacts = $(clickedElement).closest('.modal-footer').find('.panel-item-facts');
        let panelShipping = $(clickedElement).closest('.modal-footer').find('.panel-shipping');
        let panelTaxes = $(clickedElement).closest('.modal-footer').find('.panel-taxes');

        $('.btn-basket-panel-active').removeClass('btn-basket-panel-active');

        if(panelShipping.is(':visible'))
        {
            $(panelItemFacts).slideUp(700);
            $(panelShipping).slideDown(700);
            $(panelTaxes).slideUp(700);
        }
        else
        {
            $(panelItemFacts).slideUp(700);
            $(panelShipping).slideDown(700);
            $(panelTaxes).slideUp(700);
            $('.btn_shipping').addClass('btn-basket-panel-active');
        }
    }

    onClickBtnTaxes(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let panelItemFacts = $(clickedElement).closest('.modal-footer').find('.panel-item-facts');
        let panelShipping = $(clickedElement).closest('.modal-footer').find('.panel-shipping');
        let panelTaxes = $(clickedElement).closest('.modal-footer').find('.panel-taxes')

        $('.btn-basket-panel-active').removeClass('btn-basket-panel-active');

        if(panelShipping.is(':visible'))
        {
            $(panelItemFacts).slideUp(700);
            $(panelShipping).slideUp(700);
            $(panelTaxes).slideDown(700);
        }
        else
        {
            $(panelItemFacts).slideUp(700);
            $(panelShipping).slideUp(700);
            $(panelTaxes).slideDown(700);
            $('.btn_taxes').addClass('btn-basket-panel-active');
        }
    }

    getBasket(basketId, redirect, savedBasketResponse)
    {
        let self = this;

        self.hidePaginator();

        $.ajax({
            async: "true",
            url: "/clinics/get/basket",
            type: 'POST',
            dataType: 'json',
            data: {
                basket_id: basketId,
                permissions: $.session.get('permissions'),
            },
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            complete: function(e)
            {
                if(e.status === 500)
                {
                    //window.location.href = '/clinics/error';
                }
            },
            success: function (response)
            {
                $('#clinic_container').empty().append(response).fadeIn(500);
                window.scrollTo(0,0);
                $('#return_to_search').attr('data-basket-id', $('#btn_basket').attr('data-basket-id'))
                $("#basket_container").addClass('col-container');
                $('#saved_items_container').hide();
                self.isLoading(false);
                //clearInterval(get_messages);

                if($(window).width() < 992)
                {
                    $('#basket_container').css({ overflow:"hidden" });
                }

                if(redirect)
                {
                    window.history.pushState(null, "Fluid", '/clinics/basket/' + basketId);

                }
                else
                {
                    $('#basket_items').empty().append(savedBasketResponse);

                    $('.saved-basket-panel').each(function ()
                    {
                        $('.saved-basket-panel').hide();
                    });
                }

                self.popOver();
            }
        });
    }

    getFlash(flash)
    {
        $('#flash').addClass('alert-success').removeClass('alert-danger').addClass('alert').addClass('text-center');
        $('#flash').removeClass('users-flash').addClass('users-flash').empty().append(flash).removeClass('hidden');

        setTimeout(function()
        {
            $('#flash').removeClass('alert-success').removeClass('alert').removeClass('text-center');
            $('#flash').removeClass('users-flash').empty().addClass('hidden');
        }, 5000);
    }

    isLoading(status)
    {
        if(status)
        {
            $("div.spanner").addClass("show");
            $("div.overlay").addClass("show");

        }
        else
        {
            $("div.spanner").removeClass("show");
            $("div.overlay").removeClass("show");
        }
    }

    hidePaginator(){

        $('#paginator').empty().hide();
    }

    getSavedBaskets(redirect)
    {
        let self = this;

        $.ajax({
            async: "true",
            url: "/clinics/inventory/get-saved-baskets",
            type: 'GET',
            dataType: 'json',
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            complete: function(e)
            {
                if(e.status === 500)
                {
                    window.location.href = '/clinics/error';
                }
            },
            success: function (response)
            {
                self.isLoading(false);
                self.getBasket($('#btn_basket').data('basket-id'), false, response);

                //window.history.pushState(null, "Fluid", '/clinics/saved/baskets');
            }
        });
    }

    popOver()
    {
        var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
        var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl)
        })
    }
}