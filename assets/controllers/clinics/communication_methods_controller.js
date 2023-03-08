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
        $('#communication_method_id').val(0);
        $('#mobile_no').val('');
        $('#communication_methods_type').val('');
        $('#col_send_to').hide();
        $('#btn_save_communication_method').empty().append('CREATE');

        if($('.modal-backdrop').length > 1)
        {
            $('.modal-backdrop:first').remove();
        }
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
            $('#col_communication_method').removeClass('col-12').addClass('col-6');
        }

        if(communicationMethod == 3)
        {
            $('#send_to_container').empty().append('<input type="text" name="clinic_communication_methods_form[sendTo]" id="send_to" class="form-control" data-action="keyup->clinics--communication-methods#onChangeSendTo">');
            $('#label_send_to').empty().append('Mobile Phone Number').show();
            $('#col_communication_method').removeClass('col-12').addClass('col-6');

            let isoCode = $('#iso_code').val() ? $('#iso_code').val() : 'ae';

            this.iti = this.initIntlTel(isoCode);
        }

        if(communicationMethod == 2 || communicationMethod == 3) {

            $('#col_send_to').show();
            $('#send_to').show();
        }
    }

    onClickEditCommunicationMethod(e)
    {
        let self = this;
        let clickedElement = e.currentTarget;
        let clinicMethodId = $(clickedElement).data('clinic-communication-method-id');
        let methodId = $(clickedElement).data('communication-method-id');
        let isoCode = '';

        if(methodId == 3)
        {
            $('#send_to_container').empty().append('<input type="text" name="clinic_communication_methods_form[sendTo]" id="send_to" class="form-control" data-action="keyup->clinics--communication-methods#onChangeSendTo">');

        }
        else if(methodId == 2)
        {

            $('#send_to_container').empty().append('<input type="text" name="clinic_communication_methods_form[sendTo]" id="send_to" class="form-control" placeholder="Enter your email address">');
        }

        $.ajax({
            async: "true",
            url: "/clinics/get-method",
            type: 'POST',
            data: {
                id: clinicMethodId
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
                isoCode = response.iso_code;


                if(methodId == 3)
                {
                    let isoCode = $('#user_iso_code').val() ? $('#user_iso_code').val() : 'ae';
                    self.iti = self.initIntlTel(isoCode);

                    $('#mobile_no').val(response.send_to);
                    $('#label_send_to').empty().append('Mobile Phone Number').show();
                    $('#send_to').show();
                }

                $('#send_to').val(response.send_to);
                $('#communication_methods_type option[value="'+ response.method_id +'"]').attr('selected',false);
                $('#communication_methods_type option[value="'+ response.method_id +'"]').attr('selected','selected');
            }
        });

        let communicationMethod = $(clickedElement).data('communication-method-id');

        if(communicationMethod == 0 || communicationMethod == 1)
        {
            $('#col_send_to').hide();
            $('#label_send_to').hide();
        }

        if(communicationMethod == 2)
        {
            $('#label_send_to').empty().append('Email Address').show();
            $('#send_to').attr('placeholder', 'Enter your email address').show();
        }

        if(communicationMethod == 2 || communicationMethod == 3)
        {
            $('#col_send_to').show();
        }

        $('#clinic_communication_methods_form_communicationMethod_clinicCommunicationMethods option[value="'+ communicationMethod +'"]').attr('selected',false);
        $('#clinic_communication_methods_form_communicationMethod_clinicCommunicationMethods option[value="'+ communicationMethod +'"]').attr('selected','selected');
        $('#communication_method_id').val(clinicMethodId);
        $('#communication_methods_modal_label').empty().append('Update A Communication Method');
        $('#btn_save_communication_method').empty().append('UPDATE');

        if($('.modal-backdrop').length > 1)
        {
            $('.modal-backdrop:first').remove();
        }
    }

    onSubmitCommunicationMethodForm(e)
    {
        e.preventDefault();

        let self = this;
        let isValid = true;
        let clickedElement = e.currentTarget;
        let communicationMethod = $('#communication_methods_type').val();
        let sendTo = $('#send_to').val();
        let mobile = $('#mobile_no').val();
        let errorCommunicationMethod = $('#error_communication_method');
        let errorSendTo = $('#error_send_to');
        let errorMobile = $('#error_communication_method_mobile');

        errorCommunicationMethod.hide();
        errorSendTo.hide()
        errorMobile.hide();

        if(communicationMethod == '' || communicationMethod == 'undefined' || communicationMethod == 0)
        {
            errorCommunicationMethod.show();
            isValid = false;
        }

        if((sendTo == '' || sendTo == 'undefined') && (communicationMethod == 2))
        {
            errorSendTo.show();
            isValid = false;
        }

        if(mobile == 0 && communicationMethod == 3)
        {
            errorMobile.show();
            isValid = false;
        }

        if(isValid == true)
        {
            if(communicationMethod == 3)
            {
                let iti = self.iti;
                let pageId = $('#page_no').val();
                let iso = iti.getSelectedCountryData().iso2;
                let intlCode = iti.getSelectedCountryData().dialCode

                $('<input />').attr('type', 'hidden').attr('name', 'page_id')
                    .attr('value', pageId).attr('id', 'iso_code').appendTo('#form_communication_methods');
                $('<input />').attr('type', 'hidden').attr('name', 'clinic_communication_methods_form[iso_code]')
                    .attr('value', iso).appendTo('#form_communication_methods');
                $('<input />').attr('type', 'hidden').attr('name', 'clinic_communication_methods_form[intl_code]')
                    .attr('value', intlCode).attr('id', 'intl_code').appendTo('#form_communication_methods');
            }

            let data = new FormData($(clickedElement)[0]);

            $.ajax({
                async: "true",
                url: "/clinics/manage-communication-methods",
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
                        window.location.href = self.errorPage;
                    }
                },
                success: function (response)
                {
                    self.getFlash(response.flash);
                    $('#modal_communication_methods').modal('hide');
                    $('.modal-backdrop').removeClass('modal-backdrop');
                    $('.fade').removeClass('fade');
                    $('#clinic_communication_methods_form_communicationMethod_clinicCommunicationMethods').val('');
                    $('#send_to').val('');
                    $('#clinic_container').empty().append(response.communication_methods);
                    $('#clinic_container').append(response.pagination);
                    $('#communication_method_id').val(0);
                    $('#mobile_no').val('');
                    $('#communication_methods_type').val('');
                    self.isLoading(false);

                    let removeCss = setInterval(function ()
                    {
                        $('body').removeAttr('style');
                        clearInterval(removeCss);
                    }, 200);
                }
            });
        }
    }

    onClickDeleteIcon(e)
    {
        $('#delete_method').attr('data-communication-method-id', $(e.currentTarget).data('clinic-communication-method-id'));

        if($('.modal-backdrop').length > 1)
        {
            $('.modal-backdrop:first').remove();
        }
    }

    onClickDelete(e)
    {
        let self = this;
        let clickedElement = e.currentTarget;
        let methodId = $(clickedElement).data('communication-method-id');

        $.ajax({
            async: "true",
            url: "/clinics/method/delete",
            type: 'POST',
            data: {
                id: methodId
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
                $('#modal_method_delete').modal('toggle');
                $('#modal_method_delete').modal('hide');
                $('.modal-backdrop').removeClass('modal-backdrop');
                $('#modal_method_delete').addClass('fade');
                self.getFlash(response.flash);
                $('#clinic_container').empty().append(response.communication_methods);
                self.isLoading(false);

                let removeCss = setInterval(function ()
                {
                    $('body').removeAttr('style');
                    clearInterval(removeCss);
                }, 400);
            }
        });
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

    onChangeSendTo(e)
    {
        let iti = this.iti;
        let communicationMethod = $('#communication_methods_type').val()
        let input = document.querySelector("#send_to");

        if(communicationMethod == 3)
        {
            let handleChange = function() {

                let mobile = $('#mobile_no');
                let mobileNumber = (iti.isValidNumber()) ? iti.getNumber() : false;
                let textNode = document.createTextNode(mobileNumber);

                if(mobileNumber != false){

                    mobile.val(mobileNumber.substring(1));
                }
            };

            // listen to "keyup", but also "change" to update when the user selects a country
            input.addEventListener('change', handleChange);
            input.addEventListener('keyup', handleChange);

            $('#label_send_to').empty().append('Mobile Phone Number').show();
            $('#send_to').show();
        }
    }

    initIntlTel(isoCode)
    {
        if(isoCode != '' || isoCode != 'undefined')
        {
            isoCode = '';
        }

        let input = document.querySelector("#send_to");
        let iti = window.intlTelInput(input, {
            preferredCountries: ['za', 'ae', 'qa', 'bh', 'om', 'sa'],
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