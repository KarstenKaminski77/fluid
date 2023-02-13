import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    connect(e)
    {
        let uri = window.location.pathname;
        let isAnalytics = uri.match('/clinics/analytics');

        if(isAnalytics != null)
        {
            this.getAnalytics();
        }
    }

    onClickAnalyticsLink(e)
    {
        e.preventDefault();
        this.getAnalytics();
    }

    getAnalytics()
    {
        this.isLoading(true);
        $("#clinic_container").load('/clinics/analytics');
        this.isLoading(false);
        window.history.pushState(null, "Fluid", '/clinics/analytics');
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