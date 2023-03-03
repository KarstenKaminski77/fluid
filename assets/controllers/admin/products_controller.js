import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    connect(e)
    {
    }

    onClickAddImageIcon(e)
    {
        e.preventDefault();

        let imageUpload = '' +
        '<div class="row image-upload-row pt-4">\n' +
        '    <div class="col-10">\n' +
        '        <label for="video" class="text-primary mb-2">Image</label>\n' +
        '        <input\n' +
        '            type="file"\n' +
        '            class="form-control image-field"\n' +
        '            name="image[]"\n' +
        '            tabindex="15"\n' +
        '        >\n' +
        '        <input\n' +
        '            type="text"\n' +
        '            class="form-control video-field"\n' +
        '            name="video[]"\n' +
        '            id="video"\n' +
        '            style="display: none"\n' +
        '            placeholder="Video Link eg: https://www.youtube.com/embed/4pb5HUYgh-E"\n' +
        '        >\n' +
        '    </div>\n' +
        '    <div class="col-2">\n' +
        '        <div class="row">\n' +
        '            <div class="col-6">\n' +
        '                <label class="mb-3 w-100">&nbsp;</label>\n' +
        '                <a href="" class="gallery-toggle">\n' +
        '                    <i class="fa-solid fa-arrow-right-arrow-left"></i>\n' +
        '                </a>\n' +
        '            </div>\n' +
        '            <div class="col-6">\n' +
        '                <label class="mb-3 w-100">&nbsp;</label>\n' +
        '                <a href="" data-action="admin--products#onClickRemoveImageRowIcon">\n' +
        '                    <i class="fa-solid fa-xmark text-danger fw-bold"></i>\n' +
        '                </a>\n' +
        '            </div>\n' +
        '        </div>\n' +
        '    </div>\n' +
        '</div>';

        $('#image_upload_container').append(imageUpload);
    }

    onClickRemoveImageRowIcon(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;

        $(clickedElement).closest('.image-upload-row').remove();
    }

    onKeyUpDistributorSearchField(e)
    {
        let clickedElement = e.currentTarget;
        let productId = $(clickedElement).attr('data-product-id');

        $.ajax({
            type: "POST",
            url: "/admin/distributor-search-list",
            data:{
                'keywords': $(clickedElement).val(),
                'product-id': productId,
            },
            success: function(response)
            {
                $("#suggestion_field").show();
                $("#suggestion_field").html(response);

                if($(clickedElement).val() == '')
                {
                    $("#suggestion_field").empty().hide();
                }
            }
        });
    }

    onKeyUpDistributorPriceField(e)
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

    onClickSaveDistributorProduct(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let distributorId = $(clickedElement).attr('data-distributor-id');
        let productId = $(clickedElement).attr('data-product-id');
        let price = $(clickedElement).attr('data-price');

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
            }
        });
    }

    onClickResetDistributorList(e)
    {
        e.preventDefault();

        $("#suggestion_field").slideUp(700).empty();
        $('#search_distributor_field').val('');
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