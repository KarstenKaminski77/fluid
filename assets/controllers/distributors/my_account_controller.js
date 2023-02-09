import { Controller } from '@hotwired/stimulus';

export default class extends Controller
{
    errorPage = '/distributors/error';
    iti;
    input;
    permissions = JSON.parse($.session.get('permissions'));
    accessDenied = $('#access_denied');

    connect()
    {
        let uri = window.location.pathname;
        let isAccountSettings = uri.match('/distributors/account');
        let isAbout = uri.match('/distributors/about');
        let isOperatingHours = uri.match('/distributors/operating-hours');
        let isRefundPolicy = uri.match('/distributors/refund-policy');
        let isSalesTaxPolicy = uri.match('/distributors/sales-tax-policy');
        let isShippingPolicy = uri.match('/distributors/shipping-policy');

        if(isAccountSettings != null)
        {
            this.getCompanyInformation();
        }

        if(isAbout != null)
        {
            this.getAbout();
        }

        if(isOperatingHours != null)
        {
            this.getOperatingHours();
        }

        if(isRefundPolicy != null)
        {
            this.getRefundPolicy();
        }

        if(isSalesTaxPolicy != null)
        {
            this.getSalesTaxPolicy();
        }

        if(isShippingPolicy != null)
        {
            this.getShippingPolicy();
        }
    }

    // Company Information
    onClickCompanyInformation(e)
    {
        e.preventDefault();
        this.getCompanyInformation();
    }

    getCompanyInformation()
    {
        let self = this;

        $.ajax({
            url: "/distributors/get/company-information",
            type: 'POST',
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
                if($.inArray(10, self.permissions) !== -1)
                {
                    $('#distributor_container').empty().append(response);

                    $('.distributor-right-col').animate ({scrollTop:0}, 200);
                    //clearInterval(getMessages);
                    window.history.pushState(null, "Fluid", '/distributors/account');

                    // International Numbers
                    let input = document.querySelector('#mobile');
                    let iti = window.intlTelInput(input, {
                        initialCountry: $('#iso_code').val(),
                        preferredCountries: ['ae','qa', 'bh', 'om', 'sa'],
                        autoPlaceholder: "polite",
                        nationalMode: true,
                        separateDialCode: true,
                        utilsScript: "/js/utils.js",
                    });

                    let handleChange = function()
                    {
                        let mobile = $('#telephone');
                        let mobile_number = (iti.isValidNumber()) ? iti.getNumber() : false;
                        let textNode = document.createTextNode(mobile_number);

                        if(mobile_number != false){

                            let isoCode = iti.getSelectedCountryData().iso2;
                            let intlCode = iti.getSelectedCountryData().dialCode;

                            mobile.val(mobile_number.substring(1));
                            $('#iso_code').val(isoCode);
                            $('#intl_code').val(intlCode);

                        }
                    };

                    // listen to "keyup", but also "change" to update when the user selects a country
                    input.addEventListener('change', handleChange);
                    input.addEventListener('keyup', handleChange);

                    self.isLoading(false);
                }
                else
                {
                    self.accessDenied.show();
                    self.isLoading(false);
                }
            }
        });
    }

    onSubmitCompanyInformation(e)
    {
        e.preventDefault();

        let self = this;
        let isValid = true;
        let clickedElement = e.currentTarget;
        let companyName = $('#distributor_name').val();
        let email = $('#email').val();
        let telephone = $('#telephone').val();
        let country = $('#country').val();
        let streetAddress = $('#street_address').val();
        let city = $('#city').val();
        let postalCode = $('#postal_code').val();
        let state = $('#state').val();
        let managerFirstName = $('#manager_first_name').val();
        let managerLastName = $('#manager_last_name').val();
        let managerIdNo = $('#manager_id_no').val();
        let managerIdExpDate = $('#manager_id_exp_date').val();
        let tradeLicenseFile = $('#trade_license_file').val();
        let tradeLicenseNo = $('#trade_license_no').val();
        let tradeLicenseExpDate = $('#trade_license_exp_date').val();
        let errorCompanyName = $('#error_distributor_name');
        let errorEmail = $('#error_email');
        let errorTelephone = $('#error_telephone');
        let errorCountry = $('#error_country');
        let errorStreetAddress = $('#error_street_address');
        let errorCity = $('#error_city');
        let errorPostalCode = $('#error_postal_code');
        let errorState = $('#error_state');
        let errorManagerFirstName = $('#error_manager_first_name');
        let errorManagerLastName = $('#error_manager_last_name');
        let errorManagerIdNo = $('#error_manager_id_no');
        let errorManagerIdExpDate = $('#error_manager_id_exp_date');
        let errorTradeLicenseFile = $('#error_trade_license_file');
        let errorTradeLicenseNo = $('#error_trade_license_no');
        let errorTradeLicenseExpDate = $('#error_trade_license_exp_date');
        let isTradeLicense = $.session.get('trade-license-file') ? $.session.get('trade-license-file') : false;

        errorCompanyName.hide();
        errorEmail.hide();
        errorTelephone.hide();
        errorCountry.hide();
        errorStreetAddress.hide();
        errorCity.hide();
        errorPostalCode.hide();
        errorState.hide();
        errorManagerFirstName.hide();
        errorManagerLastName.hide();
        errorManagerIdNo.hide();
        errorManagerIdExpDate.hide();
        errorTradeLicenseNo.hide();
        errorTradeLicenseExpDate.hide();

        if(companyName == '' || companyName == 'undefined'){

            error_companyName.show();
            isValid = false;
        }

        if(email == '' || email == 'undefined'){

            errorEmail.show();
            isValid = false;
        }

        if(telephone == '' || telephone == 'undefined'){

            errorTelephone.show();
            isValid = false;
        }

        if(country == '' || country == 'undefined'){

            errorCountry.show();
            isValid = false;
        }

        if(streetAddress == '' || streetAddress == 'undefined'){

            errorStreetAddress.show();
            isValid = false;
        }

        if(city == '' || city == 'undefined'){

            error_city.show();
            isValid = false;
        }

        if(postalCode == '' || postalCode == 'undefined'){

            errorPostalCode.show();
            isValid = false;
        }

        if(state == '' || state == 'undefined'){

            error_state.show();
            isValid = false;
        }

        if(managerFirstName == '' || managerFirstName == 'undefined')
        {
            errorManagerFirstName.show();
            isValid = false;
        }

        if(managerLastName == '' || managerLastName == 'undefined')
        {
            errorManagerLastName.show();
            isValid = false;
        }

        if(managerIdNo == '' || managerIdNo == 'undefined')
        {
            errorManagerIdNo.show();
            isValid = false;
        }

        if(managerIdExpDate == '' || managerIdExpDate == 'undefined')
        {
            errorManagerIdExpDate.show();
            isValid = false;
        }

        if((tradeLicenseFile == '' || tradeLicenseFile == 'undefined') && !isTradeLicense)
        {
            errorTradeLicenseFile.show();
            isValid = false;
        }

        if(tradeLicenseNo == '' || tradeLicenseNo == 'undefined')
        {
            errorTradeLicenseNo.show();
            isValid = false;
        }

        if(tradeLicenseExpDate == '' || tradeLicenseExpDate == 'undefined')
        {
            errorTradeLicenseExpDate.show();
            isValid = false;
        }

        if(isValid == true)
        {
            // Create an FormData object
            let data = new FormData($(clickedElement)[0]);

            $.ajax({
                url: "/distributors/update/company-information",
                type: 'POST',
                processData: false,
                contentType: false,
                data: data,
                dataType: 'json',
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
                    self.isLoading(false);
                    self.getFlash(response.message);

                    if(response.logo != null && response.logo != '')
                    {
                        $('#logo_img').attr('src', '/images/logos/' + response.logo);
                    }

                    if(
                        tradeLicenseFile != '' ||
                        tradeLicenseNo != $.session.get('trade-license-no') ||
                        tradeLicenseExpDate != $.session.get('trade-license-exp')
                    )
                    {
                        location.reload(true);
                    }
                }
            });
        }
    }

    // About
    onClickAbout(e)
    {
        e.preventDefault();
        this.getAbout();
    }

    getAbout()
    {
        let self = this;

        $.ajax({
            url: "/distributors/get/about",
            type: 'POST',
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
                if ($.inArray(15, self.permissions) !== -1)
                {
                    $('#distributor_container').empty().append(response);
                    self.isLoading(false);
                    self.iniTinyMce();
                }
                else
                {
                    self.accessDenied.show();
                    self.isLoading(false);
                }
            }
        });

        $('.distributor-right-col').animate ({scrollTop:0}, 200);
        window.history.pushState(null, "Fluid", '/distributors/about');
    }

    onSubmitAbout(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let isValid = true;
        let aboutUs = $('#about_us').val();
        let errorAboutUs = $('#error_about_us');
        let data = new FormData($(clickedElement)[0]);

        errorAboutUs.hide();

        if(aboutUs == '' || aboutUs == 'undefined')
        {
            errorAboutUs.show();
            isValid = false;
        }

        if(isValid == true)
        {
            $.ajax({
                url: "/distributors/update/about_us",
                type: 'POST',
                processData: false,
                contentType: false,
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
                    self.isLoading(false);
                    self.getFlash(response);
                }
            });
        }
    }

    onClickOperatingHours(e)
    {
        e.preventDefault();
        this.getOperatingHours();
    }

    getOperatingHours()
    {
        let self = this;

        $.ajax({
            url: "/distributors/get/operating-hours",
            type: 'POST',
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
                if ($.inArray(16, self.permissions) !== -1)
                {
                    $('#distributor_container').empty().append(response);
                    self.isLoading(false);
                    self.iniTinyMce();
                }
                else
                {
                    self.accessDenied.show();
                    self.isLoading(false);
                }
            }
        });

        $('.distributor-right-col').animate ({scrollTop:0}, 200);
        window.history.pushState(null, "Fluid", '/distributors/operating-hours');
    }

    onSubmitOperatingHours(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let isValid = true;
        let operatingHours = $('#operating_hours').val();
        let errorOperatingHours = $('#error_operating_hours');
        let data = new FormData($(clickedElement)[0]);

        errorOperatingHours.hide();

        if(operatingHours == '' || operatingHours == 'undefined')
        {
            errorOperatingHours.show();
            isValid = false;
        }

        if(isValid == true)
        {
            $.ajax({
                url: "/distributors/update/operating_hours",
                type: 'POST',
                processData: false,
                contentType: false,
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
                    self.isLoading(false);
                    self.getFlash(response);
                }
            });
        }
    }

    onClickRefundPolicy(e)
    {
        e.preventDefault();
        this.getRefundPolicy();
    }

    onSubmitRefundPolicy(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let isValid = true;
        let refundPolicy = $('#refund_policy').val();
        let errorrefundPolicy = $('#error_refund_policy');
        let data = new FormData($(clickedElement)[0]);

        errorrefundPolicy.hide();

        if(refundPolicy == '' || refundPolicy == 'undefined')
        {
            errorrefundPolicy.show();
            isValid = false;
        }

        if(isValid == true)
        {
            $.ajax({
                url: "/distributors/update/refund_policy",
                type: 'POST',
                processData: false,
                contentType: false,
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
                    self.isLoading(false);
                    self.getFlash(response);
                }
            });
        }
    }

    getRefundPolicy()
    {
        let self = this;

        $.ajax({
            url: "/distributors/get/refund-policy",
            type: 'POST',
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
                if ($.inArray(16, self.permissions) !== -1)
                {
                    $('#distributor_container').empty().append(response);
                    self.isLoading(false);
                    self.iniTinyMce();
                }
                else
                {
                    self.accessDenied.show();
                    self.isLoading(false);
                }
            }
        });

        $('.distributor-right-col').animate ({scrollTop:0}, 200);
        window.history.pushState(null, "Fluid", '/distributors/refund-policy');
    }

    onClickSalesTaxPolicy(e)
    {
        e.preventDefault();
        this.getSalesTaxPolicy();
    }

    getSalesTaxPolicy()
    {
        let self = this;

        $.ajax({
            url: "/distributors/get/sales-tax-policy",
            type: 'POST',
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
                if ($.inArray(18, self.permissions) !== -1)
                {
                    $('#distributor_container').empty().append(response);
                    self.isLoading(false);
                    self.iniTinyMce();
                }
                else
                {
                    self.accessDenied.show();
                    self.isLoading(false);
                }
            }
        });

        $('.distributor-right-col').animate ({scrollTop:0}, 200);
        window.history.pushState(null, "Fluid", '/distributors/sales-tax-policy');
    }

    onSubmitSalesTaxPolicy(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let isValid = true;
        let salesTaxPolicy = $('#sales_tax_policy').val();
        let errorSalesTaxPolicy = $('#error_sales_tax_policy');
        let data = new FormData($(clickedElement)[0]);

        errorSalesTaxPolicy.hide();

        if(salesTaxPolicy == '' || salesTaxPolicy == 'undefined')
        {
            errorSalesTaxPolicy.show();
            isValid = false;
        }

        if(isValid == true)
        {
            $.ajax({
                url: "/distributors/update/refund_policy",
                type: 'POST',
                processData: false,
                contentType: false,
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
                    self.isLoading(false);
                    self.getFlash(response);
                }
            });
        }
    }

    onClickShippingPolicy(e)
    {
        e.preventDefault();
        this.getShippingPolicy();
    }

    getShippingPolicy()
    {
        let self = this;

        $.ajax({
            url: "/distributors/get/shipping-policy",
            type: 'POST',
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
                if ($.inArray(19, self.permissions) !== -1)
                {
                    $('#distributor_container').empty().append(response);
                    self.isLoading(false);
                    self.iniTinyMce();
                }
                else
                {
                    self.accessDenied.show();
                    self.isLoading(false);
                }
            }
        });

        $('.distributor-right-col').animate ({scrollTop:0}, 200);
        window.history.pushState(null, "Fluid", '/distributors/shipping-policy');
    }

    onSubmitShippingPolicy(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let isValid = true;
        let shippingPolicy = $('#shipping_policy').val();
        let errorShippingPolicy = $('#error_shipping_policy');
        let data = new FormData($(clickedElement)[0]);

        errorShippingPolicy.hide();

        if(shippingPolicy == '' || shippingPolicy == 'undefined')
        {
            errorShippingPolicy.show();
            isValid = false;
        }

        if(isValid == true)
        {
            $.ajax({
                url: "/distributors/update/shipping_policy",
                type: 'POST',
                processData: false,
                contentType: false,
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
                    self.isLoading(false);
                    self.getFlash(response);
                }
            });
        }
    }

    iniTinyMce()
    {
        tinymce.init({
            selector: '.tinymce-selector',
            plugins: 'preview importcss searchreplace autolink autosave save directionality code visualblocks visualchars fullscreen image link media template codesample table charmap pagebreak nonbreaking anchor insertdatetime advlist lists wordcount help charmap quickbars emoticons',
            editimage_cors_hosts: ['picsum.photos'],
            menubar: false,
            toolbar: 'undo redo | bold italic underline strikethrough | fontsize blocks | alignleft aligncenter alignright alignjustify | outdent indent |  numlist bullist removeformat',
            toolbar_sticky: false,
            statusbar: false,
            height: 300,
            image_caption: true,
            quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote quickimage quicktable',
            noneditable_class: 'mceNonEditable',
            toolbar_mode: 'sliding',
            contextmenu: 'link image table',
            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:16px }'
        });

        $('.tox-notifications-container').remove();
    }

    initIntlTel()
    {
        let input = document.querySelector('#mobile');
        let iti = window.intlTelInput(input, {
            preferredCountries: ['ae', 'qa', 'bh', 'om', 'sa'],
            autoPlaceholder: "polite",
            nationalMode: true,
            separateDialCode: true,
            utilsScript: "/js/utils.js",
        });

        return iti;
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