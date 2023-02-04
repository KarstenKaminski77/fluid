import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    connect()
    {
        let uri = window.location.pathname;
        let isAccountSettings = uri.match('/clinics/account');

        if(isAccountSettings != null)
        {
            this.getAccountSettings();
        }
    }

    getAccountSettings()
    {
        let self = this;

        $.ajax({
            async: "true",
            url: '/clinics/get-company-information',
            type: 'GET',
            cache: false,
            timeout: 600000,
            dataType: 'json',
            data: {
                permissions: $.session.get('permissions'),
            },
            beforeSend: function ()
            {
                self.isLoading(true)
            },
            complete: function(e)
            {
                if(e.status === 500)
                {
                    //window.location.href = '/clinics/error';
                }
            },
            success: function (response)
            {
                $('#clinic_container').empty().append(response).show();
                window.scrollTo(0,0);
                //clearInterval(get_messages);
                self.isLoading(false);
                window.history.pushState(null, "Fluid", '/clinics/account');

                // International Numbers
                let input = document.querySelector('#mobile');
                let isoCode = $('#isocode').val();

                let iti = window.intlTelInput(input, {
                    initialCountry: isoCode,
                    preferredCountries: ['ae','qa', 'bh', 'om', 'sa'],
                    autoPlaceholder: "polite",
                    nationalMode: true,
                    separateDialCode: true,
                    utilsScript: "/js/utils.js",
                });

                let handleChange = function() {
                    let mobile = $('#clinic_telephone');
                    let mobile_number = (iti.isValidNumber()) ? iti.getNumber() : false;
                    let textNode = document.createTextNode(mobile_number);

                    if(mobile_number != false)
                    {
                        mobile.val(mobile_number.substring(1));
                    }
                };

                // listen to "keyup", but also "change" to update when the user selects a country
                input.addEventListener('change', handleChange);
                input.addEventListener('keyup', handleChange);
            }
        });
    }

    onClickAccountSettingsLink(e)
    {
        e.preventDefault();
        this.getAccountSettings();
    }

    onSubmitClinicInformation(e)
    {
        e.preventDefault();

        let self = this;
        let isValid = true;
        let clinicName = $('#clinic_name').val()
        let clinicEmail = $('#clinic_email').val();
        let clinicTelephone = $('#clinic_telephone').val();
        let managerFirstName = $('#manager_first_name').val();
        let managerLastName = $('#manager_last_name').val();
        let managerIdNo = $('#manager_id_no').val();
        let managerIdExpDate = $('#manager_id_exp_date').val();
        let tradeLicenseFile = $('#trade_license_file').val();
        let tradeLicenseNo = $('#trade_license_no').val();
        let tradeLicenseExpDate = $('#trade_license_exp_date').val();
        let errorClinicName = $('#error_clinic_name');
        let errorClinicEmail = $('#error_clinic_email');
        let errorClinicTelephone = $('#error_clinic_telephone');
        let errorManagerFirstName = $('#error_manager_first_name');
        let errorManagerLastName = $('#error_manager_last_name');
        let errorManagerIdNo = $('#error_manager_id_no');
        let errorManagerIdExpDate = $('#error_manager_id_exp_date');
        let errorTradeLicenseFile = $('#error_trade_license_file');
        let errorTradeLicenseNo = $('#error_trade_license_no');
        let errorTradeLicenseExpDate = $('#error_trade_license_exp_date');
        let isTradeLicense = '{{ clinic.tradeLicense }}' ? '{{ clinic.tradeLicense }}' : false;

        errorClinicName.hide();
        errorClinicEmail.hide();
        errorClinicTelephone.hide();
        errorManagerFirstName.hide();
        errorManagerLastName.hide();
        errorManagerIdNo.hide();
        errorManagerIdExpDate.hide();
        errorTradeLicenseNo.hide();
        errorTradeLicenseExpDate.hide();

        if(isTradeLicense)
        {
            errorTradeLicenseFile.hide();
        }

        if(clinicName == '' || clinicName == 'undefined')
        {
            errorClinicName.show();
            isValid = false;
        }

        if(clinicEmail == '' || clinicEmail == 'undefined')
        {
            errorClinicEmail.show();
            isValid = false;
        }

        if(clinicTelephone == '' || clinicTelephone == 'undefined')
        {
            errorClinicTelephone.show();
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
            let iti = window.intlTelInput(input, {
                preferredCountries: ['ae','qa', 'bh', 'om', 'sa'],
                autoPlaceholder: "polite",
                nationalMode: true,
                separateDialCode: true,
                utilsScript: "/js/utils.js",
            });

            let iso = iti.getSelectedCountryData().iso2;
            let intlCode = iti.getSelectedCountryData().dialCode

            $('<input />').attr('type', 'hidden').attr('name', 'clinic_form[iso-code]')
                .attr('value', iso).appendTo('#form_clinic_information');
            $('<input />').attr('type', 'hidden').attr('name', 'clinic_form[intl-code]')
                .attr('value', intlCode).appendTo('#form_clinic_information');

            let data = new FormData($(this.element).find('#form_clinic_information')[0]);

            $.ajax({
                async: "true",
                url: "/clinics/update/company-information",
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
                    self.getFlash(response);
                    self.isLoading(false);

                    if(tradeLicenseFile != '')
                    {
                        location.reload(true);
                    }
                }
            });
        }
    }

    onChangeTradeLicenseFile()
    {
        let fp = $("#trade_license_file");
        let lg = fp[0].files.length; // get length
        let items = fp[0].files;
        let errorTradeLicense = $('#error_trade_license_file');
        let fileName = '';
        let fileSize = '';
        let fileType = '';

        errorTradeLicense.hide().append('Required Field');

        if (lg > 0) {
            for (let i = 0; i < lg; i++)
            {
                fileName = items[i].name; // get file name
                fileSize = items[i].size; // get file size
                fileType = items[i].type; // get file type
            }
        }

        if(fileType != 'application/pdf')
        {
            fp.val('');
            errorTradeLicense.empty().append('Please select a PDF document').show();
        }
    }

    onClickTabCompanyInformation()
    {
        $('.active').removeClass('active');
        $('#company_information_tab').find('span:first-child').addClass('active');
        $('#company_information_panel').slideDown(700);
        $('#about_panel').slideUp(700);
        $('#operating_hours_panel').slideUp(700);
        $('#refund_policy_panel').slideUp(700);
        $('#sales_tax_policy_panel').slideUp(700);
        $('#shipping_policy_panel').slideUp(700);
    }

    onClickTabAbout()
    {
        $('.active').removeClass('active');
        $('#about_tab').find('span:first-child').addClass('active');
        $('#company_information_panel').slideUp(700);
        $('#about_panel').slideDown(700);
        $('#operating_hours_panel').slideUp(700);
        $('#refund_policy_panel').slideUp(700);
        $('#sales_tax_policy_panel').slideUp(700);
        $('#shipping_policy_panel').slideUp(700);

        this.iniTinyMce();
    }

    onSubmitFormAbout(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let about = $('#about_copy').val();
        let errorAbout = $('#error_about_copy');
        let isValid = true;
        let data = new FormData($(this.element).find('#form_about')[0]);

        errorAbout.hide();

        if(about == '' || about == 'undefined')
        {
            errorAbout.show();
            isValid = false;
        }

        if(isValid)
        {
            $.ajax({
                async: "true",
                url: "/clinics/update/copy",
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
                        window.location.href = '/clinics/error';
                    }
                },
                success: function (response)
                {
                    self.isLoading(false);
                    self.getFlash(response.flash);
                }
            });
        }
    }

    onClickTabOperatingHours()
    {
        $('.active').removeClass('active');
        $('#operating_hours_tab').find('span:first-child').addClass('active');
        $('#company_information_panel').slideUp(700);
        $('#about_panel').slideUp(700);
        $('#operating_hours_panel').slideDown(700);
        $('#refund_policy_panel').slideUp(700);
        $('#sales_tax_policy_panel').slideUp(700);
        $('#shipping_policy_panel').slideUp(700);

        this.iniTinyMce();
    }

    onSubmitOperatingHours(e)
    {
        let self = this;
        e.preventDefault();

        let operatingHours = $('#operating_hours_copy').val();
        let errorOperatingHours = $('#error_operating_hours_copy');
        let isValid = true;
        let data = new FormData($(this.element).find('#form_operating_hours')[0]);

        errorOperatingHours.hide();

        if(operatingHours == '' || operatingHours == 'undefined')
        {
            errorOperatingHours.show();
            isValid = false;
        }

        if(isValid)
        {
            $.ajax({
                async: "true",
                url: "/clinics/update/copy",
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
                        window.location.href = '/clinics/error';
                    }
                },
                success: function (response)
                {
                    self.isLoading(false);
                    self.getFlash(response.flash);
                }
            });
        }
    }

    onClickTabRefundPolicy()
    {
        $('.active').removeClass('active');
        $('#refund_policy_tab').find('span:first-child').addClass('active');
        $('#company_information_panel').slideUp(700);
        $('#about_panel').slideUp(700);
        $('#operating_hours_panel').slideUp(700);
        $('#refund_policy_panel').slideDown(700);
        $('#sales_tax_policy_panel').slideUp(700);
        $('#shipping_policy_panel').slideUp(700);

        this.iniTinyMce();
    }

    onSubmitRefundPolicy(e)
    {
        e.preventDefault();

        let self = this;
        let refundPolicy = $('#refund_policy_copy').val();
        let errorRefundPolicy = $('#error_refund_policy_copy');
        let isValid = true;
        let data = new FormData($(this.element).find('#form_refund_policy')[0]);

        errorRefundPolicy.hide();

        if(refundPolicy == '' || refundPolicy == 'undefined')
        {
            errorRefundPolicy.show();
            isValid = false;
        }

        if(isValid)
        {
            $.ajax({
                async: "true",
                url: "/clinics/update/copy",
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
                        window.location.href = '/clinics/error';
                    }
                },
                success: function (response)
                {
                    self.isLoading(false);
                    self.getFlash(response.flash);
                }
            });
        }
    }

    onClickTabSalesTaxPolicy()
    {
        $('.active').removeClass('active');
        $('#sales_tax_policy_tab').find('span:first-child').addClass('active');
        $('#company_information_panel').slideUp(700);
        $('#about_panel').slideUp(700);
        $('#operating_hours_panel').slideUp(700);
        $('#refund_policy_panel').slideUp(700);
        $('#sales_tax_policy_panel').slideDown(700);
        $('#shipping_policy_panel').slideUp(700);

        this.iniTinyMce();
    }

    onSubmitSalesTaxPolicy(e)
    {
        e.preventDefault();

        let self = this;
        let salesTaxPolicy = $('#sales_tax_policy_copy').val();
        let errorSalesTaxPolicy = $('#error_sales_tax_policy_copy');
        let isValid = true;
        let data = new FormData($(this.element).find('#form_sales_tax_policy')[0]);

        errorSalesTaxPolicy.hide();

        if(salesTaxPolicy == '' || salesTaxPolicy == 'undefined')
        {
            errorSalesTaxPolicy.show();
            isValid = false;
        }

        if(isValid)
        {
            $.ajax({
                async: "true",
                url: "/clinics/update/copy",
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
                        window.location.href = '/clinics/error';
                    }
                },
                success: function (response)
                {
                    self.isLoading(false);
                    self.getFlash(response.flash);
                }
            });
        }
    }

    onClickTabShippingPolicy()
    {
        $('.active').removeClass('active');
        $('#shipping_policy_tab').find('span:first-child').addClass('active');
        $('#company_information_panel').slideUp(700);
        $('#about_panel').slideUp(700);
        $('#operating_hours_panel').slideUp(700);
        $('#refund_policy_panel').slideUp(700);
        $('#sales_tax_policy_panel').slideUp(700);
        $('#shipping_policy_panel').slideDown(700);

        this.iniTinyMce();
    }

    onSubmitShippingPolicy(e)
    {
        e.preventDefault();

        let self = this;
        let shippingPolicy = $('#shipping_policy_copy').val();
        let errorShippingPolicy = $('#error_shipping_policy_copy');
        let isValid = true;
        let data = new FormData($(this.element).find('#form_shipping_policy')[0]);

        errorShippingPolicy.hide();

        if(shippingPolicy == '' || shippingPolicy == 'undefined')
        {
            errorShippingPolicy.show();
            isValid = false;
        }

        if(isValid)
        {
            $.ajax({
                async: "true",
                url: "/clinics/update/copy",
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
                        window.location.href = '/clinics/error';
                    }
                },
                success: function (response)
                {
                    self.isLoading(false);
                    self.getFlash(response.flash);
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

    hidePaginator()
    {
        $('#paginator').empty().hide();
    }
}