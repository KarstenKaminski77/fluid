import { Controller } from '@hotwired/stimulus';

export default class extends Controller
{
    errorPage = '/distributors/error';

    connect()
    {
        let uri = window.location.pathname;
        let isCustomers = uri.match('/distributors/customers/1');

        if(isCustomers != null)
        {
            this.getCustomersList(1);
        }
    }

    getCustomersList(pageId)
    {
        let self = this;

        $.ajax({
            url: "/distributors/customers",
            type: 'POST',
            dataType: 'json',
            data: {
                'page-id': pageId
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
                $('#distributor_container').empty().append(response);
                $('.distributor-right-col').animate ({scrollTop:0}, 200);
                self.isLoading(false);

                window.history.pushState(null, "Fluid", '/distributors/customers/1');
            }
        });
    }

    onClickCustomersLink(e)
    {
        e.preventDefault();

        this.getCustomersList(1);
    }

    onClickModalCustomerConnect(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let clinicId = $(clickedElement).attr('data-clinic-id');
        let distributorId = $(clickedElement).attr('data-distributor-id');
        let clinic = $(clickedElement).attr('data-clinic');
        let customerId = $(clickedElement).attr('data-customer-id');

        $('.modal-backdrop:first').remove();
        $('#btn_save_customer_connect').attr('data-clinic-id', clinicId);
        $('#btn_save_customer_connect').attr('data-distributor-id', distributorId);
        $('#btn_save_customer_connect').attr('data-clinic-name', clinic);
        $('#connect_clinic_name').empty().append(clinic);
        $('#customer_id').val(customerId);
    }

    onClickSaveCustomerConnect(e)
    {
        let self = this;
        let clickedElement = e.currentTarget;
        let customerId = $('#customer_id').val();
        let clinicId = $(clickedElement).attr('data-clinic-id');
        let distributorId = $(clickedElement).attr('data-distributor-id');
        let errorCustomerId = $('#error_customer_id');
        let isValid = true;

        errorCustomerId.hide();

        if(customerId == '' || customerId == 'undefined')
        {
            errorCustomerId.show();
            isValid = false;
        }

        if(isValid)
        {
            $.ajax({
                url: "/distributors/activate/connection",
                type: 'POST',
                dataType: 'json',
                data: {
                    'customer-id': customerId,
                    'distributor-id': distributorId,
                    'clinic-id': clinicId
                },
                beforeSend: function ()
                {
                    self.isLoading(true);
                },
                success: function (response)
                {
                    self.getFlash(response);
                    self.isLoading(false);
                    $('#modal_connect_customer').modal('toggle');
                }
            });
        }
    }

    onClickIgnoreIcon(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let clinicId = $(clickedElement).attr('data-clinic-id');
        let distributorId = $(clickedElement).attr('data-distributor-id');
        let link = $(clickedElement);

        if((clinicId != '' || clinicId != 'undefined') && (distributorId != '' || distributorId != 'undefined'))
        {
            $.ajax({
                url: "/distributors/ignore-connection",
                type: 'POST',
                dataType: 'json',
                data: {
                    'distributor-id': distributorId,
                    'clinic-id': clinicId
                },
                beforeSend: function ()
                {
                    self.isLoading(true);
                },
                success: function (response)
                {
                    link.find('.fa-bell-slash').replaceWith(response.icon);

                    self.getFlash(response.flash);
                    self.isLoading(false);
                }
            });
        }
        else
        {
            self.getFlash('An Error Occurred', 'danger');
        }
    }

    onClickPagination(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let pageId = $(clickedElement).data('page-id');

        $.ajax({
            url: "/distributors/customers",
            type: 'POST',
            dataType: 'json',
            data: {
                'page-id': pageId
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