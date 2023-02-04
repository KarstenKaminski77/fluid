import { Controller } from '@hotwired/stimulus';
import intlTelInput from 'intl-tel-input';

export default class extends Controller
{
    errorPage;
    iti;

    connect(e)
    {
        this.errorPage = '/clinics/error';

        let uri = window.location.pathname;
        let isCommunicationMethod = uri.match('/clinics/communication-methods');

        if(isCommunicationMethod != null)
        {
            this.getCommunicationMethods(1);
        }
    }

    onClickCommunicationMethodsLink(e)
    {
        e.preventDefault();
        this.getCommunicationMethods(1);
    }

    onClickPagination(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let pageId = $(clickedElement).attr('data-page-id');

        this.getCommunicationMethods(pageId);
    }

    onClickCreateMethod()
    {
        console.log('xxxx');
        $('#col_send_to').hide();
        $('#btn_save_communication_method').empty().append('CREATE');
    }

    onChangeMethodType(e)
    {
        $('#error_communication_method').hide();
        $('#error_send_to').hide();

        let communicationMethod = $('#communication_methods_type').val();

        if(communicationMethod == 0 || communicationMethod == 1)
        {
            $('#col_send_to').hide();
        }

        if(communicationMethod == 2)
        {
            $('#send_to_container').empty().append('<input type="text" name="clinic_communication_methods_form[sendTo]" id="send_to" class="form-control">');
            $('#label_send_to').empty().append('Email Address').show();
            $('#send_to').attr('placeholder', 'Enter your email address');
        }

        if(communicationMethod == 3)
        {
            $('#send_to_container').empty().append('<input type="text" name="clinic_communication_methods_form[sendTo]" id="send_to" class="form-control">');
            $('#label_send_to').empty().append('Mobile Phone Number').show();

            this.initIntlTel('za');
        }

        if(communicationMethod == 2 || communicationMethod == 3) {

            $('#col_send_to').show();
            $('#send_to').show();
        }
    }

    getCommunicationMethods(pageId)
    {
        let self = this;

        $.ajax({
            async: "true",
            url: '/clinics/get-communication_methods',
            type: 'POST',
            dataType: 'json',
            data:{
                'page-id': pageId,
                'permissions': $.session.get('permissions'),
            },
            beforeSend: function ()
            {
                self.isLoading(true)
            },
            complete: function(e)
            {
                if(e.status === 500)
                {
                    //window.location.href = self.errorPage;
                }
            },
            success: function (response)
            {
                $('#clinic_container').empty().append(response.html).show();
                $('#clinic_container').append(response.pagination);
                window.scrollTo(0,0);
                //clearInterval(get_messages);
                self.isLoading(false);
                window.history.pushState(null, "Fluid", '/clinics/communication-methods');
            }
        });
    }

    initIntlTel(isoCode)
    {
        let input = document.querySelector("#send_to");
        let iti = window.intlTelInput(input, {
            preferredCountries: ['ae', 'qa', 'bh', 'om', 'sa'],
            initialCountry: isoCode,
            autoPlaceholder: "polite",
            nationalMode: true,
            separateDialCode: true,
            utilsScript: "/js/utils.js",
        });

        return iti;
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