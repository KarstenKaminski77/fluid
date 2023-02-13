import { Controller } from '@hotwired/stimulus';
import {preventOverflow} from "@popperjs/core";

export default class extends Controller {
    messages;
    errorPage = '/distributors/error';

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

    getOrderDetails(orderId)
    {
        let self = this;

        $.ajax({
            url: "/distributors/order",
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
            { console.log('xxx')
                // Reset page load time for refresh button alert
                let date = new Date();
                let dateTime = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0") + ':' + String(date.getSeconds()).padStart(2, '0');
                sessionStorage.setItem('date_time', dateTime);

                $('#distributor_container').empty().append(response.html);
                $('#distributor_chat_inner').scrollTop($('#distributor_chat_inner').prop("scrollHeight"));
                self.popOver();
                //self.getChat(orderId, distributorId, clinicId)
                $('#chat_pulse').hide();

                var maxWidth = Math.max.apply(null, $('.badge').map(function () {
                    return $(this).outerWidth(true);
                }).get());

                $('.badge').css({'width': maxWidth + 'px'});

                self.isLoading(false);
            }
        });
    }

    getMessages(distributorId, clinicId)
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
                url: "{{ path('get_messages') }}",
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

    getChat(orderId, distributorId, clinicId) {
        let get_messages = setInterval(function(){
            this.getMessages(distributorId, clinicId);
        }, 1000);
    }

    checkLastModified(orderId)
    {
        setInterval(this.checkLastModified(orderId), 1000);
    }

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