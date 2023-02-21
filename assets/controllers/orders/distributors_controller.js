import { Controller } from '@hotwired/stimulus';
import {preventOverflow} from "@popperjs/core";

export default class extends Controller {
    messages;
    errorPage = '/distributors/error';
    orderId;
    distributorId;
    dateTime;

    connect()
    {
        let uri = window.location.pathname;
        let isOrderList = uri.match('/distributors/orders/[0-9]+');
        let isOrderDetail = uri.match('/distributors/order/[0-9]+');
        let distributorId = $.session.get('distributor-id');

        if(isOrderList != null && distributorId > 0)
        {
            this.getOrdersList(distributorId, 1);
        }

        if(isOrderDetail != null)
        {
            let pieces = uri.split('/');
            let orderId = pieces[3];
            if(orderId > 0)
            {
                this.getOrderDetails(orderId);
            }
        }
    }

    onClickOrdersLink(e)
    {
        e.preventDefault();
        this.getOrdersList($(e.currentTarget).data('distributor-id'), 1);
    }

    getOrdersList(distributorId, pageId, clinicId = '', statusId = '', date = '')
    {
        let self = this;

        $.ajax({
            url: "/distributors/orders",
            type: 'POST',
            dataType: 'json',
            data: {
                'page-id': pageId,
                'distributor-id': distributorId,
                'clinic-id': clinicId,
                'status-id': statusId,
                'date': date,
            },
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            complete: function(e)
            {
                if(e.status === 500)
                {
                    window.location.href = self.errorPage;
                }
            },
            success: function (response)
            {
                $('#distributor_container').empty().append(response.html).append(response.pagination);
                $('#filter_row_toggle').removeClass('border-bottom');
                self.isLoading(false);

                window.history.pushState(null, "Fluid", '/distributors/orders/'+ distributorId);

                let selector = '#datepicker';

                if ($(window).width() < 769)
                {
                    selector = '#datepicker_mobile';
                    $('.clinic_select').removeClass('me-2');
                    $('.status_select').removeClass('me-2 ms-3');
                }

                if($('#filter_row').is( ":visible" ))
                {
                    $('#filter_row_toggle').removeClass('border-bottom');
                    $('#filter_row_toggle').addClass('border-bottom');
                }

                // const picker = new easepick.create({
                //     element: selector,
                //     css: [
                //         'https://cdn.jsdelivr.net/npm/@easepick/bundle@1.2.0/dist/index.css',
                //         '/css/date_picker.min.css',
                //     ],
                //     zIndex: 11,
                //     readonly: false,
                //     plugins: [
                //         "AmpPlugin",
                //         "RangePlugin",
                //     ]
                // })
            }
        });
    }

    onClickPagination(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let distributorId = window.location.pathname.split('/')[3];

        e.preventDefault();
        //clearInterval(get_messages);
        this.getOrdersList(distributorId, $(clickedElement).attr('data-page-id'));
    }

    onChangeFilterClinic(e)
    {
        let clickedElement = e.currentTarget;

        $('.clinic_search').attr('data-clinic-id', $(clickedElement).val());
    }

    onChangeFilterStatus(e)
    {
        let clickedElement = e.currentTarget;
        $('.clinic_search').attr('data-status-id', $(clickedElement).val());
    }

    onClickFilterReset(e)
    {
        $('.datepicker').val('');
        $('.clinic_select').val('');
        $('.status_select').val('');

        let clickedElement = e.currentTarget;
        let distributorId = $(clickedElement).data('distributor-id');

        this.getOrdersList(distributorId, 1);
    }

    onClickFilter(e)
    {
        let clickedElement = e.currentTarget;
        let distributorId = $(clickedElement).data('distributor-id');
        let date = $(clickedElement).data('date');
        let clinicId = $(clickedElement).data('clinic-id');
        let status = $(clickedElement).data('status-id');

        this.getOrdersList(distributorId, 1, clinicId, status, date);
    }

    onClickMobileToggleFilter()
    {
        $('#filter_row').toggle(700, 'linear');

        setInterval(function(){

            if($('#filter_row').is( ":visible" )){

                $('#filter_row_toggle').addClass('border-bottom');

            } else {

                $('#filter_row_toggle').removeClass('border-bottom');
            }
        } , 1000);
    }

    onClickOpenOrder(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let orderId = $(clickedElement).attr('data-order-id');

        this.getOrderDetails(orderId);

        sessionStorage.setItem('order_id', orderId);
        window.history.pushState(null, "Fluid", '/distributors/order/'+ orderId);
    }

    onClickChatField(e)
    {
        let self = this;
        let clickedElement = e.currentTarget;
        self.orderId = $(clickedElement).attr('data-order-id');
        self.distributorId = $(clickedElement).attr('data-distributor-id');

        $.ajax({
            url: "/message/is_typing",
            type: 'POST',
            dataType: 'json',
            data: {
                'order-id': self.orderId,
                'distributor-id': self.distributorId,
                'is-clinic': 0,
                'is-distributor': 1,
                'is-typing': 1,
            },
            success: function (response)
            {
                if(response.clinic_is_typing > 0)
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
        let self = this;

        $.ajax({
            url: "/message/is_typing",
            type: 'POST',
            dataType: 'json',
            data: {
                'order-id': self.orderId,
                'distributor-id': self.distributorId,
                'is-clinic': 0,
                'is-distributor': 1,
                'is-typing': 0,
            },
            success: function (response)
            {
                $('#chat_pulse').hide();
            }
        });
    }
    
    onClickSendChat(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let message = $('#chat_field').val();

        if(message.length > 0)
        {
            $.ajax({
                url:"/distributors/send-message",
                type: 'POST',
                dataType: 'json',
                data:
                {
                    'distributor': 1,
                    'clinic': 0,
                    'distributor-id': $(clickedElement).data('distributor-id'),
                    'message': message,
                    'order-id': $(clickedElement).data('order-id')
                },
                success: function(response)
                {
                    $('#distributor_chat_container').empty().append(response);
                    $('#distributor_chat_inner').scrollTop($('#distributor_chat_inner').prop("scrollHeight"));
                    $('#chat_field').val('');
                    $('#chat_pulse').hide();
                }
            });
        }
    }

    getOrderDetails(orderId)
    {
        let self = this;

        $.ajax({
            url: "/distributors/get-order",
            type: 'POST',
            data: {
                'order-id': orderId,
                'permissions': JSON.parse($.session.get('permissions')),
            },
            dataType: 'json',
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            complete: function (e)
            {
                if (e.status === 500)
                {
                    //window.location.href = self.errorPage;
                }
            },
            success: function (response)
            {
                // Reset page load time for refresh button alert
                let date = new Date();
                self.dateTime = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0") + ':' + String(date.getSeconds()).padStart(2, '0');
                sessionStorage.setItem('date_time', self.dateTime);

                $('#distributor_container').empty().append(response.html);
                $('#distributor_chat_inner').scrollTop($('#distributor_chat_inner').prop("scrollHeight"));
                self.popOver();
                self.getChat(orderId, response.distributorId, response.clinicId)
                $('#chat_pulse').hide();

                var maxWidth = Math.max.apply(null, $('.badge').map(function () {
                    return $(this).outerWidth(true);
                }).get());

                $('.badge').css({'width': maxWidth + 'px'});

                self.isLoading(false);
            }
        });
    }

    getMessages(clinicId, distributorId)
    {
        let uri = window.location.pathname;
        let isOrderDetail = uri.match('/[a-zA-Z]+/[a-zA-Z]+/[0-9]+');
        let orderId = sessionStorage.getItem('order_id');

        if(isOrderDetail != null && orderId > 0)
        {
            let messagesSent = $('.speech-bubble-right').length;
            let messagesReceived = $('.speech-bubble-left').length;
            let totalMessages = messagesSent + messagesReceived;

            $.ajax({
                url: "/distributors/order/get-messages",
                type: 'GET',
                cache: false,
                timeout: 10000,
                data: {
                    'distributor': 1,
                    'clinic': 0,
                    'order-id': orderId,
                    'distributor-id': distributorId,
                    'clinic-id': clinicId,
                    'total-messages': totalMessages
                },
                success: function (response)
                {
                    if (response.messages.length > 0)
                    {
                        $('#distributor_chat_container').empty().append(response.messages);
                        $('#distributor_chat_inner').scrollTop($('#distributor_chat_inner').prop("scrollHeight"));
                    }

                    if (response.is_typing == 1)
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

    getChat(orderId, distributorId, clinicId)
    {
        self = this;

        setInterval(function(){
            self.getMessages(clinicId, distributorId);
        }, 1000);
    }

    onChangeExpDate(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let itemId = $(clickedElement).data('item-id');
        let expiryDate = $(clickedElement).val();

        if(itemId > 0)
        {
            $.ajax({
                url:"/distributors/update-expiry-date",
                type: 'POST',
                dataType: 'json',
                data: {
                    'item-id': itemId,
                    'expiry-date': expiryDate
                },
                beforeSend: function ()
                {
                    self.isLoading(true);
                },
                success: function(response)
                {
                    self.getFlash(response.flash);
                    self.getOrderDetails(response.order_id);
                    self.isLoading(false);
                }
            });
        }
    }

    onChangeItemPrice(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let itemId = $(clickedElement).data('item-id');
        let price = $(clickedElement).val();

        if(itemId > 0){

            $.ajax({
                url:"/distributors/update-item-price",
                type: 'POST',
                dataType: 'json',
                data: {
                    'item-id': itemId,
                    'price': price
                },
                beforeSend: function ()
                {
                    self.isLoading(false);
                },
                success: function(response)
                {
                    self.getFlash(response.flash);
                    self.getOrderDetails(response.order_id);
                    self.isLoading(false);
                }
            });
        }
    }

    onChangeItemQty(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let itemId = $(clickedElement).data('item-id');
        let qty = $(clickedElement).val();

        if(itemId > 0)
        {
            $.ajax({
                url:"/distributors/update-item-qty",
                type: 'POST',
                dataType: 'json',
                data: {
                    'item-id': itemId,
                    'qty': qty
                },
                beforeSend: function ()
                {
                    self.isLoading(true);
                },
                success: function(response)
                {
                    self.getFlash(response.flash);
                    self.getOrderDetails(response.order_id);
                    self.isLoading(false);
                }
            });
        }
    }

    onClickBtnConfirm(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let itemId = $(clickedElement).data('item-id');

        if(itemId > 0)
        {
            $.ajax({
                url:"/distributors/update-order-item-status",
                type: 'POST',
                dataType: 'json',
                data: {
                    'item-id': itemId,
                    'confirmed_status': 1
                },
                beforeSend: function ()
                {
                    self.isLoading(true);
                },
                success: function(response)
                {
                    self.getFlash(response.flash);
                    self.getOrderDetails(response.order_id);
                    self.isLoading(false);
                }
            });
        }
    }

    onClickBtnPending(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let itemId = $(clickedElement).attr('data-item-id');

        if(itemId > 0)
        {
            $.ajax({
                url:"/distributors/update-order-item-status",
                type: 'POST',
                dataType: 'json',
                data: {
                    'item-id': itemId,
                    'confirmed_status': 0
                },
                beforeSend: function ()
                {
                    self.isLoading(true);
                },
                success: function(response)
                {
                    self.getFlash(response.flash);
                    self.getOrderDetails(response.order_id);
                    self.isLoading(false);
                }
            });
        }
    }

    onSubmitOrderForm(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let data = new FormData($(clickedElement)[0]);
        let productId = data.getAll('product_id[]');
        let expDates = data.getAll('expiry_date[]');
        let prices = data.getAll('price[]');
        let qtys = data.getAll('qty[]');
        let isValid = true;

        for(let $i = 0; $i < productId.length; $i++)
        {
            let errorExpDate = $('#error_expiry_date_'+ productId[$i]);
            let errorPrice = $('#error_price_'+ productId[$i]);
            let errorQty = $('#error_qty_'+ productId[$i]);
            let expDate = expDates[$i];
            let price = prices[$i];
            let qty = qtys[$i];

            errorExpDate.hide();
            errorPrice.hide();
            errorQty.hide();

            if((expDate == '' || expDate == 'undefined') && expDate !== 0)
            {
                errorExpDate.show();
                isValid = false;
            }

            if(price == '' || price == 'undefined')
            {
                errorPrice.show();
                isValid = false;
            }

            if(qty == '' || qty == 'undefined')
            {
                errorQty.show();
                isValid = false;
            }
        }

        if(isValid)
        {
            $.ajax({
                url: "/distributors/update-order",
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
                    self.getOrderDetails(response.order_id);
                    self.isLoading(false);

                    let date = new Date();
                    self.dateTime = date.getFullYear() +'-'+ (date.getMonth() + 1) +'-'+ date.getDate() +' '+ String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0") +':'+ String(date.getSeconds()).padStart(2, '0');

                    sessionStorage.setItem('date_time', self.dateTime);
                }
            });
        }
    }

    checkLastModified(orderId)
    {
        setInterval(this.checkLastModified(orderId), 1000);
    }

    getLastModified(orderId)
    {
        let self = this;
        let sessionDateTime = sessionStorage.getItem('date_time');

        $.ajax({
            url: "/distributors/get-order-last-updated",
            type: 'POST',
            cache: false,
            timeout: 10000,
            data: {
                'order-id': orderId
            },
            success: function (response)
            {
                if (response > sessionDateTime)
                {
                    $('.refresh-distributor-order').removeClass('blinking-text').addClass('blinking-text');

                    let date = new Date();
                    self.dateTime = date.getFullYear() +'-'+ (date.getMonth() + 1) +'-'+ date.getDate() +' '+ String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0") +':'+ String(date.getSeconds()).padStart(2, '0');

                    sessionStorage.setItem('date_time', self.dateTime);

                }
            }
        });
    };

    popOver()
    {
        var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
        var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl)
        })
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

    getFlash(flash, type = 'success')
    {
        $('#flash').addClass('alert-'+ type).addClass('alert').addClass('text-center');
        $('#flash').removeClass('users-flash').addClass('users-flash').empty().append(flash).removeClass('hidden');

        setTimeout(function()
        {
            $('#flash').removeClass('alert-success').removeClass('alert').removeClass('text-center');
            $('#flash').removeClass('users-flash').empty().addClass('hidden');
        }, 5000);
    }
}