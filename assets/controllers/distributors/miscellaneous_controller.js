import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    connect()
    {
        let uri = window.location.pathname;
        let isCompanyInfo = uri.match('/distributors/account');
        let isApproved = $.session.get('is-approved');

        if(isApproved == 0 && isCompanyInfo == null)
        {
            window.location.href = '/distributors/account';
        }

        // Toggle Navbar
        $(document).on('click', '#btn_navbar_toggle', function () {

            $('#main_nav').toggle(700);
        });

        let date = new Date();
        let dateTime = date.getFullYear() +'-'+ (date.getMonth() + 1) +'-'+ date.getDate() +' '+ String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0") +':'+ String(date.getSeconds()).padStart(2, '0');
        sessionStorage.setItem('date_time', dateTime);

        setInterval(function(){

            if($('#datepicker_mobile').val() != '' && $('#datepicker_mobile').val() != 'Date') {

                $('.clinic_search').attr('data-date', $('#datepicker_mobile').val());
            }

            if($('#datepicker').val() != '' && $('#datepicker').val() != 'Date') {

                $('.clinic_search').attr('data-date', $('#datepicker').val());
            }
        } , 1000);

        // Dropdown Menu Chevron
        $(document).on('click', '.dropdown-link', function (e) {

            e.preventDefault();

            if($(this).attr('aria-expanded') == 'true')
            {
                $(this).find('.fa-caret-right').css({'rotate':'90deg'});
            }
            else
            {
                $(this).find('.fa-caret-right').css({'rotate':'0deg'});
            }
        });
    }
}