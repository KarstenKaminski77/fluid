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
}