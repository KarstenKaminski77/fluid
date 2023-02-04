import { Controller } from '@hotwired/stimulus';

export default class extends Controller
{
    onClickBtnDetails(e)
    {
        let clickedElement = e.currentTarget;
        let parent = $(clickedElement).closest('.prd-container').closest('.row');
        $('.panel_lists').empty();

        if(parent.find('.panel-details').is(':visible'))
        {
            parent.find('.panel-details').slideUp(700);
            parent.find('.search-panels-container').slideUp(700);
            $(clickedElement).removeClass('active');
        }
        else
        {
            parent.find('.search-panels-container').show();
            parent.find('.panel-details').slideDown(700);
            parent.find('.panel-lists').slideUp(700);
            parent.find('.panel-tracking').slideUp(700);
            parent.find('.panel-reviews').slideUp(700);
            parent.find('.panel-notes').slideUp(700);
            parent.find('.btn_details').addClass('active');
            parent.find('.btn_lists').removeClass('active');
            parent.find('.btn_track').removeClass('active');
            parent.find('.btn_notes').removeClass('active');
            parent.find('.btn_reviews').removeClass('active');
        }
    }
}