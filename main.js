
$(document).ready(function() {
     
    var dataset = new Plottable.Dataset([{town: "Hoboken", avgHomeCost: 930000, avgTax: 22000 },
        { town: "Weehawken", avgHomeCost: 450000, avgTax: 18000 },
        { town: "Jersey City", avgHomeCost: 750000, avgTax: 20000 },
        { town: "Paramus", avgHomeCost: 1200000, avgTax: 10000},
        { town: "Edgewater", avgHomeCost: 550000, avgTax: 15000 },
    ]);

    // all sizes are provided as a % of total wheel size
    var config = {
        centerArcWidth: 7, //radius of center as % of available space
        labelArcWidth: 4, //distance between inner and outer radius of the label arc
        dragToRotate: true,
        outlineStrokeWidth: 0.5,
        colorRange: ["#C76652", "#5279C7"]
    };

    config.dataset = dataset;

    var wheel = new clusterWheel(config);

    wheel.addPie()
        .setDataset(dataset, function(d) { return d.avgTax})
        .setLabels(function(d) { return '$' + d.avgTax.toLocaleString()})
        .addClass("change")


    wheel.addPie()
        .setDataset(dataset, function(d) { return d.avgHomeCost})
        .setLabels(function(d) { return '$'+ d.avgHomeCost.toLocaleString()})
        .addClass("limit")

    wheel.setSectionLabels(dataset, function(d) { return d.town; });

    wheel.render("svg#wheel");
});