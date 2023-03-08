import { Controller } from '@hotwired/stimulus';

export default class extends Controller
{
    connect()
    {
        $('#notifications_panel').hide();
        setInterval(this.getNotifications, 3000);
    }

    onClickNotificationsBtn(e)
    {
        e.preventDefault();
        this.getNotifications();

        $('#notifications_panel').slideToggle();
    }

    onClickDeleteNotification(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let notificationId = $(clickedElement).data('notification-id');

        $.ajax({
            async: "true",
            url: "/clinics/delete-notification",
            type: 'POST',
            cache: false,
            timeout: 600000,
            dataType: 'json',
            data: {
                'notification-id': notificationId,
                'type': 'clinic',
            },
            success: function (response)
            {
                self.getFlash(response.flash);
                self.getNotifications();
            }
        });
    }

    onClickNotificationPanel(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let notificationId = $(clickedElement).data('notification-id');
        let distributorId = $(clickedElement).data('distributor-id');
        let clinicId = $(clickedElement).data('clinic-id');
        let orderId = $(clickedElement).data('order-id');

        let orders = this.application.getControllerForElementAndIdentifier(this.element,'orders--clinics');
        orders.getOrderDetails(orderId, distributorId, clinicId);

        $.ajax({
            async: "true",
            url: "/clinics/delete-notification",
            type: 'POST',
            cache: false,
            timeout: 600000,
            dataType: 'json',
            data: {
                'notification-id': notificationId,
                'type': 'clinic',
            },
            success: function (response) {

                self.getNotifications();
            }
        });

        window.history.pushState(null, "Fluid", '/clinics/order/'+ orderId +'/'+ distributorId);
    }

    getNotifications()
    {
        $.ajax({
            url:"/clinics/get-notification",
            type: 'POST',
            cache:false,
            timeout:10000,
            dataType: 'json',
            success: function(response)
            {
                $('#notifications_panel').empty().append(response);
            }
        });
    };

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

    getOrderNotifications() {

        $.ajax({
            async: "true",
            url: "/get-order-notifications",
            type: 'GET',
            cache: false,
            timeout: 600000,
            dataType: 'json',
            data: {
                'type': 'clinic',
                'id': $.session.get('clinic-id'),
            },
            success: function (response) {
                if (response.count > 0) {
                    $('#notifications_icon').addClass('text-secondary');
                } else {
                    $('#notifications_icon').removeClass('text-secondary');
                }

                $('#notifications_panel').empty().append(response.alert);
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
}