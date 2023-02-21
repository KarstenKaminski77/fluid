import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    connect()
    {
        $(document).on('click', '#flash', function ()
        {
            $('#flash').addClass('hidden');
        });

        $(document).on('click', 'a', function (e)
        {
            let clickedElement = e.currentTarget;
            let name = $(clickedElement).attr('name');

            if(name != 'notifications'){

                $('#notifications_panel').hide();
            }

        });

        $(document).mouseup(function()
        {
            let container = $('#megamenu');

            // if the target of the click isn't the container nor a descendant of the container
            let displayValue = $('#megamenu').get(0).style.display;

            if(displayValue == 'block')
            {
                container.slideUp(700);

            }
        });

        $(document).click(function (event)
        {
            /// If *navbar-collapse* is not among targets of event
            if (!$(event.target).is('.navbar-collapse *'))
            {
                /// Collapse every *navbar-collapse*
                $('.navbar-collapse').collapse('hide');
            }
        });

        // Toggle Navbar
        $(document).on('click', '#btn_navbar_toggle', function ()
        {
            $('#main_nav').toggle(700);
        });
    }
}