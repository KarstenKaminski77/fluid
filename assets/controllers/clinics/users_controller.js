import { Controller } from '@hotwired/stimulus';
import intlTelInput from 'intl-tel-input';

export default class extends Controller
{
    iti;
    connect(e)
    {
        let uri = window.location.pathname;
        let isUsers = uri.match('/clinics/users');

        if(isUsers != null)
        {
            this.getUsers(1);
        }
    }

    onClickUsersLink(e)
    {
        e.preventDefault();

        this.getUsers(1);
    }

    getUsers(pageId)
    {
        let self = this;

        $.ajax({
            async: "true",
            url: '/clinics/get-clinic-users',
            type: 'POST',
            cache: false,
            timeout: 600000,
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
                    window.location.href = '/clinics/error';
                }
            },
            success: function (response)
            {
                $('#clinic_container').empty().removeClass('col-container').append(response.html).show();
                $('#clinic_container').append(response.pagination);
                window.scrollTo(0,0);
                //clearInterval(get_messages);
                self.isLoading(false);
                window.history.pushState(null, "Fluid", '/clinics/users');
                self.popOver();
            }
        });
    }

    onClickPagination(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let pageId = $(clickedElement).data('page-id');

        this.getUsers(pageId);
    }

    onClickEditUser(e)
    {
        $('#create_user').empty().append('UPDATE');

        let self = this;
        let clickedElement = e.currentTarget;
        let userId = $(clickedElement).data('user-id');
        let pageId = $(clickedElement).data('page-id');

        $('.modal-backdrop:first').remove();

        $.ajax({
            async: "true",
            url: "/clinics/get-user",
            type: 'POST',
            data: {
                id: userId
            },
            success: function (response) {

                $('#user_first_name').val(response.firstName);
                $('#user_last_name').val(response.lastName);
                $('#user_email').val(response.email);
                $('#user_telephone').val(response.telephone);
                $('#user_iso_code').val(response.isoCode);
                $('#user_intl_code').val(response.intlCode);
                $('#user_mobile').val(response.telephone);
                $('#user_position').val(response.position);
                $('#user_page_id').remove();
                $('#form_users input[type="checkbox"]').attr('checked', false);

                for(let i = 0; i < response.permissions.length; i++){

                    $('#permission_'+ response.permissions[i]).attr('checked', true);
                };

                $("<input />")
                    .attr("type", "hidden")
                    .attr("name", "pageId")
                    .attr("value", pageId)
                    .attr("id", 'user_page_id')
                    .appendTo("#form_users");

                let userTelephone = response.telephone;

                $('#telephone_container').empty();
                $('#telephone_container').append('<input type="text" id="user_mobile" placeholder="(123) 456-7890*" class="form-control" value="'+ userTelephone +'" data-action="keyup->clinics--users#onKeyUpMobile" autocomplete="off">')

                self.iti = self.initIntlTel(response.isoCode);
            }
        });

        $('#user_id').val(userId);
        $('#user_modal_label').empty().append('Update a User');
    }

    onClickNewUser(e)
    {
        $('#create_user').empty().append('CREATE');
        $('#user_modal_label').empty().append('Create a User');
        $('#user_id').val(0);
        $('#user_first_name').val('');
        $('#user_last_name').val('');
        $('#user_email').val('');
        $('#user_telephone').val('');
        $('#user_mobile').val('');
        $('#user_position').val('');
        $('#form_users input[type="checkbox"]').attr('checked', false);
        $('#telephone_container').empty();
        $('#telephone_container').append('<input type="text" id="user_mobile" placeholder="(123) 456-7890*" class="form-control" value="" data-action="keyup->clinics--users#onKeyUpMobile" autocomplete="off">');
        $('.modal-backdrop:first').remove();

        let isoCode = $('#user_iso_code').val() ? $('#user_iso_code').val() : 'za';
        this.iti = this.initIntlTel(isoCode);
    }

    onKeyUpMobile(e)
    {
        let input = document.querySelector("#user_mobile");
        let isoCode = $('#user_iso_code').val() ? $('#user_iso_code').val() : 'ae';
        let iti = this.iti;

        let handleChange = function() {
            let mobile = $('#user_telephone');
            let mobileNumber = (iti.isValidNumber()) ? iti.getNumber() : false;
            let textNode = document.createTextNode(mobileNumber);

            if(mobileNumber){

                $('#user_telephone').val('');
                $('#user_iso_code').val('');
                $('#user_intl_code').val('');

                let isoCode = iti.getSelectedCountryData().iso2;
                let intlCode = iti.getSelectedCountryData().dialCode;

                mobile.val(mobileNumber.substring(1));
                $('#user_iso_code').val(isoCode);
                $('#user_intl_code').val(intlCode);

            }
        };

        // listen to "keyup", but also "change" to update when the user selects a country
        input.addEventListener('change', handleChange);
        input.addEventListener('keyup', handleChange);
    }

    onSubmitUserForm(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let isValid = true;
        let userFirstName = $('#user_first_name').val()
        let userLastName = $('#user_last_name').val();
        let userEmail = $('#user_email').val();
        let userTelephone = $('#user_telephone').val();
        let userMobile = $('#user_mobile');
        let isoCode = $('#user_iso_code').val();
        let intlCode = $('#user_intl_code').val();
        let errorUserFirstName = $('#error_user_first_name');
        let errorUserLastName = $('#error_user_last_name');
        let errorUserEmail = $('#error_user_email');
        let errorUserTelephone = $('#error_user_telephone');

        errorUserFirstName.hide();
        errorUserLastName.hide();
        errorUserEmail.hide();
        errorUserTelephone.hide();

        if(userFirstName == '' || userFirstName == 'undefined')
        {
            errorUserFirstName.show();
            isValid = false;
        }

        if(userLastName == '' || userLastName == 'undefined')
        {
            errorUserLastName.show();
            isValid = false;
        }

        if(userEmail == '' || userEmail == 'undefined')
        {
            errorUserEmail.show();
            isValid = false;
        }

        if(userTelephone == '' || userTelephone == 'undefined')
        {
            errorUserTelephone.show();
            userMobile.val('');
            isValid = false;
        }

        if(isValid == true)
        {
            $("<input />")
                .attr("type", "hidden")
                .attr("name", "clinic_users_form[isoCode]")
                .attr("value", isoCode)
                .attr("id", 'user_iso_code')
                .appendTo("#form_users");

            $("<input />")
                .attr("type", "hidden")
                .attr("name", "clinic_users_form[intlCode]")
                .attr("value", intlCode)
                .attr("id", 'user_intl_code')
                .appendTo("#form_users");

            let data = new FormData($(clickedElement)[0]);

            $('#create_user').empty().attr('disabled', true).append('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> PROCESSING...');

            $.ajax({
                async: "true",
                url: "/clinics/get-users",
                type: 'POST',
                contentType: false,
                processData: false,
                cache: false,
                timeout: 600000,
                dataType: 'json',
                data: data,
                complete: function(e, xhr, settings)
                {
                    if(e.status === 500)
                    {
                        //window.location.href = '{{ path('clinic_error_500') }}';
                    }
                },
                success: function (response)
                {
                    if (response.response)
                    {
                        self.getFlash(response.message);
                        $('#modal_user').modal('toggle');
                        $('#modal_user').modal('hide');
                        $('.modal-backdrop').removeClass('modal-backdrop');
                        $('.fade').removeClass('fade');
                        $('#user_first_name').val('');
                        $('#user_last_name').val('');
                        $('#user_email').val('');
                        $('#user_telephone').val('');
                        $('#user_position').val('');
                        $('#create_user').empty().append('SAVE').attr('disabled', false);

                        self.getUsers(response.page_id);

                        let clearCss = setInterval(function () {
                            $('body').removeAttr('style');
                            clearInterval(clearCss);
                        }, 200);
                    }
                    else
                    {
                        $('#error_user_email').empty();
                        $('#error_user_email').append('Email address exists.');
                        $('#error_user_email').show();
                        $('#create_user').empty().append('SAVE').attr('disabled', false);
                    }
                }
            });
        }
    }

    onClickDeleteModal(e)
    {
        e.preventDefault();

        $('#delete_user').attr('data-user-id', $(e.currentTarget).attr('data-user-id'));
        $('.modal-backdrop:first').remove();
    }

    onClickDelete(e)
    {
        let self = this;
        let clickedElement = e.currentTarget;
        let userId = $(clickedElement).data('user-id');

        $.ajax({
            async: "true",
            url: "/clinics/user/delete",
            type: 'POST',
            data: {
                id: userId
            },
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            complete: function(e, xhr, settings)
            {
                if(e.status === 500)
                {
                    window.location.href = '/clinics/error';
                }
            },
            success: function (response)
            {
                self.getFlash(response);
                $('#flash').removeClass('hidden');
                $('#modal_user_delete').modal('toggle');
                $('#modal_user_delete').modal('hide');
                $('.modal-backdrop').removeClass('modal-backdrop');
                $('#modal_user_delete').addClass('fade');

                $.ajax({
                    async: "true",
                    url: "/clinics/users-refresh",
                    type: 'POST',
                    contentType: false,
                    processData: false,
                    cache: false,
                    timeout: 600000,
                    dataType: 'json',
                    success: function (response)
                    {
                        $('#clinic_container').empty().append(response);
                        self.isLoading(false);
                    }
                });
            }
        });
    }

    initIntlTel(isoCode)
    {
        let input = document.querySelector("#user_mobile");
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

    onBlurEmail()
    {
        let email = $('#user_email').val();
        let errorEmail = $('#error_user_email');

        errorEmail.hide();

        $.ajax({
            url: "/clinics/user/check-email",
            type: 'POST',
            dataType: 'json',
            data: {
                email: email
            },
            complete: function(e)
            {
                if(e.status === 500)
                {
                    window.location.href = '/clinics/error';
                }
            },
            success: function (response) {

                if(!response.response)
                {
                    if(response.restricted)
                    {
                        errorEmail.empty().append('Domain name is not allowed').show();

                    } else
                    {
                        errorEmail.empty().append('This email address is already in use').show();
                    }
                }
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

    popOver()
    {
        var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
        var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl)
        })
    }
}