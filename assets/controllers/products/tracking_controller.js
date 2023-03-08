import { Controller } from '@hotwired/stimulus';
import intlTelInput from 'intl-tel-input';

export default class extends Controller
{
    onClickBtnTrack(e)
    {
        let self = this;
        let clickedElement = e.currentTarget;
        let productId = $(clickedElement).data('product-id');
        let parent = $(clickedElement).closest('.prd-container').closest('.row');

        if(parent.find('.panel-tracking').is(':visible'))
        {
            parent.find('.panel-tracking').slideUp(700);
            parent.find('.search-panels-container').slideUp(700);
            $(clickedElement).removeClass('active');
        }
        else
        {
            $.ajax({
                async: "true",
                url: "/clinics/get-availability-tracker",
                type: 'POST',
                dataType: 'json',
                data: {
                    'product-id': productId
                },
                success: function (response)
                {
                    parent.find('.panel-tracking').empty().append(response.html);
                    parent.find('.panel-tracking').append(response.list);
                    parent.find('.search-panels-container').show();
                    parent.find('.panel-details').slideUp(700);
                    parent.find('.panel-lists').slideUp(700);
                    parent.find('.panel-tracking').slideDown(700);
                    parent.find('.panel-reviews').slideUp(700);
                    parent.find('.panel-notes').slideUp(700);
                    parent.find('.btn_details').removeClass('active');
                    parent.find('.btn_lists').removeClass('active');
                    parent.find('.btn_track').addClass('active');
                    parent.find('.btn_notes').removeClass('active');
                    parent.find('.btn_reviews').removeClass('active');
                }
            });
        }
    }

    onSubmitTrackingForm(e)
    {
        e.preventDefault();

        let self = this;
        let methodCounter = 0;
        let distributorCounter = 0;
        let clickedElement = e.currentTarget;
        let errorAtMethods = $('#error_at_methods');
        let errorAtDistributors = $('#error_at_distributors');
        let data = new FormData($(clickedElement)[0]);
        let isValid = true;

        $("input[name='method[]']").each(
            function ()
            {
                if(this.checked)
                {
                    methodCounter += 1;
                }
            }
        );

        $("input[name='distributor[]']").each(
            function ()
            {
                if(this.checked)
                {
                    distributorCounter += 1;
                }
            }
        );

        errorAtMethods.hide()
        errorAtDistributors.hide();

        if(methodCounter == 0)
        {
            errorAtMethods.show();
            isValid = false;
        }

        if(distributorCounter == 0)
        {
            errorAtDistributors.show();
            isValid = false;
        }

        if(isValid)
        {
            $.ajax({
                async: "true",
                url: "/clinics/create-availability-tracker",
                type: 'POST',
                contentType: false,
                processData: false,
                cache: false,
                timeout: 600000,
                dataType: 'json',
                data: data,
                success: function (response)
                {
                    self.getFlash(response.flash);
                    $('#availability_tracker_row').show();
                    $('#availability_tracker_col').empty().append(response.list)
                }
            });
        }
    }

    onClickDeleteIcon(e)
    {
        e.preventDefault();

        let trackerId = $(e.currentTarget).data("availability-tracker-id");

        $('#delete_tracker').attr('data-delete-tracker-id', trackerId);
    }

    onClickDelete(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let trackerId = $(clickedElement).data('delete-tracker-id');

        $.ajax({
            async: "true",
            url: "/clinics/delete-availability-tracker",
            type: 'POST',
            cache: false,
            timeout: 600000,
            dataType: 'json',
            data: {
                'tracker-id': trackerId
            },
            beforeSend: function (e)
            {
                self.isLoading(true);
            },
            success: function (response)
            {
                $('#modal_availability_tracker_delete').modal('hide');
                $('.modal-backdrop').removeClass('modal-backdrop');
                $('#availability_trackers').empty().append(response.html);
                self.isLoading(false);
                self.getFlash(response.flash);
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