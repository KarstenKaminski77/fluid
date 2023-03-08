import { Controller } from '@hotwired/stimulus';

export default class extends Controller
{
    onClickBtnSearch(e)
    {
        e.preventDefault();

        let self = this;
        let searchString = $('#search_string').val();
        let brand = $('#brand').val();

        if(searchString != '' || searchString != 'undefined')
        {
            $.ajax({
                url: "/admin/product-search",
                type: 'POST',
                dataType: 'json',
                data: {
                    'search-string': searchString,
                    'brand': brand,
                },
                beforeSend: function ()
                {
                    self.isLoading(true);
                },
                success: function (response)
                {
                    $('#products').empty().append(response.html);
                    $('.custom-pagination').hide();
                    self.isLoading(false);
                }
            });
        }
    }

    isLoading(status)
    {
        if(status) {
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