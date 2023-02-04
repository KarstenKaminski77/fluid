import { Controller } from '@hotwired/stimulus';
import intlTelInput from 'intl-tel-input';

export default class extends Controller
{
    iti;
    connect(e)
    {
        let uri = window.location.pathname;
        let isAddresses = uri.match('/clinics/addresses');

        if(isAddresses != null)
        {
            this.iti = this.getAddresses(1);
        }
    }

    onClickAddressesLink(e)
    {
        e.preventDefault();

        this.getAddresses(1);
    }

    onClickAddressNew(e)
    {
        $('#address_id').val(0);
        $('#address_clinic_name').val('');
        $('#address_mobile').val('');
        $('#address_line_1').val('');
        $('#address_modal_label').empty().append('Create An Address');
    }

    onClickAddressUpdate(e)
    {
        let self = this;
        let clickedElement = e.currentTarget;
        let addressId = $(clickedElement).data('address-id');
        this.iti.destroy();

        $.ajax({
            async: "true",
            url: "/get-address",
            type: 'POST',
            data: {
                id: addressId
            },
            success: function (response) {
                $('#address_clinic_name').val(response.clinic_name);
                $('#address_telephone').val(response.telephone);
                $('#address_mobile').val(response.telephone);
                $('#address_iso_code').val(response.iso_code);
                $('#address_intl_code').val(response.intl_code);
                $('#address_line_1').val(response.address);
                $('option').attr('selected', false);

                if (response.type == 1) {
                    $('#option_billing').attr('selected', true);
                }

                if (response.type == 2) {
                    $('#option_shipping').attr('selected', true);
                }

                self.input = document.querySelector("#address_mobile");
                self.iti = window.intlTelInput(self.input, {
                    preferredCountries: ['ae', 'qa', 'bh', 'om', 'sa'],
                    initialCountry: response.iso_code,
                    autoPlaceholder: "polite",
                    nationalMode: true,
                    separateDialCode: true,
                    utilsScript: "/js/utils.js",
                });
            }
        });

        $('#address_id').val(addressId);
        $('#address_modal_label').empty().append('Update An Address');
    }

    onKeyUpMobile(e)
    {
        let input = this.input;
        let iti = this.iti;

        $('#address_telephone').val('');
        $('#address_iso_code').val('');
        $('#address_intl_code').val('');

        let handleChange = function()
        {
            let mobile = $('#address_telephone');
            let mobile_number = iti.isValidNumber ? iti.getNumber() : false;
            let textNode = document.createTextNode(mobile_number);

            if(mobile_number != false){

                let isoCode = iti.getSelectedCountryData().iso2;
                let intlCode = iti.getSelectedCountryData().dialCode;

                mobile.val(mobile_number.substring(1));
                $('#address_iso_code').val(isoCode);
                $('#address_intl_code').val(intlCode);

            }
        };

        // listen to "keyup", but also "change" to update when the user selects a country
        input.addEventListener('change', handleChange);
        input.addEventListener('keyup', handleChange); input.addEventListener('keyup',handleChange());
    }

    getAddresses(pageId)
    {
        let self = this;
        let page = $('html').html();

        $.ajax({
            async: "true",
            url: '/clinics/get-clinic-addresses',
            type: 'POST',
            dataType: 'json',
            data: {
                'page-id': pageId,
                'permissions': $.session.get('permissions'),
            },
            beforeSend: function ()
            {
                self.isLoading(true)
            },
            complete: function(e, xhr, settings)
            {
                if(e.status === 500)
                {
                    window.location.href = '/clinics/error';
                }

                self.input = document.querySelector("#address_mobile");
                self.iti = window.intlTelInput(self.input, {
                    preferredCountries: ['ae','qa', 'bh', 'om', 'sa'],
                    autoPlaceholder: "polite",
                    nationalMode: true,
                    separateDialCode: true,
                    utilsScript: "/js/utils.js",
                });

                return self.iti;
            },
            success: function (response)
            {
                $('#clinic_container').empty().removeClass('col-container').append(response.html).show();
                $('#clinic_container').append(response.pagination);
                window.scrollTo(0,0);
                //clearInterval(get_messages);
                self.isLoading(false);
                window.history.pushState(null, "Fluid", '/clinics/addresses');
            }
        });
    }

    onClickPagination(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let pageId = $(clickedElement).data('page-id');

        this.getAddresses(pageId);
    }

    onClickDeleteIcon(e)
    {
        e.preventDefault();

        $('#delete_address').attr('data-address-id', $(e.currentTarget).data('address-id'));
    }

    onClickDelete(e)
    {
        let self = this;
        let clickedElement = e.currentTarget;
        let addressId = $(clickedElement).data('address-id');
        let pageId = $('#page_no').val();

        $.ajax({
            async: "true",
            url: "/clinics/address/delete",
            type: 'POST',
            data: {
                id: addressId,
                'page-id': pageId
            },
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            success: function (response) {
                self.getFlash(response.flash);
                $('#basket_container').empty().append(response.addresses);
                $('#paginator').empty().append(response.pagination).show();
                $('#modal_address_delete').modal('hide');
                $('.modal-backdrop').removeClass('modal-backdrop');
                $('#modal_address_delete').addClass('fade');
                self.isLoading(false);
            }
        });
    }

    onClickDefaultShipping(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let addressId = $(clickedElement).data('address-id');
        let pageId = $('#page_no').val();

        $.ajax({
            async: "true",
            url: "/clinics/address/default",
            type: 'POST',
            dataType: 'json',
            data: {
                id: addressId,
                'page-id': pageId
            },
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            success: function (response)
            {
                self.getFlash(response.flash);
                $('#basket_container').empty().append(response.addresses);
                $('#paginator').empty().append(response.pagination).show();
                self.isLoading(false);
            }
        });
    }

    onClickDefaultBillingAddress(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let addressId = $(clickedElement).data('billing-address-id');
        let pageId = $('#page_no').val();

        $.ajax({
            async: "true",
            url: "/clinics/address/default-billing",
            type: 'POST',
            dataType: 'json',
            data: {
                id: addressId,
                'page-id': pageId,
            },
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            success: function (response)
            {
                self.getFlash(response.flash);
                $('#basket_container').empty().append(response.addresses);
                $('#paginator').empty().append(response.pagination).show();
                self.isLoading(false);
            }
        });
    }

    onSubmitAddressForm(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let isValid = true;
        let clinicName = $('#address_clinic_name').val()
        let telephone = $('#address_telephone').val();
        let addressLine1 = $('#address_line_1').val();
        let type = $('#address_type').val();
        let errorClinicName = $('#error_address_clinic_name');
        let errorTelephone = $('#error_address_telephone');
        let errorAddressLine1 = $('#error_address_line_1');
        let errorType = $('#error_address_type');

        errorClinicName.hide();
        errorTelephone.hide();
        errorAddressLine1.hide();
        errorType.hide();

        if(clinicName == '' || clinicName == 'undefined'){

            errorClinicName.show();
            isValid = false;
        }

        if(telephone == '' || telephone == 'undefined'){

            errorTelephone.show();
            isValid = false;
        }

        if(addressLine1 == '' || addressLine1 == 'undefined'){

            errorAddressLine1.show();
            isValid = false;
        }

        if(type == '' || type == 'undefined'){

            errorType.show();
            isValid = false;
        }

        if(isValid == true){

            $("<input />").attr("type", "hidden").attr("name", "page_id").attr("value", $('#page_no').val()).appendTo("#form_addresses");

            let data = new FormData($(clickedElement)[0]);

            $.ajax({
                async: "true",
                url: "/clinics/update-address",
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

                    $('#basket_container_parent').show();
                    $('#basket_container').empty().append(response.addresses);
                    $('#paginator').empty().append(response.pagination).show();
                    $('#modal_address').modal('hide');
                    $('.modal-backdrop').removeClass('modal-backdrop');
                    $('.fade').removeClass('fade');
                    self.isLoading(false);
                    $('#address_clinic_name').val('');
                    $('#address_telephone').val('');
                    $('#address_line_1').val('');
                    $('#address_suite').val('');
                    $('#address_postal_code').val('');
                    $('#address_city').val('');
                    $('#address_state').val('');
                }
            });
        }
    }

    onclickBtnMap(e)
    {
        let visible = $('#address_map').is(":visible");
        let width = $(window).width();
        let modal_height = $('#modal_address .modal-body').height();
        $('#address_map').toggle(700);

        if(visible == false){

            let height = $('#modal_address .modal-body').height();
            $.session.set('modal_height', height);

            if(width < 579) {

                $('#modal_address .modal-body').css('height', (modal_height + 370));

            } else {

                $('#modal_address .modal-body').css('height', (modal_height + 370));
            }

        } else {

            $('#modal_address .modal-body').css('height', $.session.get('modal_height'));
        }
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