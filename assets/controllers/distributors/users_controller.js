import { Controller } from '@hotwired/stimulus';
import intlTelInput from 'intl-tel-input';
import modal from "bootstrap/js/src/modal";

export default class extends Controller
{
    iti;
    isoCode;
    errorPage = '/distributors/error';

    connect()
    {
        let uri = window.location.pathname;
        let isUsers = uri.match('/distributors/users');

        if(isUsers != null) {

            this.getUsers(1);
        }
    }

    onClickUsers(e)
    {
        e.preventDefault();
        this.getUsers(1);
    }

    onClickEdit(e)
    {
        $('#create_user').empty().append('UPDATE USER');

        let self = this;
        let clickedElement = e.currentTarget;
        let userId = $(clickedElement).data('user-id');
        let firstName = $('#user_first_name');
        let lastName = $('#user_last_name');
        let email = $('#user_email');
        let telephone = $('#user_telephone');
        let mobile = $('#user_mobile');
        let position = $('#user_position');
        let isoCode = $('#user_iso_code');
        let intlCode = $('#user_intl_code');

        firstName.val('');
        lastName.val('');
        email.val('');
        telephone.val('');
        mobile.val('');
        position.val('');
        isoCode.val('');
        intlCode.val('');

        $.ajax({
            url: "/distributors/get-user",
            type: 'POST',
            data: {
                'id': userId
            },
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            success: function (response)
            {
                firstName.val(response.first_name);
                lastName.val(response.last_name);
                email.val(response.email);
                telephone.val(response.telephone);
                mobile.val(response.telephone);
                position.val(response.position);
                isoCode.val(response.iso_code);
                intlCode.val(response.intl_code);

                if(typeof self.iti !== 'undefined')
                {
                    self.iti.destroy();
                }
                self.isoCode = response.iso_code;
                self.iti = self.initIntlTel();
                self.isLoading(false);

                $('#form_users input[type="checkbox"]').attr('checked', false);

                for(let i = 0; i < response.user_permissions.length; i++)
                {
                    $('#permission_'+ response.user_permissions[i]).attr('checked', true);
                };

                $('.modal-backdrop:first').remove();
            }
        });

        $('#user_id').val(userId);
        $('#user_modal_label').empty().append('Update a User');
    }

    onClickCreate()
    {
        $('.modal-backdrop:first').remove();
        $('#create_user').empty().append('CREATE USER');
        $('#user_modal_label').empty().append('Create a User');
        $('#user_id').val(0);
        $('#user_first_name').val('');
        $('#user_last_name').val('');
        $('#user_email').val('');
        $('#user_mobile').val('');
        $('#user_telephone').val('');
        $('#user_iso_code').val('');
        $('#user_intl_code').val('');
        $('#user_position').val('');

        $('.form-check-input').each(function () {

            $(this).attr('checked', false);
        });

        let input = document.querySelector("#user_mobile");

        this.iti = this.initIntlTel();
    }

    onKeyUpMobile(e)
    {
        let input = document.querySelector("#user_mobile");
        let iti = this.iti;

        let handleChange = function() {
            let mobile = $('#user_telephone');
            let mobile_number = (iti.isValidNumber()) ? iti.getNumber() : false;
            let textNode = document.createTextNode(mobile_number);

            if(mobile_number != false)
            {
                $('#user_telephone').val('');
                $('#user_iso_code').val('');
                $('#user_intl_code').val('');

                let isoCode = iti.getSelectedCountryData().iso2;
                let intlCode = iti.getSelectedCountryData().dialCode;

                mobile.val(mobile_number.substring(1));
                $('#user_iso_code').val(isoCode);
                $('#user_intl_code').val(intlCode);
            }
        };

        // listen to "keyup", but also "change" to update when the user selects a country
        input.addEventListener('change', handleChange);
        input.addEventListener('keyup', handleChange);
    }

    getUsers(pageId)
    {
        let self = this;

        $.ajax({
            url: "/distributors/get/users-list",
            type: 'POST',
            dataType: 'json',
            data: {
              'page-id': pageId,
            },
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            success: function (response)
            {
                $('#distributor_container').empty().append(response);
                self.isLoading(false);
            }
        });
        self.isLoading(false);
        $('.distributor-right-col').animate ({scrollTop:0}, 200);
        window.history.pushState(null, "Fluid", '/distributors/users');
    }

    onSubmitUser(e)
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
        let errorUserFirstName = $('#error_user_first_name');
        let errorUserLastName = $('#error_user_last_name');
        let errorUserEmail = $('#error_user_email');
        let errorUserTelephone = $('#error_user_telephone');
        let data = new FormData($(clickedElement)[0]);

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
            $("<input />").attr("type", "hidden").attr("name", "page_id").attr("value", $('#page_id').val()).appendTo("#form_users");

            $.ajax({
                url: "/distributors/manage-users",
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
                    if (response.response)
                    {
                        $('#modal_user').modal('toggle');
                        self.isLoading(false);
                        self.getFlash(response.message);
                        self.getUsers();

                    } else {

                        $('#error_user_email').empty();
                        $('#error_user_email').append('Email address exists.');
                        $('#error_user_email').show();
                        $('#create_user').empty().append('SAVE').attr('disabled', false);
                    }
                }
            });
        }
    }

    onClickDeleteIcon(e)
    {
        let clickedElement = e.currentTarget;

        $('#delete_user').attr('data-user-id', $(clickedElement).data('user-id'));
        $('.modal-backdrop:first').remove();
    }

    onClickDelete(e)
    {
        let self = this;
        let clickedelement = e.currentTarget;
        let userId = $(clickedelement).attr('data-user-id');

        $.ajax({
            url: "/distributors/user/delete",
            type: 'POST',
            data: {
                'id': userId
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
                self.getFlash(response);
                self.isLoading(false);
                $('#modal_user_delete').modal('hide');
                self.getUsers();
            }
        });
    }

    onClickPagintion(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let pageId = $(clickedElement).data('page-id');

        $.ajax({
            url: "/distributors/get/users-list",
            type: 'POST',
            dataType: 'json',
            data: {
                'page-id': pageId,
            },
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            success: function (response)
            {
                $('#distributor_container').empty().append(response);
                self.isLoading(false);
            }
        });
    }

    initIntlTel()
    {
        let isoCode = this.isoCode ? this.isoCode : 'za';
        let input = document.querySelector('#user_mobile');
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