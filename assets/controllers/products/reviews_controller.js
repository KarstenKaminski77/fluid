import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    connect(e) {

    }

    onClickStarOver1()
    {
        $('#rating').val(0);
        $('#star-over-1').fadeOut(700);
        $('#star-over-2').fadeOut(700);
        $('#star-over-3').fadeOut(700);
        $('#star-over-4').fadeOut(700);
        $('#star-over-5').fadeOut(700);
    }

    onClickStarUnder1()
    {
        $('#rating').val(1);
        $('#star-over-1').fadeIn(700);
        $('#star-over-2').fadeOut(700);
        $('#star-over-3').fadeOut(700);
        $('#star-over-4').fadeOut(700);
        $('#star-over-5').fadeOut(700);
    }

    onClickStarOver2()
    {
        $('#rating').val(1);
        $('#star-over-2').fadeOut(700);
        $('#star-over-3').fadeOut(700);
        $('#star-over-4').fadeOut(700);
        $('#star-over-5').fadeOut(700);
    }

    onClickStarUnder2()
    {
        $('#rating').val(2);
        $('#star-over-1').fadeIn(700);
        $('#star-over-2').fadeIn(700);
        $('#star-over-3').fadeOut(700);
        $('#star-over-4').fadeOut(700);
        $('#star-over-5').fadeOut(700);
    }

    onClickStarOver3()
    {
        $('#rating').val(2);
        $('#star-over-1').fadeIn(700);
        $('#star-over-2').fadeIn(700);
        $('#star-over-3').fadeOut(700);
        $('#star-over-4').fadeOut(700);
        $('#star-over-5').fadeOut(700);
    }

    onClickStarUnder3()
    {
        $('#rating').val(3);
        $('#star-over-1').fadeIn(700);
        $('#star-over-2').fadeIn(700);
        $('#star-over-3').fadeIn(700);
        $('#star-over-4').fadeOut(700);
        $('#star-over-5').fadeOut(700);
    }

    onClickStarOver4()
    {
        $('#rating').val(3);
        $('#star-over-1').fadeIn(700);
        $('#star-over-2').fadeIn(700);
        $('#star-over-3').fadeIn(700);
        $('#star-over-4').fadeOut(700);
        $('#star-over-5').fadeOut(700);
    }

    onClickStarUnder4()
    {
        $('#rating').val(4);
        $('#star-over-1').fadeIn(700);
        $('#star-over-2').fadeIn(700);
        $('#star-over-3').fadeIn(700);
        $('#star-over-4').fadeIn(700);
        $('#star-over-5').fadeOut(700);
    }

    onClickStarOver5()
    {
        $('#rating').val(4);
        $('#star-over-1').fadeIn(700);
        $('#star-over-2').fadeIn(700);
        $('#star-over-3').fadeIn(700);
        $('#star-over-4').fadeIn(700);
        $('#star-over-5').fadeOut(700);
    }

    onClickStarUnder5()
    {
        $('#rating').val(5);
        $('#star-over-1').fadeIn(700);
        $('#star-over-2').fadeIn(700);
        $('#star-over-3').fadeIn(700);
        $('#star-over-4').fadeIn(700);
        $('#star-over-5').fadeIn(700);
    }

    onClickBtnReviews(e)
    {
        let clickedElement = e.currentTarget;
        let productId = $(clickedElement).data('product-id');
        let parent = $(clickedElement).closest('.prd-container').closest('.row');

        if(parent.find('.panel-reviews').is(':visible'))
        {
            parent.find('.panel-reviews').slideUp(700);
            parent.find('.search-panels-container').slideUp(700);
            $(clickedElement).removeClass('active');
        }
        else
        {
            parent.find('.search-panels-container').show();
            parent.find('.panel-details').slideUp(700);
            parent.find('.panel-lists').slideUp(700);
            parent.find('.panel-tracking').slideUp(700);
            parent.find('.panel-notes').slideUp(700);
            parent.find('.panel-reviews').slideDown(700);
            parent.find('#basket_container').css({overflow:'auto'});
            parent.find('.btn_details').removeClass('active');
            parent.find('.btn_lists').removeClass('active');
            parent.find('.btn_track').removeClass('active');
            parent.find('.btn_notes').removeClass('active');
            parent.find('.btn_reviews').addClass('active');

            $.ajax({
                async: "true",
                url: '/clinics/get-review-details/'+ productId,
                type: 'GET',
                cache: false,
                timeout: 600000,
                dataType: 'json',
                success: function (response) {
                    $('#reviews_'+ productId).empty().append(response.response);
                    $('#review_details_container').removeClass('half-border');
                }
            });
        }
    }

    onClickBtnCreateReview(e)
    {
        let clickedElement = e.currentTarget;

        $('#review_product_id').val($(clickedElement).data("product-id"))

        if($('.btn_create_review').length == 1)
        {
            $(clickedElement).attr('data-bs-target','modal_review_all');
            $('#modal_review_all').modal('toggle');
        }
    }

    onClickLike(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let reviewId = $(clickedElement).data('review-id');

        $.ajax({
            async: "true",
            url: "/clinics/like-review",
            type: 'POST',
            data: {
                'review-id': reviewId
            },
            success: function (response) {

                $('#like_'+ reviewId).empty().append(response)
            }
        });
    }

    onSubmitReview(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let rating = $('#rating').val();
        let review = $('#review').val();
        let errorRating = $('#error_rating');
        let errorReview = $('#error_review');
        let data = new FormData($(clickedElement)[0]);
        let isValid = true;
        let self = this;

        errorRating.hide();
        errorReview.hide();

        if(rating == 0 || rating == 'undefined' || rating == '')
        {
            errorRating.show();
            isValid = false;
        }

        if(review == '' || review == 'undefined')
        {
            errorReview.show();
            isValid = false;
        }

        if(isValid)
        {
            $.ajax({
                async: "true",
                url: "/clinics/create-review",
                type: 'POST',
                contentType: false,
                processData: false,
                cache: false,
                timeout: 600000,
                dataType: 'json',
                data: data,
                beforeSend: function ()
                {
                    self.isLoading(true);
                },
                success: function (response)
                {
                    self.getFlash(response);
                    $('#modal_review').modal('toggle');

                    let productId = $('#review_product_id').val();

                    $.ajax({
                        async: "true",
                        url: '/clinics/get-reviews/'+ productId,
                        type: 'POST',
                        cache: false,
                        timeout: 600000,
                        dataType: 'json',
                        data: {
                            'product-id': productId
                        },
                        success: function (response)
                        {
                            if(response.reviewCount > 0)
                            {
                                rateStyle(response.reviewAverage, 'parent_'+ productId);
                                $('#review_count_'+ productId).empty().append('<p>(' + response.reviewCount + ' Reviews)</p>');
                            }

                            $.ajax({
                                async: "true",
                                url: '/clinics/get-review-details/'+ productId,
                                type: 'GET',
                                cache: false,
                                timeout: 600000,
                                dataType: 'json',
                                success: function (response)
                                {
                                    if(response != false)
                                    {
                                        $('#reviews_'+ productId).empty().append(response.response).show();
                                        self.isLoading(false);
                                    }
                                }
                            });

                            $('#review_title').val('');
                            $('#review').val('');
                            $('#review_username').val('');
                            $('#review_position').val('');
                            $('#star-over-1').hide();
                            $('#star-over-2').hide();
                            $('#star-over-3').hide();
                            $('#star-over-4').hide();
                            $('#star-over-5').hide();
                        }
                    });

                    $('body').css('overflow','');
                }
            });
        }
    }

    onClickBtnComment(e)
    {
        e.preventDefault();

        $('.hidden_msg').hide();

        let clickedElement = e.currentTarget;
        let reviewId = $(clickedElement).data('review-id');

        $('#leave_comment_container_'+ reviewId).slideUp(700);

        if($('#comment_container_'+ reviewId +':visible').length) {

            $('#comment_icon_'+ reviewId).removeClass('text-secondary');
            $('#comment_span_'+ reviewId).removeClass('text-secondary');
            $('.review-comments-row').removeClass('mb-3');
            $('#comment_container_'+ reviewId).slideUp(700);

        } else {

            $('.comment-container').slideUp(700);
            $('#comment_icon_'+ reviewId).addClass('text-secondary');
            $('#comment_span_'+ reviewId).addClass('text-secondary');
            $('.review-comments-row').addClass('mb-3');
            $('#comment_container_'+ reviewId).slideDown(700);
        }
    }

    onClickLeaveComment(e)
    {
        e.preventDefault();

        $('.hidden_msg').hide();

        let selectedElement = e.currentTarget;
        let reviewId = $(selectedElement).data('review-id');

        $('#comment_container_'+ reviewId).slideUp(700);

        if($('#leave_comment_container_'+ reviewId +':visible').length)
        {
            $('#leave_comment_icon_'+ reviewId).removeClass('text-secondary');
            $('#leave_comment_span_'+ reviewId).removeClass('text-secondary');
            $('.review-comments-row').removeClass('mb-3');
            $('#leave_comment_container_'+ reviewId).slideUp(700);
        }
        else
        {
            $('.comment-container').slideUp(700);
            $('#leave_comment_icon_'+ reviewId).addClass('text-secondary');
            $('#leave_comment_span_'+ reviewId).addClass('text-secondary');
            $('.review-comments-row').addClass('mb-3');
            $('#leave_comment_container_'+ reviewId).slideDown(700);
        }
    }

    onSubmitCommentForm(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let reviewId = $(clickedElement).data('review-id');
        let comment = $('#comment_'+ reviewId).val();
        let commentError = $('#error_comment_'+ reviewId);
        let data = new FormData($(clickedElement)[0]);
        let isValid = true;
        let self = this;

        commentError.hide()

        if(comment == '' || comment == 'undefined'){

            commentError.show();
            isValid = false;
        }

        if(isValid)
        {
            $.ajax({
                async: "true",
                url: "/clinics/manage-comment",
                type: 'POST',
                contentType: false,
                processData: false,
                cache: false,
                timeout: 600000,
                dataType: 'json',
                data: data,
                beforeSend: function ()
                {
                    self.isLoading(true);
                } ,
                success: function (response)
                {
                    $('#review_comments_'+ reviewId).empty().append(response);
                    $('#comment_'+ reviewId).val('');

                    $.ajax({
                        async: "true",
                        url: "/clinics/get-comment-count",
                        type: 'POST',
                        dataType: 'json',
                        data: {
                            'review-id': reviewId
                        },
                        success: function (response)
                        {
                            $('#comment_span_'+ reviewId).empty().append('Comments'+ response);
                            $('#comment_'+ reviewId).val('');
                            $('#leave_comment_container_'+ reviewId).slideUp(700);
                            $('#comment_container_'+ reviewId).slideDown(700);
                            self.isLoading(false);
                        }
                    });
                }
            });
        }
    }

    onClickViewAllReviews(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let productId = $(clickedElement).data('product-id');

        $.ajax({
            async: "true",
            url: '/clinics/get-review-details/'+ productId,
            type: 'POST',
            data: {
                'product-id': productId
            },
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            success: function (response) {

                $('#inventory').empty().hide();
                $('#inventory_container').hide();
                $('.review_panel').empty();
                $('#basket_container').empty().append(response.response).addClass('bg-light border-xy').css({overflow:''}).show();
                $('.recent-reviews').empty().append('Showing All Reviews For '+ response.product_name);
                $('.btn-view-all-reviews').hide();
                $('#review_details_container').addClass('half-border');
                window.scrollTo(0,0);
                self.isLoading(false);
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
}