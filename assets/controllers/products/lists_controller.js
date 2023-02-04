import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    connect()
    {
        let uri = window.location.pathname;
        let isManageLists = uri.match('/clinics/inventory/lists');
        let isEditList = uri.match('/clinics/inventory/manage/list/[0-9]+');

        if(isManageLists != null)
        {
            let keyword = '';

            this.getAllLists(keyword);
        }

        if(isEditList != null)
        {
            let listId = uri.slice(-1);

            this.getSingleList(listId);
        }
    }

    onClickListsPanelBtn(e)
    {
        let clickedElement = e.currentTarget;
        let parent = $(clickedElement).closest('.prd-container').closest('.row');
        let productId = $(clickedElement).data('product-id');

        if(parent.find('.panel-lists').is(':visible'))
        {
            parent.find('.panel-lists').slideUp(700);
            parent.find('.search-panels-container').slideUp(700);
            $(clickedElement).removeClass('active');
        }
        else
        {
            let keyword = '';

            if($('#search_field').val() != '' || $('#search_field').val() != 'undefined') {

                keyword = $('#search_field').val();
            }

            $.ajax({
                async: "true",
                url: "/clinics/inventory/get-lists",
                type: 'POST',
                cache: false,
                timeout: 600000,
                dataType: 'json',
                data: {
                    id: productId,
                    keyword: keyword,
                    permissions: $.session.get('permissions'),
                },
                success: function (response)
                {
                    parent.find('.panel-lists').empty();
                    parent.find('.panel-lists').append(response);
                }
            });

            parent.find('.search-panels-container').show();
            parent.find('.panel-details').slideUp(700);
            parent.find('.panel-lists').slideDown(700);
            parent.find('.panel-tracking').slideUp(700);
            parent.find('.panel-reviews').slideUp(700);
            parent.find('.panel-notes').slideUp(700);
            parent.find('.btn_details').removeClass('active');
            parent.find('.btn_lists').addClass('active');
            parent.find('.btn_track').removeClass('active');
            parent.find('.btn_notes').removeClass('active');
            parent.find('.btn_reviews').removeClass('active');
        }
    }

    onClickAddItem(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let productId = $(clickedElement).data("id");
        let listId = $(clickedElement).data("value");

        $('#save_list_distributor').removeAttr('data-favourite');

        $.ajax({
            async: "true",
            url: "/clinics/inventory/get-list-modal",
            type: 'POST',
            cache: false,
            timeout: 600000,
            dataType: 'json',
            data: {
                'product-id': productId,
                'list-id': listId,
            },
            success: function (response)
            {
                $('#modal_list_distributors').remove();
                $('#inventory_container').append(response);
                $('#modal_list_distributors').modal('toggle');
                $('body').css('overflow', '');
            }
        });
    }

    onClickSelectDistributor(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let uri = window.location.pathname;
        let listId = $(clickedElement).data("value");
        let productId = $(clickedElement).data("id");
        let distributorId = $('#list_distributor_id').val();
        let unitPrice = $('#unit_price').val() ? $('#unit_price').val() : '0.00';
        let isValid = true;
        let isManageList = uri.match('/clinics/inventory/manage/list/[0-9]+');
        let favourite = (clickedElement).hasAttribute('data-favourite');
        let retail = (clickedElement).hasAttribute('data-retail');

        if(
            listId == '' || listId == 'undefined' || productId == '' || productId == 'undefined' ||
            distributorId == '' || distributorId == 'undefined')
        {
            isValid = false;
        }

        if(isValid){

            $.ajax({
                async: "true",
                url: "/clinics/inventory/manage-list",
                type: 'POST',
                cache: false,
                timeout: 600000,
                dataType: 'json',
                data: {
                    'product-id': productId,
                    'list-id': listId,
                    'distributor-id': distributorId,
                    'unit-price': unitPrice,
                    'favourite': favourite,
                    'retail': retail,
                    'permissions': $.session.get('permissions'),
                    'return': '',
                },
                success: function (response)
                {
                    if(response.is_favourite != undefined)
                    {
                        $('#favourite_'+ productId).removeClass('icon-unchecked').addClass('text-danger')
                            .attr('data-favourite', true).attr('data-distributor-id', distributorId);
                    } else if(response.isRetail != undefined)
                    {
                        $('#retail_'+ productId).removeClass('icon-unchecked').addClass('text-danger')
                            .attr('data-retail', true).attr('data-distributor-id', distributorId);
                    }
                    else
                    {
                        if (isManageList != null)
                        {
                            self.getSingleList(listId);
                        }
                        else if($(this).data('favourite') != undefined)
                        {
                            if (response == true)
                            {
                                $('#favourite_' + productId).removeClass('icon-unchecked').addClass('text-danger');
                            }
                            else
                            {
                                $('#favourite_' + productId).removeClass('text-secondary').addClass('icon-unchecked');
                            }

                        }
                        else
                        {
                            $('#lists_' + productId).empty().append(response);
                        }
                    }

                    $('#modal_list_distributors').modal('toggle');
                }
            });
        }
    }

    onClickRemoveItem(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let listId = $(clickedElement).attr("data-value");
        let productId = $(clickedElement).attr("data-id");
        let isValid = true;

        if(listId == '' || listId == 'undefined' || productId == '' || productId == 'undefined'){

            isValid = false;
        }

        if(isValid){

            $.ajax({
                async: "true",
                url: "/clinics/inventory/delete-list-item",
                type: 'POST',
                cache: false,
                timeout: 600000,
                dataType: 'json',
                data: {
                    'product-id': productId,
                    'list-id': listId,
                },
                success: function (respnse) {
                    $(clickedElement).closest('.row').empty().append(respnse);

                }
            });
        }
    }

    onSubmitNewList(e)
    {
        e.preventDefault();

        let listName = $('#list_name').val();
        let listNameError = $('#error_list_name');
        let data = new FormData($(this.element).find('#form_list')[0]);
        let isValid = true;
        let productId = data.get('product-id');

        listNameError.hide()

        if(listName == '' || listName == 'undefined'){

            listNameError.show();
            isValid = false;
        }

        if(isValid) {

            $.ajax({
                async: "true",
                url: "/clinics/inventory/manage-list",
                type: 'POST',
                contentType: false,
                processData: false,
                cache: false,
                timeout: 600000,
                dataType: 'json',
                data: data,
                success: function (response) {
                    $('#lists_'+ productId).empty().append(response);
                }
            });
        }
    }

    onClickViewManageLists(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let keyword = '';

        if($(clickedElement).attr('data-keyword-string').length > 0){

            keyword = $(clickedElement).attr('data-keyword-string');
        }

        this.getAllLists(keyword);
    }

    onClickDeleteIcon(e)
    {
        e.preventDefault();

        let listId = $(e.currentTarget).attr('data-list-id');
        $('#delete_list').attr('data-list-id', listId);
    }

    onClickConfirmDelete(e)
    {
        e.preventDefault();

        let self = this;
        let listId = $(e.currentTarget).attr('data-list-id');

        $.ajax({
            async: "true",
            url: "/clinics/manage-lists",
            type: 'POST',
            cache: false,
            timeout: 600000,
            dataType: 'json',
            data: {
                'list-id': listId,
            },
            success: function (response) {

                $('#modal_user_delete').modal('toggle');
                $('#modal_user_delete').modal('hide');
                $('.modal-backdrop').removeClass('modal-backdrop');
                $('#modal_user_delete').addClass('fade');
                self.getFlash(response.flash);
                $('#inventory').hide();
                $('#inventory_container').hide();
                $('#basket_container').empty().addClass('col-container').append(response.response).show();
            }
        });
    }

    onClickEditList(e)
    {
        e.preventDefault();

        let listId = $(e.currentTarget).attr('data-list-id');

        this.getSingleList(listId);
    }

    onChangeQty(e)
    {
        let clickedElement = e.currentTarget;
        let listItemId = $(clickedElement).attr('data-list-item-id');
        let qty = $(clickedElement).val();
        let isValid = true;
        let self = this;

        $('#error_qty_'+ $(clickedElement).attr('data-list-item-id')).hide();

        if(qty == 0 || qty == '' || qty == 'undefined'){

            isValid = false;
            $('#error_qty_'+ $(clickedElement).attr('data-list-item-id')).empty().append('Please select a valid quantity.').show();

        }

        if(isValid)
        {
            $.ajax({
                async: "true",
                url: "/clinics/inventory/list/update-qty",
                type: 'POST',
                dataType: 'json',
                data: {
                    'list-item-id': listItemId,
                    qty: qty
                },
                beforeSend: function (){
                    self.isLoading(true);
                },
                success: function (response) {

                    // if(response.listId > 0){
                    //
                    //     self.getSingleList(response.listId);
                    // }

                    $(clickedElement).closest('.row').find('.col-5').empty().append(response.price.unitTotal);
                    $('#sub_total').empty().append(response.price.total);

                    self.getFlash(response.flash);
                },
                complete: function(e, xhr, settings){
                    if(e.status === 500)
                    {
                        //window.location.href = '/clinics/error';
                    }

                    self.isLoading(false);
                },
            });
        }
    }

    onClickManageListRemoveItem(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let itemId = $(clickedElement).data('item-id');
        let self = this;

        if(itemId > 0){

            $.ajax({
                async: "true",
                url: "/clinics/inventory/list/remove-item",
                type: 'POST',
                dataType: 'json',
                data: {
                    'list_item_id': itemId
                },
                beforeSend: function ()
                {
                    self.isLoading(true);
                },
                success: function (response)
                {
                    $('#inventory').hide();
                    $('#inventory_container').hide();
                    $(clickedElement).closest('.item-row').remove();
                    $('#sub_total').empty().append(response);
                    self.getFlash('<b><i class="fas fa-check-circle"></i> Item successfully removed.<div class="flash-close"><i class="fa-solid fa-xmark"></i></div>');
                    self.popOver();

                    let maxWidth = Math.max.apply( null, $( '.stock-status' ).map( function ()
                    {
                        return $(this).outerWidth( true );
                    }).get() );

                    $('.stock-status').css({'width':maxWidth+'px'});

                    if(!response.hasItems){

                        window.history.pushState(null, "Fluid", '/clinics/inventory/lists');
                    }
                },
                complete: function(e, xhr, settings)
                {
                    if(e.status === 500)
                    {
                        //window.location.href = 'clinics/error';
                    }

                    self.isLoading(false);
                },
            });
        }
    }

    onKeyUpInventorySearch(e)
    {
        let clickedElement = e.currentTarget;

        $.ajax({
            type: "POST",
            async: "true",
            url: "/clinics/list/inventory-search",
            data: {
                'keyword': $(clickedElement).val(),
                'list-id': $(clickedElement).data('list-id'),
            },
            success: function(data)
            {
                $("#suggestion_field").show();
                $("#suggestion_field").html(data);
            }
        });
    }

    onClickSearchListItem(e)
    {
        let clickedElement = e.currentTarget;
        let productId = $(clickedElement).attr('data-product-id');
        let listId = $(clickedElement).attr('data-list-id');

        this.getProductDistributors(productId, listId);
    }

    onClickAddToBasket(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let listId = $(clickedElement).data('list-id');
        let clinicId = $(clickedElement).data('clinic-id');
        let clearBasket = $(clickedElement).data('basket-clear');
        let isValid = true;
        let self = this;

        if(
            listId == '' || listId == 'undefined' || clinicId == '' || clinicId == 'undefined' ||
            clearBasket === '' || clearBasket === 'undefined'
        ){

            isValid = false;
        }

        if(isValid){

            $.ajax({
                async: "true",
                url: "/clinics/inventory/list/basket/add",
                type: 'POST',
                dataType: 'json',
                data: {
                    'list-id': listId,
                    'clinic-id': clinicId,
                    'clear-basket': clearBasket,
                },
                beforeSend: function ()
                {
                    self.isLoading(true);
                },
                success: function (response)
                {
                    $('#modal_list_add_to_basket').modal('toggle');
                    $(".modal-backdrop").remove();
                    self.getBasket(response,true,'');

                },
                complete: function(e, xhr, settings)
                {
                    if(e.status === 500)
                    {
                        //window.location.href = '/clinics/error';
                    }

                    self.isLoading(false);
                },
            });
        }
    }

    getAllLists(keyword)
    {
        let self = this;

        $.ajax({
            async: "true",
            url: "/clinics/manage-lists",
            type: 'POST',
            cache: false,
            timeout: 600000,
            dataType: 'json',
            data: {
                list_id: 0,
                keyword: keyword,
                permissions: $.session.get('permissions'),
            },
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            success: function (response)
            {
                $('#inventory').hide();
                $('#inventory_container').hide();
                $('#basket_container').empty().addClass('col-container').removeClass('border-xy').append(response.response).show();
                window.scrollTo(0,0);
                window.history.pushState(null, "Fluid", '/clinics/inventory/lists');
            },
            complete: function(e, xhr, settings)
            {
                if(e.status === 500)
                {
                    //window.location.href = '/clinics/error';
                }

                self.isLoading(false);
            }
        });
    }

    getSingleList(listId)
    {
        let self = this;

        $.ajax({
            async: "true",
            url: "/clinics/inventory/edit/list",
            type: 'POST',
            cache: false,
            timeout: 600000,
            dataType: 'json',
            data: {
                'list-id': listId,
                permissions: $.session.get('permissions'),
            },
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            success: function (response)
            {
                $('#inventory').hide();
                $('#inventory_container').hide();
                $('#basket_container').empty().append(response.html).show();
                self.isLoading(false);

                self.popOver();

                let maxWidth = Math.max.apply( null, $( '.stock-status' ).map( function ()
                {
                    return $( this ).outerWidth( true );
                }).get());

                $('.stock-status').css({'width':maxWidth+'px'});

                window.history.pushState(null, "Fluid", '/clinics/inventory/manage/list/'+ listId);
            },
            complete: function(e, xhr, settings){
                if(e.status === 500){
                    //window.location.href = '/clinics/error';
                }
            },
        });
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
                $('#back_btn').hide();
                $('#inventory_container').hide();
                $('#basket_container').empty().append(response).fadeIn(500);
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

                popOver();
            }
        });
    }

    getProductDistributors(productId, listId)
    {
        if (productId > 0)
        {
            $.ajax({
                async: "true",
                url: "/clinics/inventory/get-list-modal",
                type: 'POST',
                cache: false,
                timeout: 600000,
                dataType: 'json',
                data: {
                    'product-id': productId,
                    'list-id': listId,
                },
                success: function (response)
                {
                    $('#modal_list_distributors').remove();
                    $('#basket_container').append(response);
                    $('#modal_list_distributors').modal('toggle');
                    $('body').css('overflow', '');
                }
            });

            $("#search_inventory_field").val(name);
            $("#suggestion_field").hide();
        }
    }

    hidePaginator()
    {
        $('#paginator').empty().hide();
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

    popOver()
    {
        let popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
        let popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl)
        })
    }
}