import { Controller } from '@hotwired/stimulus';

export default class extends Controller
{
    distributorId;

    connect(e)
    {
        let pageId = 1;

        this.distributorId = $(this.element).attr('data-distributor-id');

        this.getInventory(pageId, this.distributorId);
    }

    onClickPagination(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let pageId = $(clickedElement).attr('data-page-id');
        let distributorId = this.distributorId;

        this.getInventory(pageId, distributorId);
    }

    onKeyupSearchField(e)
    {
        $("#suggestion_field").hide();
        $("#suggestion_field").empty();

        let clickedElement = e.currentTarget;
        let pageId = $('.custom-pagination').find('.active').find('a').attr('data-page-id');

        if($(clickedElement).val().length > 0)
        {
            $.ajax({
                type: "POST",
                url: "/admin/distributors-inventory-search",
                data:{
                    'keyword': $(clickedElement).val(),
                    'distributor-id': this.distributorId,
                    'page-id': pageId,
                },
                success: function(data)
                {
                    $("#suggestion_field").show();
                    $("#suggestion_field").html(data);
                }
            });
        }
    }

    onClickUpdateProduct(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;

        $(clickedElement).closest('.row').find('.unit-price-field').show();
        $(clickedElement).closest('.row').find('.unit-price').hide();
        $(clickedElement).closest('.save-col').find('.save-product').show();
        $(clickedElement).hide();
    }

    onClickSaveProduct(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let productField = $(clickedElement).closest('.row').find('.unit-price-field');
        let productId = productField.attr('data-product-id');
        let distributorId = this.distributorId;
        let unitPrice = productField.val();
        let errorPrice = $(clickedElement).closest('.row').find('.hidden_msg');
        let isValid = true;

        errorPrice.hide();

        if(!$.isNumeric(productField.val()))
        {
            errorPrice.empty().append('Please enter a valid number').show();
            isValid = false;
        }

        if(isValid)
        {
            $.ajax({
                async: "true",
                url: "/admin/save-distributor-product",
                type: 'POST',
                dataType: 'json',
                data: {
                    'distributor-id': distributorId,
                    'product-id': productId,
                    'unit-price': unitPrice,
                },
                success: function (response)
                {
                    productField.hide();
                    $(clickedElement).closest('.row').find('.unit-price').empty().append(unitPrice).show();
                    $(clickedElement).closest('.save-col').find('.save-product').hide();
                    $(clickedElement).closest('.save-col').find('.update-product').show();
                    getFlash(response.flash, response.type);
                }
            });
        }
    }

    onClickDeleteProductIcon(e)
    {
        e.preventDefault();

        let productId = $(e.currentTarget).attr('data-product-id');
        let distributorId = this.distributorId;
        let pageId = $('.custom-pagination').find('.active').find('a').attr('data-page-id');

        $('.modal-backdrop:first').remove();
        $('#delete_product').attr('data-product-id', productId);
        $('#delete_product').attr('data-distributor-id', distributorId);
        $('#delete_product').attr('data-page-id', pageId);
    }

    onClickDeleteProduct(e)
    {
        e.preventDefault();

        let self = this;
        let isValid = true;
        let clickedElement = e.currentTarget;
        let productId = $(clickedElement).attr('data-product-id');
        let pageId = $(clickedElement).attr('data-page-id');
        let distributorId = this.distributorId;

        if(productId == '' || productId == 'undefined')
        {
            isValid = false;
        }

        if(distributorId == '' || distributorId == 'undefined')
        {
            isValid = false;
        }

        if(isValid)
        {
            $.ajax({
                async: "true",
                url: "/admin/delete-distributor-product",
                type: 'POST',
                dataType: 'json',
                data: {
                    'distributor-id': distributorId,
                    'product-id': productId,
                },
                success: function (response)
                {
                    $('.modal-backdrop').remove();
                    self.getInventory(pageId, self.distributorId);

                    let removeCss = setInterval(function ()
                    {
                        $('body').removeAttr('style');
                        clearInterval(removeCss);
                    }, 200);
                }
            });
        }
    }

    onClickToggleSearch(e)
    {
        e.preventDefault();

        let searchRow = $('.search-row');
        let clickedElement = e.currentTarget;

        searchRow.slideToggle(700);

        let text = '';

        if($(clickedElement).find('i').hasClass('fa-magnifying-glass-plus'))
        {
            text = '<i class="fa-regular fa-magnifying-glass-minus me-2 mb-3"></i> Search Inventory';
        }
        else
        if($(clickedElement).find('i').hasClass('fa-magnifying-glass-minus'))
        {
            text = '<i class="fa-regular fa-magnifying-glass-plus me-2 mb-3"></i> Search Inventory';
        }

        $(clickedElement).empty().append(text);
    }

    onKeyUpProductPriceField(e)
    {
        let clickedElement = e.currentTarget;
        let button = $(clickedElement).closest('li').find('button');

        if(!$.isNumeric($(clickedElement).val()))
        {
            $(clickedElement).val('');
            button.hide(700);
        }

        button.attr('data-price', $(clickedElement).val());

        if($(clickedElement).val() != '')
        {
            if (!button.is(':visible'))
            {
                $(button.show(700));
            }
        }
        else
        {
            $(button.hide(700));
        }
    }

    onClickCreateDistributorProduct(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let distributorId = $(clickedElement).attr('data-distributor-id');
        let productId = $(clickedElement).attr('data-product-id');
        let price = $(clickedElement).attr('data-price');
        let pageId = $(clickedElement).attr('data-page-id');

        $.ajax({
            type: "POST",
            url: "/admin/create-distributor-product",
            data:{
                'distributor-id': distributorId,
                'product-id': productId,
                'price': price
            },
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            success: function(response)
            {
                $("#suggestion_field").slideUp(700).empty();
                $('#search_distributor_field').val('');
                self.isLoading(false);
                self.getFlash(response.flash);

                if($(clickedElement).val() == '')
                {
                    $("#suggestion_field").empty().hide();
                }

                self.getInventory(pageId, self.distributorId)
            }
        });
    }

    onChangeFilterSelect(e)
    {
        let self = this;
        let manufacturerId = $('#manufacturer_id').val() ? $('#manufacturer_id').val() : 0;
        let speciesId = $('#species_id').val() ? $('#species_id').val() : 0;
        let pageId = $('.custom-pagination').find('.active').find('a').attr('data-page-id');

        if(manufacturerId > 0 || speciesId > 0)
        {
            this.getInventory(pageId, this.distributorId, manufacturerId, speciesId);
        }
    }

    onClickResetProductsList(e)
    {
        e.preventDefault();

        $("#suggestion_field").slideUp(700).empty();
        $('#search_distributor_field').val('');
    }

    getInventory(pageId, distributorId, manufacturerId = '', speciesId = '')
    {
        let self = this;

        $.ajax({
            async: "true",
            url: "/admin/get-distributor-products",
            type: 'POST',
            dataType: 'json',
            data: {
                'distributor-id': distributorId,
                'page-id': pageId,
                'manufacturer-id': manufacturerId,
                'species-id': speciesId,
            },
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            success: function (response)
            {
                $('#inventory_list_container').empty().append(response);
                self.isLoading(false);
                self.popOver();
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