import { Controller } from '@hotwired/stimulus';

export default class extends Controller
{
    connect(e) {

    }

    onClickBtnNotes(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let productId = $(clickedElement).data('product-id');
        let parent = $(clickedElement).closest('.prd-container').closest('.row');

        if(parent.find('.panel-notes').is(':visible'))
        {
            parent.find('.panel-notes').slideUp(700);
            parent.find('.search-panels-container').slideUp(700);
            $(clickedElement).removeClass('active');
        }
        else
        {
            $.ajax({
                async: "true",
                url: "/clinics/inventory/get-notes",
                type: 'POST',
                cache: false,
                timeout: 600000,
                dataType: 'json',
                data: {
                    id: productId
                },
                success: function (response) {

                    parent.find('.panel-notes').empty();
                    parent.find('.panel-notes').append(response);

                }
            });

            parent.find('.search-panels-container').show();
            parent.find('.panel-details').slideUp(700);
            parent.find('.panel-lists').slideUp(700);
            parent.find('.panel-tracking').slideUp(700);
            parent.find('.panel-reviews').slideUp(700);
            parent.find('.panel-notes').slideDown(700);
            parent.find('.btn_details').removeClass('active');
            parent.find('.btn_lists').removeClass('active');
            parent.find('.btn_track').removeClass('active');
            parent.find('.btn_notes').addClass('active');
            parent.find('.btn_reviews').removeClass('active');
        }
    }

    onClickCreateNewLink(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;

        $(clickedElement).closest('.row').next().slideToggle(700);
    }

    onClickCreateNew(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;

        $(clickedElement).parent().next().next().slideToggle(700);
    }

    onSubmitNotesForm(e)
    {
        let clickedElement = e.currentTarget;
        let productId = $(clickedElement).data('product-id');

        e.preventDefault();

        let note = $('#note_'+ productId).val();
        let noteError = $('#error_note_'+ productId);
        let data = new FormData($(clickedElement)[0]);
        let isValid = true;
        let self = this;

        noteError.hide()

        if(note == '' || note == 'undefined')
        {
            noteError.show();
            isValid = false;
        }

        if(isValid)
        {
            $.ajax({
                async: "true",
                url: "/clinics/inventory/manage-note",
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
                    $('#notes_'+ productId).empty().append(response);

                    $.ajax({
                        async: "true",
                        url: "/clinics/get-product-notes",
                        type: 'POST',
                        cache: false,
                        timeout: 600000,
                        dataType: 'json',
                        data: {
                            'product-id': productId
                        },
                        success: function (response) {

                            if(response){

                                self.getNoteCount(response.noteCount, productId);

                                $('#product_notes_label_'+ productId).empty().append('<i class="fa-solid fa-pen-to-square"></i> <b>Notes From '+ response.from +':</b> '+ response.note);
                                $('#product_notes_label_'+ productId).removeClass('hidden_msg');

                            } else
                            {
                                $('#product_notes_label_'+ productId).addClass('hidden_msg');
                            }

                            self.isLoading(false);
                        }
                    });
                }
            });
        }
    }

    getNoteCount(noteCount,productId)
    {
        if(noteCount > 0)
        {
            let btnNote = '';

            btnNote += '<i class="fa-solid fa-pencil"></i> <span class="d-none d-sm-inline">Notes</span>';
            btnNote += '<span class="position-absolute text-opacity-25 start-100 translate-middle badge border rounded-circle bg-primary" ';
            btnNote += 'style="z-index: 999">' + noteCount + '</span>';

            $('#btnNote_' + productId).empty().append(btnNote);
        }
        else
        {
            let btnNote = '';

            btnNote += '<i class="fa-solid fa-pencil"></i> <span class="d-none d-sm-inline">Notes</span>';

            $('#btnNote_' + productId).empty().append(btnNote);
        }
    }

    onClickUpdateNote(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let noteId = $(clickedElement).data("id");

        $.ajax({
            async: "true",
            url: "/clinics/inventory/get-note",
            type: 'POST',
            cache: false,
            timeout: 600000,
            dataType: 'json',
            data: {
                id: noteId
            },
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            success: function (response)
            {
                $(clickedElement).closest('.panel-notes').find('button').empty().append('UPDATE NOTE');
                $(clickedElement).closest('.panel-notes').find('.create-new-note').slideDown(700);
                $('#note_id_'+ response.productId).val(noteId);
                $('#note_'+ response.productId).empty().val(response.note);
                self.isLoading(false);
            }
        });
    }

    onClickDeleteIcon(e)
    {
        e.preventDefault();

        let clickedElement = e.currentTarget;
        let noteId = $(clickedElement).data("note-id");
        let productId = $(clickedElement).data("product-id");

        $('.modal-backdrop:first').remove();
        $('#delete_note').attr('data-delete-note-id', noteId);
        $('#delete_note').attr('data-delete-product-id', productId);

        let removeCss = setInterval(function ()
        {
            $('body').removeAttr('style');
            clearInterval(removeCss);
        }, 200);
    }

    onClickDelete(e)
    {
        e.preventDefault();

        let self = this;
        let clickedElement = e.currentTarget;
        let noteId = $(clickedElement).attr('data-delete-note-id');
        let productId = $(clickedElement).attr('data-delete-product-id');

        $.ajax({
            async: "true",
            url: "/clinics/inventory/manage-note",
            type: 'POST',
            cache: false,
            timeout: 600000,
            dataType: 'json',
            data: {
                'delete-id': true,
                'note-id': noteId,
                'product-id': productId
            },
            beforeSend: function ()
            {
                self.isLoading(true);
            },
            success: function (response)
            {
                $('#notes_'+ productId).empty().append(response);
                $('.modal-backdrop').remove();

                $.ajax({
                    async: "true",
                    url: "/clinics/get-product-notes",
                    type: 'POST',
                    cache: false,
                    timeout: 600000,
                    dataType: 'json',
                    data: {
                        'product-id': productId,
                    },
                    success: function (response)
                    {
                        if(response)
                        {
                            self.getNoteCount(response.note_count, productId);

                            $('#product_notes_label_'+ productId).empty().append('<i class="fa-solid fa-pen-to-square"></i> <b>Notes From '+ response.from +':</b> '+ response.note);
                            $('#product_notes_label_'+ productId).removeClass('hidden_msg');
                        }
                        else
                        {
                            self.getNoteCount(0, productId);

                            $('#product_notes_label_'+ productId).addClass('hidden_msg');
                        }

                        self.isLoading(false);
                    }
                });
            }
        });
    }

    getNoteCount(noteCount,productId)
    {
        if(noteCount > 0)
        {
            let btnNote = '';

            btnNote += '<i class="fa-solid fa-pencil"></i> <span class="d-none d-sm-inline">Notes</span>';
            btnNote += '<span class="position-absolute text-opacity-25 start-100 translate-middle badge border rounded-circle bg-primary" ';
            btnNote += 'style="z-index: 999">' + noteCount + '</span>';

            $('#btn_note_' + productId).empty().append(btnNote);
        }
        else
        {
            let btnNote = '';

            btnNote += '<i class="fa-solid fa-pencil"></i> <span class="d-none d-sm-inline">Notes</span>';

            $('#btn_note_' + productId).empty().append(btnNote);
        }
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