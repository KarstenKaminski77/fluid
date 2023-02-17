import { Controller } from '@hotwired/stimulus';

export default class extends Controller
{
    categoryArray;
    searchArray;
    selectedDistributorArray = [];
    distributorArray = [];
    selectedManufacturerArray = [];
    manufacturersArray = [];
    favourite = false;
    inStock = false;

    connect(e)
    {
        let uri = window.location.pathname;
        let isSearch = uri.match('/clinics/inventory');
        history.pushState(null, null, window.location.href);
        history.back();
        window.onpopstate = () => history.forward();

        if(isSearch != null)
        {
            $('#clinic_container').empty().append($.session.get('search-results'));
            $('#search_field').val($.session.get('search_key'));
        }

        // Filter Dropdowns
        if($(window).width() < 769)
        {
            $('#dd_categories').hide();
            $('#dd_filters').hide();
            $('#dd_manufacturers_1').hide();
            $('#dd_manufacturers_2').hide();
            $('#dd_distributors').hide();

        }

        $(document).on('click', '#btn_categories', function (e)
        {
            e.preventDefault();

            $('#dd_categories').toggle(700,'linear');
        });

        $(document).on('click', '#btn_filters', function (e)
        {
            e.preventDefault();

            $('#dd_filters').toggle(700,'linear');
        });

        $(document).on('click', '#btn_manufacturers', function (e)
        {
            e.preventDefault();

            $('#dd_manufacturers_1').toggle(700,'linear');
            $('#dd_manufacturers_2').toggle(700,'linear');
        });

        $(document).on('click', '#btn_distributors', function (e)
        {
            e.preventDefault();

            $('#dd_distributors').toggle(700,'linear');
        });
    }

    onClickSearch(e)
    {
        e.preventDefault(e);
        //clearInterval(get_messages);
        let clickedElement = e.currentTarget;
        let pageId = $(clickedElement).data('page-id') ? $(clickedElement).data('page-id') : 1;
        let elementId = $(clickedElement).attr('id');

        this.getSearchResults(pageId, clickedElement, false, 0, [], elementId);
    }

    onClickFavourite(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let productId = $(clickedElement).data("product-id");
        let listId = $(clickedElement).data("list-id");
        let favourite = $(clickedElement).attr('data-favourite');

        if(favourite == 'false')
        {
            $.ajax({
                async: "true",
                url: "/clinics/inventory/get-list-modal",
                type: 'POST',
                cache: false,
                timeout: 600000,
                dataType: 'json',
                data: {
                    'product-id': productId,
                    'list-id': listId,
                },
                success: function (response)
                {
                    $('#modal_list_distributors').remove();
                    $('#clinic_container').append(response);
                    $('#modal_list_distributors').modal('toggle');
                    $('#save_list_distributor').attr('data-favourite','true');
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
                data: {
                    'product-id': productId,
                    'list-id': listId,
                    'distributor-id': distributorId,
                    'favourite': favourite,
                    delete: true,
                    'return': '',
                },
                success: function (response)
                {
                    $('#favourite_'+ productId).removeClass('text-danger').addClass('icon-unchecked')
                        .attr('data-favourite', false).removeAttr('data-distributor-id');
                }
            });
        }
    }

    onClickOpenCarousel(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let productId = $(clickedElement).data('product-id');

        $.ajax({
            async: "true",
            url: "/clinics/product/get-gallery",
            type: 'POST',
            data: {
                productId: productId
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
                $('#modal_body_'+ productId).empty().append(response);
                $('#modal_gallery_'+ productId).modal('toggle');
            }
        });
    }

    onClickCarouselClose(e)
    {
        let carouselId = $(e.currentTarget).data('carousel-id');

        $('#modal_gallery_'+ carouselId).modal('toggle');
    }

    onClickBackButton(e)
    {
        e.preventDefault();

        $('.review_panel').hide();
        $('.search-panels-container').hide();
        $('#basket_container').empty().hide();
        $('#back_btn').addClass('d-none').removeClass('d-flex');
        $('#inventory').show();
        $('#inventory_container').show();
    }

    onClickPagination(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let pageNo = $(clickedElement).data('page-id');

        this.getSearchResults(pageNo, clickedElement);
    }

    onClickFilterBtn()
    {
        let container = $('#megamenu');

        // if the target of the click isn't the container nor a descendant of the container
        let displayValue = $('#megamenu').get(0).style.display;

        if(displayValue == 'block')
        {
            container.slideUp(700);
        }
        else
        {
            container.slideDown(700);
        }
    }

    onClickFilterCategory(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let categoryId = $(clickedElement).attr('data-category-id');
        let level = $(clickedElement).attr('data-level');
        this.categoryArray = [];

        this.categoryArray.push({'level':level, 'categoryId': categoryId});

        this.getSearchArray();
        this.getSearchResults(1, '', false, 0, this.searchArray, '');
        this.resetFilterBtn();
    }

    onClickFilterDistributor(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let distributorId = $(clickedElement).attr('data-distributor-id');
        let checkbox = $(clickedElement).find('input:first-child');

        if(checkbox.is(':checked'))
        {
            checkbox.attr('checked', false);
            this.selectedDistributorArray = $.grep(this.selectedDistributorArray, function(value)
            {
                return value != distributorId;
            });
        }
        else
        {
            checkbox.attr('checked', true);
            this.selectedDistributorArray.push(distributorId)
        }

        this.getSearchArray();
        this.getSearchResults(1, '', false, 0, this.searchArray, '');
        this.resetFilterBtn();
    }

    onClickFilterManufacturer(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let manufacturerId = $(clickedElement).attr('data-manufacturer-id');
        let checkbox = $(clickedElement).find('input:first-child');

        if(checkbox.is(':checked'))
        {
            checkbox.attr('checked', false);
            this.selectedManufacturerArray = $.grep(this.selectedManufacturerArray, function(value)
            {
                return value != manufacturerId;
            });
        }
        else
        {
            checkbox.attr('checked', true);
            this.selectedManufacturerArray.push(manufacturerId)
        }

        this.getSearchArray();
        this.getSearchResults(1, '', false, 0, this.searchArray, '');
        this.resetFilterBtn();
    }

    onClickFilterFavourite(e)
    {
        e.preventDefault();

        let selectedElement = e.currentTarget;
        let checkbox = $(selectedElement).find('input');

        if(checkbox.is(':checked'))
        {
            checkbox.prop('checked', false);
            this.favourite = false;
        }
        else
        {
            checkbox.prop('checked', true);
            this.favourite = true;
        }

        this.getSearchArray();
        this.getSearchResults(1, '', false, 0, this.searchArray, '');
        this.resetFilterBtn();
    }

    onClickFilterInStock(e)
    {
        e.preventDefault();

        let checkbox = $(e.currentTarget).find('input');

        if(checkbox.is(':checked'))
        {
            checkbox.prop('checked', false);
            this.inStock = false;
        }
        else
        {
            checkbox.prop('checked', true);
            this.inStock = true;
        }

        this.getSearchArray();
        this.getSearchResults(1, '', false, 0, this.searchArray, '');
        this.resetFilterBtn();
    }

    onClickResetFilters(e)
    {
        e.preventDefault();

        let self = this;
        let pageNo = 1;
        let keyword = $('#search_field').val();

        $.ajax({
            async: "true",
            url: "/clinics/search-inventory",
            type: 'POST',
            data: {
                'keyword': keyword,
                'page-no': pageNo
            },
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
                if(window.location.pathname == '/clinics/inventory')
                {
                    $('#filter_reset_btn').remove();
                    $('#search_field').val(keyword);
                    $('#clinic_container').empty().append(response.html);
                    $('#dd_categories').empty().append(response.categoryList);
                    $('#dd_distributors').empty().append(response.distributorsList);
                    $('#dd_manufacturers').empty().append(response.manufacturersList);
                    $('#filter_favourite').prop('checked', false);
                    $('#filter_in_stock').prop('checked', false);
                    $('#filter_reset_btn').remove();
                    self.isLoading(false);
                    self.searchArray = [];
                    self.categoryArray = [];
                    self.selectedDistributorArray = [];
                    self.selectedManufacturerArray = [];
                    self.favourite = false;
                    self.inStock = false;
                    document.title = 'Fluid';
                    window.history.pushState({
                        "html": response.html,
                        "pageTitle": 'Fluid'
                    }, "", '/clinics/inventory');
                    $.session.set('search_key', keyword);

                    $(response.productIds).each(function (index, value)
                    {
                        let productId = value;

                        $.ajax({
                            async: "true",
                            url: "/clinics/product/get-distributors",
                            type: 'POST',
                            dataType: 'json',
                            data: {
                                'product-id': productId,
                            },
                            complete: function (e)
                            {
                                if (e.status === 500)
                                {
                                    //window.location.href = '/clinics/error';
                                }

                                $.session.set('search-results', $('#clinic_container').html());
                            },
                            success: function (response)
                            {
                                $('#search_result_distributors_'+ productId).empty().append(response.html);
                                $('.from_'+ productId).empty().append(response.from);
                                $('.basket-id').val($('#btn_basket').attr('data-basket-id'));
                                popOver();
                            }
                        });
                    });
                }
            }
        });
    }

    onClickCloseFilter()
    {
        $('#megamenu').slideUp(700);
    }

    getSearchArray()
    {
        this.searchArray = [];

        this.searchArray.push({
            category: this.categoryArray,
            selectedDistributors: this.selectedDistributorArray,
            distributors: this.distributorArray,
            selectedManufacturers: this.selectedManufacturerArray,
            manufacturers: this.manufacturerArray,
            favourite: this.favourite,
            clinicId: $.session.get('clinic-id'),
            inStock: this.inStock,
        });

        return this.searchArray;
    }

    resetFilterBtn()
    {
        let btnReset = '<div class="col-12" id="filter_reset_btn" data-action="click->products--search#onClickResetFilters"><button type="button" class="btn bg-secondary btn-sm w-100 border-top">';
        btnReset += '<i class="fa-solid fa-rotate me-1" role="button"></i>Reset Filters</button></div>';

        $('#filter_reset_btn').remove();
        $('#filter_megamenu').append(btnReset);
    }

    onClickClinicConnect(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let distributorId = $(clickedElement).data('distributor-id');
        let clinicId = $(clickedElement).data('clinic-id');
        let productId = $(clickedElement).data('product-id');

        $.ajax({
            async: "true",
            url: "/clinic/request-connection",
            type: 'POST',
            dataType: 'json',
            data: {
                'distributor-id':distributorId,
                'clinic-id': clinicId
            },
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
                $('#modal_add_to_basket_'+ productId +'_'+ distributorId).modal('toggle');
                self.getFlash(response);
                self.isLoading(false);
            }
        });
    }

    getSearchResults(pageId, object, shippingList = false, listId = 0, searchArray = [], elementId = '')
    {
        let keyword = $.session.get('search_key') ? $.session.get('search_key') : 'canine';
        let listKeyword = $.session.get('search_key') ? $.session.get('search_key') : 'canine';
        let keywordField = false;
        let pageNo = pageId;
        let className = '';
        let uri = window.location.pathname;
        let isListUri = uri.match('/clinics/inventory/lists');
        let self = this;

        $('#paginator').empty().hide();

        if(object != 'undefined' && object != '')
        {
            className = object.className.substring(10);
        }

        if($('#search_field').val() != '' || $('#search_field').val() != 'undefined')
        {
            keyword = $('#search_field').val();
        }

        if((object != 'undefined' && object != '') && object.className.substring(23,42) == 'list-back-to-search')
        {
            keyword = $(object).data('keyword-string');
            keywordField = true;
        }

        if(className == 'view-list' || isListUri != null)
        {
            listKeyword = $(object).data('keyword-string');

            $.session.set('listSearchKey', $('#search_field').val());
            $('#search_field').val('');
        }

        if($(object).data('list-id') != '' && $(object).data('list-id') != 'undefined' && listId == 0)
        {
            listId = $(object).data('list-id');
        }

        $.ajax({
            async: "true",
            url: "/clinics/search-inventory",
            type: 'POST',
            dataType: 'json',
            data: {
                'keyword': keyword,
                'list-keyword': listKeyword,
                'list-id': listId,
                'page-no': pageNo,
                'page-id': pageId,
                'search-array': searchArray,
            },
            beforeSend: function ()
            {
                self.isLoading(true);

                $('#main_nav').slideUp(700);
                window.scrollTo(0, 0);
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
                $('#clinic_container').empty().append(response.html).show();
                window.scrollTo(0,0);
                $('.has-megamenu').show(700);
                $('#favourite_label').empty().append('('+ response.favouriteCount +') Favourite Items');
                $('#in_stock_label').empty().append('('+ response.inStockCount +') In Stock');
                $('.manage-lists').attr('data-keyword-string', keyword);
                window.history.pushState({
                    "html": response.html,
                    "pageTitle": 'Fluid'
                }, "", '/clinics/inventory');

                $(response.productIds).each(function (index, value)
                {
                    let productId = value;

                    $.ajax({
                        async: "true",
                        url: "/clinics/product/get-distributors",
                        type: 'POST',
                        dataType: 'json',
                        data: {
                            'product-id': productId,
                        },
                        complete: function (e)
                        {
                            if (e.status === 500)
                            {
                                //window.location.href = '/clinics/error';
                            }

                            $.session.set('search-results', $('#clinic_container').html());
                        },
                        success: function (response)
                        {
                            $('#search_result_distributors_'+ productId).empty().append(response.html);
                            $('.from_'+ productId).empty().append(response.from);
                            $('.basket-id').val($('#btn_basket').attr('data-basket-id'));
                            self.popOver();
                        }
                    });
                });

                self.isLoading(false);

                // Category Levels
                if(response.level == 3)
                {
                    let categoryId = $.map(categoryArray, function(cat)
                    {
                        return cat.categoryId[0];
                    });

                    $('#dd_categories').find('.category-select').each(function ()
                    {
                        $(this).find('label').css('font-weight', '');
                        $('#megamenu').hide(700);
                    });

                    $('*[data-category-id="'+ categoryId +'"]').find('label').css('font-weight', 'bold');
                }
                else
                {
                    $('#dd_categories').empty().append(response.categoryList);
                    $('#dd_distributors').empty().append(response.distributorsList);
                    $('#dd_manufacturers').empty().append(response.manufacturersList);
                }

                if(elementId == 'search_btn')
                {
                    // Manufacrurer Filter List
                    self.manufacturerArray = [];

                    $('.manufacturer-checkbox').each(function ()
                    {
                        let manufacturer = $(this).next().text().trim().substring(4);
                        let manufacturerId = $(this).val();
                        let itemCount = $(this).next().text().trim().substring(1,2);

                        self.manufacturerArray.push({
                            'id': manufacturerId,
                            'name': manufacturer,
                            'count': itemCount,
                        });
                    });

                    // Distributor Filter List
                    self.distributorArray = [];

                    $('.distributor-checkbox').each(function ()
                    {
                        let distributor = $(this).next().text().trim().substring(4);
                        let distributorId = $(this).val();
                        let itemCount = $(this).next().text().trim().substring(1,2);

                        self.distributorArray.push({
                            'id': distributorId,
                            'name': distributor,
                            'count': itemCount,
                        });
                    });
                }

                if(className == 'view-list' || listId > 0 || isListUri != null)
                {
                    if(listKeyword == '' || listKeyword == 'undefined')
                    {
                        listKeyword = $.session.get('search_key');
                    }

                    getListBackButton(listKeyword, listId);
                    window.history.pushState(null, "Fluid", '/clinics/inventory/list/' + listId);
                }
                else
                {
                    window.history.pushState(null, "Fluid", '/clinics/inventory');
                }

                if(keywordField)
                {
                    $('#search_field').val(keyword)
                }

                if(keyword != '' || keyword != 'undefined')
                {
                    $.session.set('search_key', keyword);
                }

                let popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
                let popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
                    return new bootstrap.Popover(popoverTriggerEl);
                });
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