import { Controller } from '@hotwired/stimulus';

export default class extends Controller
{
    messages;

    connect()
    {
        let uri = window.location.pathname;
        let isOrderDetail = uri.match('/clinics/order/[0-9]+');
        let isOrderList = uri.match('/clinics/orders/[0-9]+');

        if(isOrderList != null)
        {
            let clinicId = $.session.get('clinic-id') ? $.session.get('clinic-id') : 0;

            this.getOrdersList(clinicId, 1, '', '');
            window.location.href = '/clinics/orders/1';
        }

        if(isOrderDetail)
        {
            let pieces = uri.split('/');
            let orderId = pieces[3];
            let distributorId = pieces[4];
            let clinicId = $.session.get('clinic-id');

            this.getOrderDetails(orderId, distributorId, clinicId);
        }
    }

    // Order Lists
    onClickBtnProceed(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;

        $.ajax({
            async: "true",
            url: "/clinics/checkout/options",
            type: 'POST',
            dataType: 'json',
            data: {
                basket_id: $(clickedElement).data('basket-id'),
                permissions: $.session.get('permissions'),
            },
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            complete: function(e, xhr, settings)
            {
                if(e.status === 500)
                {
                    window.location.href = '/clinics/error';
                }
            },
            success: function (response)
            {

                $('#modal_address').remove();
                $('#basket_header, #basket_action_row_1, #basket_action_row_2, #basket_inner').empty();
                $('#saved_items, #modal_address').remove();
                $('#basket_inner').append(response.body);
                $('#basket_header').empty().append(response.header);
                $('#shipping_address_id').val(response.default_address_id);
                $('#billing_address_id').val(response.default_billing_address_id);
                $('#address_modal_label').empty().append('Select an Existing Address');
                $('.modal-header').empty()
                    .append('<h5 class="modal-title" id="address_modal_label">Use an Existing Address</h5>')
                    .append('<span class="badge bg-success ms-3 toggle_address" role="button" data-action="click->clinics--addresses#onClickToggle">Create A New Address</span>')
                    .append('<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>');
                $('.modal-body-address-new').hide();
                $('.modal-body-address-existing').append(response.existing_shipping_addresses).show();
                $('#modal_header_address').empty()
                    .append('<h5 class="modal-title" id="address_modal_label">Use an Existing Address</h5>')
                    .append('<span class="badge bg-success ms-3 toggle_address" role="button" data-action="click->clinics--addresses#onClickToggle">Create A New Address</span>')
                    .append('<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>');
                $('#btn_checkout').hide();
                self.isLoading(false);
            }
        });
    }

    onSubmitCheckoutOptions(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let confirmationEmail = $('#confirmation_email').val();
        let shippingAddress = $('#shipping_address_id').val();
        let billing_address = $('#billing_address_id').val();
        let errorConfirmationEmail = $('#error_confirmation_email');
        let errorShippingAddress = $('#error_shipping_address');
        let errorBillingAddress = $('#error_billing_address');
        let data = new FormData($(clickedElement)[0]);
        let isValid = true;

        errorConfirmationEmail.hide();
        errorShippingAddress.hide();
        errorBillingAddress.hide();

        if(confirmationEmail == '' || confirmationEmail == 'undefined')
        {
            errorConfirmationEmail.show();
            isValid = false;
        }

        if(shippingAddress == '' || shippingAddress == 'undefined')
        {
            errorShippingAddress.show();
            isValid = false;
        }

        if(billing_address == '' || billing_address == 'undefined')
        {
            errorBillingAddress.show();
            isValid = false;
        }

        if(isValid)
        {
            $.ajax({
                async: "true",
                url: "/clinics/checkout/save/options",
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
                success: function (response)
                {
                    $('#basket_inner').empty().append(response);
                    self.isLoading(false);
                }
            });
        }
    }

    onClickBtnPlaceOrder(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let orderId = $(clickedElement).data('order-id');

        $.ajax({
            async: "true",
            url: "/clinics/checkout/place/order",
            type: 'POST',
            dataType: 'json',
            data: {
                'order-id': orderId,
                'permissions': $.session.get('permissions'),
            },
            beforeSend: function ()
            {
                self.isLoading(true);
                window.scrollTo(0, 0);
                $('body').scrollTop($('body').prop("scrollHeight"));
            },
            complete: function(e, xhr, settings)
            {
                if(e.status === 500)
                {
                    //window.location.href = '/clinics/error';
                }
            },
            success: function (response)
            {
                self.isLoading(false);
                self.getFlash(response.flash);
                $('#inventory_container').hide();
                $('#clinic_container').empty().append(response.orders.html).show();
                $('#paginator').empty().append(response.orders.pagination).show();
                $('#btn_basket').attr('data-basket-id', response.basket_id);
                window.scrollTo(0, 0);
                $('body').scrollTop($('body').prop("scrollHeight"));
                window.history.pushState(null, "Fluid", '/clinics/orders/'+ response.clinic_id);
            }
        });
    }

    onClickOrdersLink(e)
    {
        let self = this;
        let clickedElement = e.currentTarget;
        let clinic_id = $(clickedElement).data('clinic-id');


        e.preventDefault();
        clearInterval(this.messages);
        self.getOrdersList(clinic_id, 1,'','','');
        $('.col-container').removeClass('col-container');
    }

    onClickPagination(e)
    {
        let clickedElement = e.currentTarget;
        let clinicId = $(clickedElement).data('clinic-id');

        e.preventDefault();
        clearInterval(this.messages);
        this.getOrdersList(clinicId, $(clickedElement).data('page-id'),'','','');
        $('.col-container').removeClass('col-container');
    }

    onChangeDistributorSelect(e)
    {
        let clickedElement = e.currentTarget;

        $('.distributor_search').attr('data-distributor-id', $(clickedElement).val());
    }

    onChangeStatusSelect(e)
    {
        let clickedElement = e.currentTarget;

        $('.distributor_search').attr('data-status-id', $(clickedElement).val());
    }

    onClickToggleMobileFilter(e)
    {
        $('#filter_row').toggle(700, 'linear');
    }

    onClickFilterReset(e)
    {
        let clickedElement = e.currentTarget;

        $('.datepicker').val('');
        $('.distributor_select').val('');
        $('.status_select').val('');

        let clinicId = $(clickedElement).data('clinic-id');

        this.getOrdersList(clinicId, 1, '','','');
    }

    onClickSearchList(e)
    {
        let clickedElement = e.currentTarget;
        let distributorId = $(clickedElement).attr('data-distributor-id');
        let date = $(clickedElement).attr('data-date');
        let clinicId = $(clickedElement).data('clinic-id');
        let status = $(clickedElement).attr('data-status-id');

        this.getOrdersList(clinicId, 1, distributorId, date, status);
    }

    getOrdersList(clinicId, pageId, distributorId,date,status)
    {
        let self = this;

        $.ajax({
            async: "true",
            url: "/clinics/orders",
            type: 'POST',
            dataType: 'json',
            data: {
                'page-id': pageId,
                'clinic-id': clinicId,
                'distributor-id': distributorId,
                'date': date,
                'status': status
            },
            beforeSend: function ()
            {
                self.isLoading(true)
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
                $('#clinic_container').empty().append(response.html).show();
                $('#clinic_container').append(response.pagination);
                window.scrollTo(0,0);
                self.isLoading(false);
                window.history.pushState(null, "Fluid", '/clinics/orders/'+ clinicId);

                let selector = '#datepicker';

                if ($(window).width() < 769)
                {
                    selector = '#datepicker_mobile';
                    $('.distributor_select').removeClass('me-2');
                    $('.status_select').removeClass('me-2 ms-3');
                }
            }
        });
    }

    // Order Details
    onClickOrderDetail(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let orderId = $(clickedElement).data('order-id');
        let distributorId = $(clickedElement).data('distributor-id');
        let clinicId = $(clickedElement).data('clinic-id');

        window.history.pushState(null, "Fluid", '/clinics/order/'+ orderId +'/'+ distributorId);
        this.getOrderDetails(orderId, distributorId, clinicId);
    }

    // Accept before delivery
    onClickAcceptOrderItem(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let orderId = $(clickedElement).data('order-id');
        let itemId = $(clickedElement).data('item-id');

        $.ajax({
            async: "true",
            url: "/clinics/update-order-item-status",
            type: 'POST',
            dataType: 'json',
            data: {
                'order-id': orderId,
                'item-id': itemId,
                'link': 'accept'
            },
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            success: function (response) {
                $('#order_item_accept_'+ itemId).removeClass('badge-success-outline-only badge-success-sm').addClass(response.class);
                $('#order_item_renegotiate_'+ itemId).removeClass('bg-warning badge-warning-filled-sm').addClass('badge-warning-outline-only badge-warning-sm');
                $('#order_item_cancel_'+ itemId).removeClass('bg-danger badge-danger-filled-sm').addClass('badge-danger-outline-only badge-danger-sm');
                self.isLoading(false);
                $('#btn_confirm_order').remove();
                $('#btn_cancel_order').remove();
                $('#order_action_row').append(response.btn);
            }
        });
    }

    onClickConfirmOrder(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let orderId = $(clickedElement).attr('data-order-id');
        let distributorId = $(clickedElement).attr('data-distributor-id');
        let clinicId = $(clickedElement).attr('data-clinic-id');

        $.ajax({
            async: "true",
            url: "/clinics/confirm_order",
            type: 'POST',
            dataType: 'json',
            data: {
                'order-id': orderId,
                'distributor-id': distributorId,
                'clinic-id': clinicId
            },
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            success: function (response)
            {
                self.getFlash(response.flash);
                $('#clinic_container').empty().removeClass('col-container').append(response.orders.html).show();
                clearInterval(self.messages);
                self.isLoading(false);
                window.history.pushState(null, "Fluid", '/clinics/orders/'+ response.clinicId);
            }
        });
    }

    // Received Orders
    onChangeStatus(e)
    {
        let self = this;
        let clickedElement = e.currentTarget;
        let orderStatus = $('#order_status').val();
        let orderId = $(clickedElement).data('order-id');
        let distributorId = $(clickedElement).data('distributor-id');

        $.ajax({
            async: "true",
            url: "/clinics/update-order-status",
            type: 'POST',
            dataType: 'json',
            data: {
                'order-status': orderStatus,
                'distributor-id': distributorId,
                'order-id': orderId,
                'permissions': $.session.get('permissions'),
            },
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            success: function (response)
            {
                $('#clinic_container').empty().append(response);
                self.isLoading(false);
            },
            complete: function(e, xhr, settings)
            {
                if(e.status === 500)
                {
                    window.location.href = '/clinics/error';
                }
            },
        });
    }

    onClickAcceptDeliveredItem(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let itemId = $(clickedElement).data('item-id');
        let uri = window.location.pathname.split('/');
        let orderId = uri[3];
        let distributorId = uri[4];

        $.ajax({
            async: "true",
            url: "/clinics/is-delivered-accept",
            type: 'POST',
            dataType: 'json',
            data: {
                'item-id': itemId,
                'order-id': orderId,
                'distributor-id': distributorId,
                'permissions': $.session.get('permissions'),
            },
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            success: function (response)
            {
                self.getFlash(response.flash);
                $('#clinic_container').empty().append(response.orders);
                self.popOver();
                self.isLoading(false);
            },
            complete: function(e)
            {
                if(e.status === 500)
                {
                    //window.location.href = '/clinics/error';
                }
            },
        });
    }

    onClickAdjustQtyDeliveredItem(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let itemId = $(clickedElement).data('item-id');
        let uri = window.location.pathname.split('/');
        let orderId = uri[3];
        let distributorId = uri[4];

        $.ajax({
            async: "true",
            url: "/clinics/is-delivered-qty",
            type: 'POST',
            dataType: 'json',
            data:
            {
                'item-id': itemId,
                'order-id': orderId,
                'distributor-id': distributorId,
                'permissions': $.session.get('permissions'),
            },
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            success: function (response)
            {
                self.getFlash(response.flash);
                $('#clinic_container').empty().append(response.orders);
                self.popOver();
                self.isLoading(false);
            },
            complete: function(e)
            {
                if(e.status === 500)
                {
                    window.location.href = '/clinics/error';
                }
            },
        });
    }

    onChangeQty(e)
    {
        let uri = window.location.pathname;
        let pieces = uri.split("/");

        let self = this;
        let clickedElement = e.currentTarget;
        let itemId = $(clickedElement).data('qty-delivered-id');
        let orderId = pieces[3]
        let distributorId = pieces[4]
        let qty = $(clickedElement).val();

        if(qty == '' || qty == 'undefined')
        {
            qty = 0;
        }

        $.ajax({
            async: "true",
            url: "/clinics/update-qty-delivered",
            type: 'POST',
            dataType: 'json',
            data: {
                'item-id': itemId,
                'qty': qty,
                'distributor-id': distributorId,
                'order-id': orderId
            },
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            success: function (response)
            {
                self.getFlash(response.flash);
                $('#clinic_container').empty().append(response.orders);
                self.isLoading(false);
            }
        });
    }

    onClickRenegotiateOrderItem(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let orderId = $(clickedElement).data('order-id');
        let itemId = $(clickedElement).data('item-id');

        $.ajax({
            async: "true",
            url: "/clinics/update-order-item-status",
            type: 'POST',
            dataType: 'json',
            data: {
                'order-id': orderId,
                'item-id': itemId,
                'link': 'renegotiate'
            },
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            success: function (response)
            {
                $('#order_item_accept_'+ itemId).removeClass('bg-success badge-success-filled-sm').addClass('badge-success-outline-only badge-success-sm');
                $('#order_item_renegotiate_'+ itemId).removeClass('badge-warning-outline-only badge-warning-sm').addClass(response.class);
                $('#order_item_cancel_'+ itemId).removeClass('bg-danger badge-danger-filled-sm').addClass('badge-danger-outline-only badge-danger-sm');
                $('#btn_confirm_order').remove();
                $('#btn_cancel_order').remove();
                self.isLoading(false);
                $('#order_action_row').append(response.btn);
            },
            complete: function(e)
            {
                if(e.status === 500)
                {
                    window.location.href = '/clinics/error';
                }
            },
        });
    }

    onClickRejectDeliveredItem(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let itemId = $(clickedElement).data('item-id');
        let rejectReasonError = $('#error_reject_reason');

        $('#reject_item_id').val(itemId);
        rejectReasonError.hide();

        $.ajax({
            async: "true",
            url: "/clinics/get-reject-reason",
            type: 'POST',
            dataType: 'json',
            data: {
                'item-id': itemId
            },
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            success: function (response)
            {
                $('#reject_reason').val(response);
                self.isLoading(false);
            },
            complete: function(e)
            {
                if(e.status === 500)
                {
                    window.location.href = '/clinics/error';
                }
            },
        });
    }

    onSubmitRejectDeliveredForm(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let rejectReason = $('#reject_reason').val();
        let rejectReasonError = $('#error_reject_reason');
        let isValid = true;

        rejectReasonError.hide();

        if(rejectReason == '' || rejectReason == 'undefined')
        {
            rejectReasonError.show();
            isValid = false;
        }

        if(isValid)
        {
            let data = new FormData($(clickedElement)[0]);
            let permissions = $.session.get('permissions');

            for(let i = 0; i < permissions.length; i++)
            {
                data.append('permissions[]', permissions[i]);
            }

            $.ajax({
                async: "true",
                url: "/clinics/reject-item",
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
                success: function (response)
                {
                    self.getFlash(response.flash);
                    $('#clinic_container').empty().append(response.orders);
                    $('#form_reject_item').modal('toggle').modal('hide');
                    $('.modal-backdrop').removeClass('modal-backdrop');
                    $('.fade').removeClass('fade');
                    self.isLoading(false);
                    self.popOver();
                },
                complete: function(e, xhr, settings){
                    if(e.status === 500)
                    {
                        //window.location.href = '/clinics/error';
                    }
                }
            });
        }
    }

    onClickCancelOrderItem(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let orderId = $(clickedElement).data('order-id');
        let itemId = $(clickedElement).data('item-id');

        $.ajax({
            async: "true",
            url: "/clinics/update-order-item-status",
            type: 'POST',
            dataType: 'json',
            data: {
                'order-id': orderId,
                'item-id': itemId,
                'link': 'cancelled'
            },
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            success: function (response)
            {
                $('#order_item_accept_'+ itemId).removeClass('bg-success badge-success-filled-sm').addClass('badge-success-outline-only badge-success-sm');
                $('#order_item_renegotiate_'+ itemId).removeClass('bg-warning badge-warning-filled-sm').addClass('badge-warning-outline-only badge-warning-sm');
                $('#order_item_cancel_'+ itemId).removeClass('badge-danger-outline-only badge-danger-sm').addClass(response.class);
                self.isLoading(false);
                $('#btn_confirm_order').remove();
                $('#btn_cancel_order').remove();
                $('#order_action_row').append(response.btn);
            }
        });
    }

    onClickCloseOrder(e)
    {
        let clickedElement = e.currentTarget;
        let order_id = $(clickedElement).data('order-id');
        let distributor_id = $(clickedElement).data('distributor-id');

        let modal = '<div class="modal fade" id="modal_close_order" tabindex="-1" aria-labelledby="user_delete_label" aria-hidden="true">';
        modal += '<div class="modal-dialog modal-dialog-centered">';
        modal += '<div class="modal-content">';
        modal += '<input type="hidden" value="" name="addresses_form[address_id]" id="address_id">';
        modal += '<div class="modal-body">';
        modal += '<div class="row">';
        modal += '<div class="col-12 mb-0">';
        modal += 'Are you sure you would like to close this order? This action cannot be undone.';
        modal += '</div>';
        modal += '</div>';
        modal += '</div>';
        modal += '<div class="modal-footer">';
        modal += '<button type="button" class="btn btn-primary btn-sm" data-bs-dismiss="modal">CANCEL</button>';
        modal += '<button type="submit" data-order-id="'+ order_id +'" data-distributor-id="'+ distributor_id +'" class="btn btn-danger btn-sm" id="btn_close_order">CLOSE ORDER</button>';
        modal += '</div> </div> </div> </div>';

        $('#clinic_container').append(modal);
        $('#modal_close_order').modal('toggle').addClass('show');
    }

    onClickChatField(e)
    {
        let clickedElement = e.currentTarget;
        let orderId = $(clickedElement).data('order-id');
        let distributorId = $(clickedElement).data('distributor-id');

        $.ajax({
            async: "true",
            url: "/message/is_typing",
            type: 'POST',
            dataType: 'json',
            data: {
                'order-id': orderId,
                'distributor-id': distributorId,
                'is-clinic': 1,
                'is-distributor': 0,
                'is-typing': 1,
            },
            success: function (response)
            {
                if(response.distributor_is_typing > 0)
                {
                    $('#chat_pulse').show();
                }
                else
                {
                    $('#chat_pulse').hide();
                }
            }
        });
    }

    onBlurChatField(e)
    {
        let clickedElement = e.currentTarget;
        let orderId = $(clickedElement).data('order-id');
        let distributorId = $(clickedElement).data('distributor-id');

        $.ajax({
            async: "true",
            url: "/message/is_typing",
            type: 'POST',
            dataType: 'json',
            data: {
                'order-id': orderId,
                'distributor-id': distributorId,
                'is-typing': 0,
                'is-clinic': 1,
                'is-distributor': 0,
            }
        });
    }

    onClickChatSend(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let message = $('#chat_field').val();
        let distributorId = $(clickedElement).data('distributor-id');
        let orderId = $(clickedElement).data('order-id');

        this.sendMessage(message, distributorId, orderId);
    }

    onClickNotification(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let orderId = $(clickedElement).data('order-id');
        let distributorId = $(clickedElement).data('distributor-id');
        let clinicId = $(clickedElement).data('clinic-id');
        let notificationId = $(clickedElement).data('notification-id');

        this.getOrderDetails(orderId, distributorId, clinicId);

        $.ajax({
            async: "true",
            url: "/clinics/delete-notification",
            type: 'POST',
            dataType: 'json',
            data: {
                'notification-id': notificationId,
                'type': 'clinic',
            }
        });

        window.history.pushState(null, "Fluid", '/clinics/order/'+ orderId +'/'+ distributorId);
    }

    getOrderDetails(orderId, distributorId, clinicId)
    {
        let self = this;

        $.ajax({
            async: "true",
            url: "/clinics/order",
            type: 'POST',
            data: {
                'order-id': orderId,
                'distributor-id': distributorId,
                'permissions': $.session.get('permissions'),
            },
            dataType: 'json',
            complete: function(e)
            {
                if (e.status === 500)
                {
                    window.location.href = '/clinics/error';
                }
            },
            success: function (response)
            {
                $('#clinic_container').empty().append(response);
                $('#distributor_chat_inner').scrollTop($('#distributor_chat_inner').prop("scrollHeight"));
                self.getChat(orderId, distributorId, clinicId);
                $('#chat_pulse').hide();
                self.popOver();
                $('#paginator').hide();
            }
        });
    }

    sendMessage(message, distributorId, orderId)
    {
        if(message.length > 0){

            $.ajax({
                url:"/distributors/send-message",
                type: 'POST',
                dataType: 'json',
                data: {
                    'distributor': 0,
                    'clinic': 1,
                    'distributor-id': distributorId,
                    'message': message,
                    'order-id': orderId,
                },
                success: function(response)
                {
                    $('#distributor_chat_container').empty().append(response);
                    $('#distributor_chat_inner').scrollTop($('#distributor_chat_inner').prop("scrollHeight"));
                    $('#chat_field').val('');

                    // Email Notification
                    $.ajax({
                        url:"/instant-message/notification",
                        type: 'POST',
                        dataType: 'json',
                        data: {
                            'distributor': 0,
                            'clinic': 1,
                            'distributor-id': distributorId,
                            'message': message,
                            'order-id': orderId,
                        },
                        success: function(response)
                        {
                            console.log('Email Sent...')
                        }
                    });
                }
            });
        }
    }

    getChat(orderId, distributorId, clinicId)
    {
        let self = this;

        function getMessages(orderId, distributorId, clinicId)
        {
            let uri = window.location.pathname;
            let isOrderDetail = uri.match('/[a-zA-Z]+/[a-zA-Z]+/[0-9]+/[0-9]+');
            if(isOrderDetail != null)
            {
                let messagesSent = $('.speech-bubble-right').length;
                let messagesReceived = $('.speech-bubble-left').length;
                let totalMessages = messagesSent + messagesReceived;

                $.ajax({
                    async: "true",
                    url: "/distributors/order/get-messages",
                    type: 'GET',
                    cache: false,
                    timeout: 10000,
                    data: {
                        'distributor': 0,
                        'clinic': 1,
                        'order-id': orderId,
                        'distributor-id':distributorId,
                        'clinic-id': clinicId,
                        'total-messages':totalMessages
                    },
                    success: function (response)
                    {
                        if(response.messages.length > 0)
                        {
                            $('#distributor_chat_container').empty().append(response.messages);
                            $('#distributor_chat_inner').scrollTop($('#distributor_chat_inner').prop("scrollHeight"));
                        }

                        if(response.is_typing == 1)
                        {
                            $('#chat_pulse').show();

                        }
                        else
                        {
                            $('#chat_pulse').hide();
                        }
                    }
                });
            }
        };

        this.messages = setInterval(function()
        {
            getMessages(orderId, distributorId, clinicId);
        }, 1000);
    }

    popOver()
    {
        var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
        var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl)
        })
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
}