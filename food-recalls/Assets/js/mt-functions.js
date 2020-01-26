/// <reference path = "/html/js/jquery-1.8.2.intellisense.js"/>
/// <reference path = "/html/js/knockout-2.2.0.debug.js"/>

///// Object classes


var Food = function (rcnum, rcdate, rcurl, org, summary, desc) {
    this.recallNumber = rcnum;
    this.recallDate = rcdate;
    this.recallURL = rcurl;
    this.organization = org;
    this.summary = summary;
    this.description = desc;
}


var foodsVM = {
    foods: []
}

var stackpage = function (pageId, pageTitle) {
    this.pageId = pageId;
    this.pageTitle = pageTitle
}

var _backstack = {stackpages:[]}

$(document).ready(function () {
    //showStates();
    showFoods(null, "recent recalls");
    $('#searcherror').click(function () {
        $('#searcherror').hide();
    });
});

function newFoods() {
    var vmlen = foodsVM.foods.length;
    foodsVM.foods.splice(0, foodsVM.foods.length);
}


function setClick() {
    $('[data-clicktype]').unbind('click');
    $('[data-clicktype]').click(function () {
        itemClick($(this));
        event.preventDefault();
    });
}


function showAbout() {
    pageNav(new stackpage("#about-page", "about"));
}


function showFoods(query, pagename) {
    waitOn();
    var element = $("#foods-list");
    ko.cleanNode(element);
    newFoods();
    var url = "http://api.usa.gov/recalls/search.json?sort=date&organization=fda+usda";
    if (query != null && query != 'recent')
        url = url + "&query=" + query;
    $.getJSON(url)
        .done(function (json) {
            $.each(json, function () {
                if (this.results.length != 0) {
                    $.each(this.results, function (i, data) {
                        foodsVM.foods.push(new Food(
                            this.recall_number,
                            this.recall_date,
                            this.recall_url,
                            this.organization,
                            this.summary,
                            this.description
                            ));
                    });
                }
                else
                    showSearchError("There were no results from this search. Please try another search. To search for recent recalls use 'recent' as the search term.");
            })
                       
            ko.applyBindings(foodsVM, document.getElementById("foods-list"));
            setClick();
            if (query != null)
                _backstack.stackpages = [];
            pageNav(new stackpage("#foods-list", pagename));
            waitOff();
        })
        .fail(function () {
            waitOff(); 
            pageNav(new stackpage("#neterror-page", "oops!"))
        });
}


function showFood(rnum) {
    waitOn();
    ko.cleanNode(document.getElementById("food-page"));
    var selectedFood = foodsVM.foods.filter(function (food) { return food.recallNumber == rnum });
    var viewModel = {
        food: [selectedFood[0]]
    };
    ko.applyBindings(viewModel, document.getElementById("food-page"));
    pageNav(new stackpage("#food-page", selectedFood[0].summary.toString().toLowerCase()));
    waitOff();
}

function showPage(pageId, pageTitle, fdirection) {
    fdirection = typeof fdirection !== 'undefined' ? fdirection : "right";
    $('html, body').animate({ scrollTop: 0 }, 0);
    $('*[data-role="page"]').hide();
    $("#page-title").html(pageTitle);
    $(pageId).show("slide", { direction: fdirection, easing: 'easeOutQuint' }, 1000);
}

function itemClick(obj) {
    
    if ($(obj).data('clicktype') == "food") {
        showFood($(obj).data('rnum'));
    }
}

function waitOn() {
    $('#wp-waiting').show();
}

function waitOff() {
    $('#wp-waiting').hide();
}

function pageNav(spage) {
    if (spage != "null") {
        _backstack.stackpages.push(spage);
        showPage(spage.pageId, spage.pageTitle);
    }
    else {
        _backstack.stackpages.pop();
        var ln = _backstack.stackpages.length - 1;
        var pg = _backstack.stackpages[ln];
        
        //reset food list if going back to select a new food
        //if (pg.pageId == "#state-list")
        //    newHospitals();
        showPage(pg.pageId, pg.pageTitle, "left");
    }

    if (_backstack.stackpages.length-1 == 0) {
        try {
            AndroidFunction.backstackoff();
        }
        catch (err) {
            window.external.notify("backstackoff");
        }
    }
    else
        try {
            AndroidFunction.backstackon();
        }
        catch (err) {
            window.external.notify("backstackon");
        }
}

function showSearch() {
    $('#searchbox').toggle("slide", { direction: 'up'}, 600);
}

function dosearch() {
    var query = $('#search-text').val();
    if (query != '') {
        showSearch();
        var pagename = "search: " + query;
        $('#searcherror').hide();
        showFoods(query, pagename);
    }
    else {
        showSearchError("You didn't enter any search terms. Please enter a query and try again.");

    }
    $('#search-text').val('');
    return false;
}

function showSearchError(message) {
    $('#searchErrorMsg').text(message);
    $('#searcherror').show();
}