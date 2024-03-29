import { Controller } from '@hotwired/stimulus';

export default class extends Controller {

    error_page;

    connect()
    {
        this.error_page = '/clinics/error';
        let uri = window.location.pathname;
        let isManageInventory = uri.match('/clinics/manage-inventory');

        if(isManageInventory != null)
        {
            this.getManageInventory();
        }
    }

    onClickInventoryLink(e)
    {
        e.preventDefault();

        this.getManageInventory();
    }

    onClickSearchInventory(e)
    {
        e.preventDefault();

        let text = '';
        let clickedElement = e.currentTarget;

        if($(clickedElement).find('i').hasClass('fa-magnifying-glass-plus'))
        {
            text = '<i class="fa-regular fa-magnifying-glass-minus me-2 mb-3"></i> Search Inventory';
        }
        else
        if($(clickedElement).find('i').hasClass('fa-magnifying-glass-minus'))
        {
            text = '<i class="fa-regular fa-magnifying-glass-plus me-2 mb-3"></i> Search Inventory';
        }

        $('#btn_search_inventory').empty().append(text);
        $('#btn_search_inventory').empty().append(text);
        $('#inventory_attach_container').slideToggle(700);
    }

    onKeyUpSearchField(e)
    {
        let clickedElement = e.currentTarget;

        $.ajax({
            type: "POST",
            url: "/clinics/inventory-search-list",
            data:'keywords='+$(clickedElement).val(),
            success: function(response)
            {
                $("#suggestion_field").show();
                $("#suggestion_field").html(response);
            }
        });
    }

    onClickSearchItem(e)
    {
        let clickedElement = e.currentTarget;
        let productId = $(clickedElement).attr('data-product-id');
        let productName = $(clickedElement).attr('data-product-name');

        $('.clear-search').removeClass('hidden');
        $('.search-div').removeClass('col-12').addClass('col-11');

        this.selectProductListItem(productId, productName);
    }

    onChangeDistributorSelect(e)
    {
        let clickedElement = e.currentTarget;
        let distributorId = $(clickedElement).val();
        let productId = $('#product_id').val();

        $.ajax({
            type: "POST",
            url: "/clinics/get-distributor-product",
            data:{
                'product-id': productId,
                'distributor-id': distributorId,
            },
            success: function(response)
            {
                $("#sku").val(response.sku);
                $("#cost_price").val(response.price);
            }
        });
    }

    onClickSaveInventory(e)
    {
        e.preventDefault();

        let self = this;
        let isValid = true;
        let productId = $('#product_id').val();
        let listId = $('#btn_inventory').attr('data-list-id');
        let distributorId = $('#distributor_id').val();
        let unitPrice = $('#your_price').val();
        let errorDistributorId = $('#error_distributor_id');
        let errorUnitPrice = $('#error_your_price');
        let favourite = false;
        let retail = true;

        errorDistributorId.hide();
        errorUnitPrice.hide();

        if(distributorId == '' || distributorId == 'undefined')
        {
            errorDistributorId.show();
            isValid = false;
        }

        if(unitPrice == '' || unitPrice == 'undefined')
        {
            errorUnitPrice.show();
            isValid = false;
        }

        if(isValid)
        {
            $.ajax({
                url: "/clinics/inventory/manage-list",
                type: 'POST',
                dataType: 'json',
                data: {
                    'product-id': productId,
                    'list-id': listId,
                    'distributor-id': distributorId,
                    'favourite': favourite,
                    'retail': retail,
                    'unit-price': unitPrice,
                    'return': 'list',
                },
                beforeSend: function ()
                {
                    self.isLoading(true);
                },
                complete: function(e)
                {
                    if(e.status === 500)
                    {
                        window.location.href = self.error_page;
                    }
                },
                success: function (response)
                {
                    self.getFlash(response.flash);
                    $('#inventory_list').empty().append(response.html);
                    $('#inventory_item').slideUp(700);
                    $('#inventory_attach_container').slideUp(700);
                    $('#search_inventory_field').val('');
                    $('.fa-magnifying-glass-minus').addClass('fa-magnifying-glass-plus').removeClass('fa-magnifying-glass-minus');
                    self.isLoading(false);
                    self.popOver();
                }
            });
        }
    }

    onClickResetSearch(e)
    {
        e.preventDefault();

        $('.form-control').val('');
        $('#product_id').val('');

        $('#search_field').val('');
        $('#product_name').empty().append('Manage Your Inventory');
        $('#inventory_item').slideUp(700);
        $('#inventory_btn').hide();
    }

    onClickEditIcon(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let id = $(clickedElement).attr('data-product-id');
        let name = $(clickedElement).attr('data-product-name');

        $.ajax({
            type: "POST",
            url: "/clinics/inventory-get-data",
            data: {
                'product-id': id,
            },
            success: function (response)
            {
                $("#suggestion_field").show();
                $("#suggestion_field").html(response);
                $('#product_id').val(id);
                $('#distributor_id').empty().append(response.distributors);
                $('option[value="'+ response.distributorId +'"]').prop("selected", true);
                $('#unit').val(response.unit);
                $('#sku').val(response.sku);
                $('#cost_price').val(response.costPrice);
                $('#your_price').val(response.unitPrice);
                $('#dosage').val(response.dosage);
                $('#size').val(response.size);
                $('#active_ingredient').val(response.activeIngredient);
                $('#product_name').empty();
                $('#product_name').append(name + response.dosage + response.unit + response.size);
                $('#inventory_item').slideDown(700);

                $("#search_inventory_field").val(name);
                $("#suggestion_field").hide();

                $('#inventory_attach_container').slideDown('700');
                window.scrollTo(0, 0);
            }
        });
    }

    onClickAddToRetailList(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let productId = $(clickedElement).data("product-id");
        let listId = $(clickedElement).data("list-id");
        let retail = $(clickedElement).attr('data-retail');

        if(retail == 'false')
        {
            $.ajax({
                async: "true",
                url: "/clinics/inventory/get-list-modal",
                type: 'POST',
                cache: false,
                timeout: 600000,
                dataType: 'json',
                data:
                    {
                        'product-id': productId,
                        'list-id': listId,
                        'retail': true,
                    },
                success: function (response)
                {
                    $('#modal_list_distributors').remove();
                    $('#clinic_container').append(response);
                    $('#modal_list_distributors').modal('toggle');
                    $('#save_list_distributor').attr('data-retail','true');
                    $('body').css('overflow', '');
                }
            });
        }
        else
        {
            let distributorId = $(clickedElement).data('distributor-id');

            $.ajax({
                async: "true",
                url: "/clinics/inventory/manage-list",
                type: 'POST',
                cache: false,
                timeout: 600000,
                dataType: 'json',
                data:
                    {
                        'product-id': productId,
                        'list-id': listId,
                        'distributor-id': distributorId,
                        'favourite': false,
                        'retail': retail,
                        'delete': true,
                        'return': '',
                    },
                success: function (response)
                {
                    $('#retail_'+ productId).removeClass('text-danger').addClass('icon-unchecked')
                        .attr('data-retail', false).removeAttr('data-distributor-id');
                }
            });
        }
    }

    onClickDelete(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let distributorId = $(clickedElement).attr('data-distributor-id');
        let productId = $(clickedElement).attr('data-clinic-product-id');
        let listId = $(clickedElement).attr('data-list-id');

        $.ajax({
            async: "true",
            url: "/clinics/inventory/manage-list",
            type: 'POST',
            cache: false,
            timeout: 600000,
            dataType: 'json',
            data:
                {
                    'product-id': productId,
                    'list-id': listId,
                    'distributor-id': distributorId,
                    'favourite': false,
                    'retail': true,
                    'delete': true,
                    'return': 'list',
                },
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            success: function (response)
            {
                $('#clinic_product_'+ productId).remove();
                $('#inventory_list').empty().append(response.html);
                self.isLoading(false);
                popOver();
            }
        });
    }

    onClickPagination(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let pageId = $(clickedElement).attr('data-page-id');

        this.getManageInventory(pageId);
    }

    getManageInventory(pageId = 1)
    {
        let self = this;

        $.ajax({
            async: "true",
            url: "/clinics/ajax-manage-inventory",
            type: 'POST',
            dataType: 'json',
            data: {
                'page-id': pageId,
            },
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            complete: function(e)
            {
                if(e.status === 500)
                {
                    //window.location.href = self.error_page;
                }
            },
            success: function (response)
            {
                $('#clinic_container').empty().append(response).show();
                $('#clinic_container').append(response.pagination);
                window.scrollTo(0,0);
                self.isLoading(false);
                window.history.pushState(null, "Fluid", '/clinics/manage-inventory');
                self.popOver();
            }
        });
    }

    onChangeFilterSelect(e)
    {
        let self = this;
        let manufacturerId = $('#manufacturer_id').val() ? $('#manufacturer_id').val() : 0;
        let speciesId = $('#species_id').val() ? $('#species_id').val() : 0;

        if(manufacturerId > 0 || speciesId > 0)
        {
            $.ajax({
                url: "/clinics/inventory/list/filter",
                type: 'POST',
                dataType: 'json',
                data: {
                    'manufacturer-id': manufacturerId,
                    'species-id': speciesId,
                },
                beforeSend: function () {

                    self.isLoading(true);
                },
                success: function (response) {

                    $('#inventory_list').empty().append(response);
                    $('#filter_reset').show();
                    self.isLoading(false);
                    self.popOver();
                }
            });
        }
    }

    onClickResetFilter(e)
    {
        e.preventDefault();

        this.getManageInventory();
        $(e.currentTarget).hide();
    }

    selectProductListItem(id, name)
    {
        if (id > 0)
        {
            $.ajax({
                type: "POST",
                url: "/clinics/inventory-get-data",
                data: {
                    'product-id': id,
                },
                success: function (response)
                {
                    $("#suggestion_field").show();
                    $("#suggestion_field").html(response);
                    $('#product_id').val(id);
                    $('#distributor_id').empty().append(response.distributors);
                    $('option[value="'+ response.distributorId +'"]').prop("selected", true);
                    $('#unit').val(response.unit);
                    $('#sku').val(response.sku);
                    $('#cost_price').val(response.costPrice);
                    $('#your_price').val(response.unitPrice);
                    $('#dosage').val(response.dosage);
                    $('#size').val(response.size);
                    $('#active_ingredient').val(response.activeIngredient);
                    $('#product_name').empty();
                    $('#product_name').append(name + response.dosage + response.unit + response.size);
                    $('#inventory_item').slideDown(700);
                }
            });

            $("#search_inventory_field").val(name);
            $("#suggestion_field").hide();
        }
    }

    popOver()
    {
        var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
        var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl)
        })
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