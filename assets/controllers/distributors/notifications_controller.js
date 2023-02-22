import { Controller } from '@hotwired/stimulus';

export default class extends Controller
{
    connect()
    {
        setInterval(this.getNotifications, 3000);

        $(document).on('click', 'a', function (){

            let name = $(this).attr('name');

            if(name != 'notifications'){

                $('#notifications_panel').hide();
            }

        });
    }

    onClickSendNotification(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let orderId = $(clickedElement).data('order-id');
        let distributorId = $(clickedElement).data('distributor-id');
        let clinicId = $(clickedElement).data('clinic-id');

        if(orderId > 0 && distributorId > 0)
        {
            $.ajax({
                url:"/distributors/send-order-notification",
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
                success: function(response)
                {
                    self.isLoading(false);
                    self.getFlash(response);
                }
            });
        }
    }

    onClickBtnNotificataions(e)
    {
        e.preventDefault();

        if($('#notifications_panel').is(':visible'))
        {
            $('#notifications_panel').slideUp(700);
        }
        else
        {
            $('#notifications_panel').slideDown(700);
        }
    }

    onClickNotification(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let orderId = $(clickedElement).data('order-id');
        let distributorId = $(clickedElement).data('distributor-id');
        let clinicId = $(clickedElement).data('clinic-id');
        let notificationId = $(clickedElement).data('notification-id');
        let orders = this.application.getControllerForElementAndIdentifier(this.element,'orders--distributors');
        orders.getOrderDetails(orderId, distributorId, clinicId);

        $.ajax({
            url: "/distributors/delete-notification",
            type: 'POST',
            dataType: 'json',
            data: {
                'notification-id': notificationId,
                'type': 'distributor',
            }
        });

        window.history.pushState(null, "Fluid", '/distributors/order/'+ orderId);
    }

    getNotifications()
    {
        $.ajax({
            url: "/get-order-notifications",
            type: 'GET',
            cache: false,
            timeout: 600000,
            dataType: 'json',
            data: {
                'type': 'distributor',
                'id': $.session.get('distributor-id'),
            },
            success: function (response)
            {
                if(response.count > 0)
                {
                    $('#notifications_icon').addClass('text-secondary');
                }
                else
                {
                    $('#notifications_icon').removeClass('text-secondary');
                }

                $('#notifications_panel').empty().append(response.alert);
            }
        });
    }

    onClickDeleteNotification(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let notificationId = $(clickedElement).data('notification-id');

        $.ajax({
            async: "true",
            url: "/distributors/delete-notification",
            type: 'POST',
            cache: false,
            timeout: 600000,
            dataType: 'json',
            data: {
                'notification-id': notificationId,
                'type': 'distributor',
            },
            success: function (response)
            {
                $(clickedElement).closest('li').remove();
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
            url: "/distributors/delete-notification",
            type: 'POST',
            cache: false,
            timeout: 600000,
            dataType: 'json',
            data: {
                'notification-id': notificationId,
                'type': 'distributor'
            },
            success: function (response)
            {
                self.getNotifications();
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
}