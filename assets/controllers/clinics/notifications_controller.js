import { Controller } from '@hotwired/stimulus';

export default class extends Controller
{
    connect()
    {
        $('#notifications_panel').hide();
        setInterval(this.getNotifications, 1000);
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
            success: function (response) {

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