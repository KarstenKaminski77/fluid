import { Controller } from '@hotwired/stimulus';

export default class extends Controller
{
    permissions = JSON.parse($.session.get('permissions'));

    connect()
    {
        let uri = window.location.pathname;
        let isInventoryList = uri.match('/distributors/inventory/list');
        let isInventory = uri.match('/distributors/manage-inventory');

        if(isInventoryList != null)
        {
            this.getProductList();
        }

        if(isInventory != null) {

            this.getInventory();
        }
    }

    onClickInventoryList(e)
    {
        e.preventDefault();
        this.getProductList();
    }

    onClickPagination(e)
    {
        let clickedElement = e.currentTarget;
        let pageId = $(clickedElement).attr('data-page-id');

        this.getProductList(pageId);
    }

    onChangeFilter(e)
    {
        let self = this;
        let manufacturerId = $('#manufacturer_id').val() ? $('#manufacturer_id').val() : 0;
        let speciesId = $('#species_id').val() ? $('#species_id').val() : 0;

        if(manufacturerId > 0 || speciesId > 0)
        {
            $.ajax({
                url: "/distributors/get/product-list",
                type: 'POST',
                dataType: 'json',
                data: {
                    'manufacturer-id': manufacturerId,
                    'species-id': speciesId,
                },
                beforeSend: function ()
                {
                    self.isLoading(true);
                },
                success: function (response)
                {
                    $('#distributor_container').empty().append(response);
                    self.isLoading(false);
                    self.popOver();
                }
            });
        }
    }

    onClickDeleteIcon(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let distributorProductId = $(clickedElement).attr('data-distributor-product-id');
        let deleteBtn = $('#delete_product');

        $('.modal-backdrop:first').remove();
        deleteBtn.attr('data-distributor-product-id', distributorProductId);
    }

    onClickDelete(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let distributorProductId = $(clickedElement).attr('data-distributor-product-id');

        if(distributorProductId > 0 && distributorProductId != 'undefined')
        {
            $.ajax({
                url: "/distributors/delete/distributor-product",
                type: 'POST',
                dataType: 'json',
                data: {
                    'distributor-product-id': distributorProductId,
                },
                beforeSend: function ()
                {
                    self.isLoading(true);
                },
                success: function (response)
                {
                    $('#distributor_product_'+ distributorProductId).remove();
                    $('#modal_product_delete').modal('toggle')
                    self.isLoading(false);
                    self.getFlash(response);
                }
            });
        }
    }

    onclickEditIcon(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let productId = $(clickedElement).attr('data-product-id');
        let productName = $(clickedElement).attr('data-product-name');

        $('#search_field').val(productName);

        this.getInventory();
        this.selectProduct(productId, productName);
    }

    getProductList(pageId = 1)
    {
        let self = this;

        $.ajax({
            url: "/distributors/get/product-list",
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
                self.popOver();
            }
        });

        $('.distributor-right-col').animate ({scrollTop:0}, 200);
        window.history.pushState(null, "Fluid", '/distributors/inventory/list/1');
    }

    getInventory()
    {
        let self = this;
        let accessDenied = $('#access_denied');
        let distributorContainer = $('#clinic_container');

        $.ajax({
            url: "/distributors/get/refresh-token",
            type: 'POST',
            success: function (response)
            {
                if($.inArray(20, self.permissions) !== -1)
                {
                    accessDenied.hide();
                    distributorContainer.show();
                }
                else
                {
                    distributorContainer.hide();
                    accessDenied.show();
                }

                if(response.button == true)
                {
                    $('#zoho_container').show();
                    $('#inventory_search_container').hide();
                    $('#zoho_error').hide();
                }
                else if(response.error == true)
                {
                    $('#zoho_container').hide();
                    $('#inventory_search_container').hide();
                    $('#zoho_error').show();
                }
                else if(response.token == true)
                {
                    $('#zoho_container').hide();
                    $('#inventory_search_container').show();
                    $('#zoho_error').hide();
                }

                $('.distributor-right-col').animate ({scrollTop:0}, 200);
                window.history.pushState(null, "Fluid", '/distributors/manage-inventory');
            }
        });
    }

    selectProduct(id, name)
    {
        if (id > 0)
        {
            $.ajax({
                type: "POST",
                url: "/distributors/inventory-get",
                data: {
                    'product-id': id,
                },
                success: function (data)
                {
                    $('#distributor_container').empty().append(data.html);
                    $("#suggestion_field").show();
                    $("#suggestion_field").html(data);
                    $('#product_id').val(id);
                    $('#distributor_id').val(data.distributor_id);
                    $('#item_id').val(data.itemId);
                    $('#sku').val(data.sku);
                    $('#distributor_no').val(data.distributor_no);
                    $('#unit_price').val(data.unit_price);
                    $('#stock_count').val(data.stock_count);
                    $('#expiry_date').val(data.expiry_date);
                    $('#dosage').val(data.product.dosage);
                    $('#size').val(data.product.size);
                    $('#pack_type').val(data.product.packType);
                    $('#unit').val(data.product.unit);
                    $('#active_ingredient').val(data.product.activeIngredient);
                    $('#btn_inventory').empty();
                    $('#btn_inventory').append('UPDATE ' + name.toUpperCase()).show();
                    $('#product_name').empty();
                    $('#product_name').append(name + data.product.dosage + data.product.unit + data.product.size);
                    $('#search_field').val(name +' '+ data.product.dosage +' '+ data.product.unit +' '+ data.product.size);
                    $('#inventory_item').show();
                    $('#inventory_btn').show();

                    $('#taxExempt_0').attr('checked', false);
                    $('#taxExempt_1').attr('checked', false);

                    if(data.tax_exempt == 0)
                    {
                        $('#taxExempt_0').attr('checked', true);
                    }
                    else
                    {
                        $('#taxExempt_1').attr('checked', true);
                    }
                }
            });

            $("#search_field").val(name);
            $("#suggestion_field").hide();
        }
    }

    onKeyupSearchField(e)
    {
        let clickedElement = e.currentTarget;

        $.ajax({
            type: "POST",
            url: "/distributors/inventory-search",
            data:'keyword='+$(clickedElement).val(),
            success: function(data)
            {
                $("#suggestion_field").show();
                $("#suggestion_field").html(data);
            }
        });
    }

    popOver()
    {
        var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
        var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl)
        })
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