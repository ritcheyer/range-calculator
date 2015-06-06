

var configJson;
var configJsonPath = "data/config.json";
var rangeData = {};
var rangeSettings = {};

// debug
var Drupal = {};
Drupal.settings = {};
Drupal.settings.tesla = {
    "country": "US",
    "locale": "en_US",
    "localePrefix": "",
    "region": "US"
};

switch (Drupal.settings.tesla.locale) {
    case 'en_GB':
        Drupal.settings.tesla.unit = 'hybrid';
        break;
    case 'en_CA':
    case 'fr_CA':
    case 'en_EU':
    case 'de_DE':
    case 'de':
    case 'fr_BE':
    case 'nl_BE':
    case 'da_DK':
    case 'it_IT':
    case 'it_CH':
    case 'nl_NL':
    case 'no_NO':
    case 'sv_SE':
    case 'de_AT':
    case 'de_CH':
    case 'fr_CH':
    case 'fr_FR':
    case 'fi_FI':
    case 'ja_JP':
    case 'zh_CN':
        Drupal.settings.tesla.unit = 'metric';
        break;
    default:
        Drupal.settings.tesla.unit = 'imperial';
        break;
}

$(document).ready(function() {
    // get the configuration data based on locale
    $.getJSON( configJsonPath, function( data ) {
        configJson = data[Drupal.settings.tesla.unit];
    })
    .done(function() {
        initializeRangeData();
        // default settings
        rangeSettings.speedIndex = configJson.speedIndex;
        rangeSettings.speed     = configJson.speed;
        rangeSettings.tempIndex = configJson.temperatureIndex;
        rangeSettings.temp      = configJson.temperature;
        rangeSettings.ac        = configJson.ac.replace("ac","").toLowerCase();;
        rangeSettings.wheels    = configJson.wheels.replace("Wheels","");
        rangeSettings.windows   = configJson.windows.replace("Windows","").toLowerCase();
        rangeSettings.season    = configJson.season;
        rangeSettings.road      = configJson.road;
        rangeSettings.lights    = configJson.lights.replace("Lights","").toLowerCase();
    });
});

// ***********************
// grab the range data JSON files and set into local obj
function initializeRangeData() {
    var jsonDir = "/range/data/";
    // debug.error('start initializeRangeData');
    var region = Drupal.settings.tesla.unit;

    // grab the 4 json file data for imperial unit countries
    $.when( $.getJSON(jsonDir + region + '70DMiles.json'),
            $.getJSON(jsonDir + region + '85Miles.json'),
            $.getJSON(jsonDir + region + '85DMiles.json'),
            $.getJSON(jsonDir + region + 'P85DMiles.json') )
    // set global data for later use
    .done(function( json1, json2, json3, json4 ) {
            rangeData.rangedata_70D = json1[0];
            rangeData.rangedata_85 = json2[0];
            rangeData.rangedata_85D = json3[0];
            rangeData.rangedata_P85D = json4[0];
    })
    // update the UI
    .then(function() {
        initDefaultData();
        updateUI();
        initButtons();
    });
}

// ***********************
// Update the UI elements after calculations
function updateUI() {

    rangeSettings.speedIndex    = $("#controls-current-speed").val();
    rangeSettings.speed         = configJson.speedRange[rangeSettings.speedIndex];
    rangeSettings.tempIndex     = $("#controls-current-temp").val();
    rangeSettings.temp          = configJson.outsideTemps[rangeSettings.tempIndex];
    rangeSettings.ac            = $("#controls-current-ac").val();
    rangeSettings.wheels        = $("#controls-current-wheel").val();

    $("#batt_70D_stat .wf-datalabel-content").html(getRangesForBatteries("70D"));
    $("#batt_85_stat .wf-datalabel-content").html(getRangesForBatteries("85"));
    $("#batt_85D_stat .wf-datalabel-content").html(getRangesForBatteries("85D"));
    $("#batt_P85D_stat .wf-datalabel-content").html(getRangesForBatteries("P85D"));
    $("#batt_70D_stat .wf-datalabel-units").html(configJson.speedLabel.toUpperCase());
    $("#batt_85_stat .wf-datalabel-units").html(configJson.speedLabel.toUpperCase());
    $("#batt_85D_stat .wf-datalabel-units").html(configJson.speedLabel.toUpperCase());
    $("#batt_P85D_stat .wf-datalabel-units").html(configJson.speedLabel.toUpperCase());

    $("#controls-speed .controls-data").html(rangeSettings.speed);
    $("#controls-speed .controls-unit").html(configJson.measurement);

    $("#controls-temp .controls-data").html(rangeSettings.temp);

    if (rangeSettings.wheels === "19") {
        $("#controls-wheels-21 .controls-control-box").removeClass("selected");
        $("#controls-wheels-19 .controls-control-box").addClass("selected");
        $(".range-hero .range-hero-wheels-left").removeClass("twentyone");
        $(".range-hero .range-hero-wheels-right").removeClass("twentyone");
        $(".range-hero .range-hero-wheels-left").addClass("nineteen");
        $(".range-hero .range-hero-wheels-right").addClass("nineteen");
    } else {
        $("#controls-wheels-19 .controls-control-box").removeClass("selected");
        $("#controls-wheels-21 .controls-control-box").addClass("selected");
        $(".range-hero .range-hero-wheels-left").removeClass("nineteen");
        $(".range-hero .range-hero-wheels-right").removeClass("nineteen");
        $(".range-hero .range-hero-wheels-left").addClass("twentyone");
        $(".range-hero .range-hero-wheels-right").addClass("twentyone");
    }

    $("#controls-ac #controls-ac-onoff").removeClass();
    if (rangeSettings.tempIndex >= 3) {
        $("#controls-ac #controls-ac-onoff").addClass("heat" + rangeSettings.ac);
    }
    else {
        $("#controls-ac #controls-ac-onoff").addClass("ac" + rangeSettings.ac);
    }

    if (parseInt(rangeSettings.speedIndex) === configJson.speedRange.length - 1) {
        $("#controls-speed .controls-arrows-up").addClass("disabled");
    }
    else if (parseInt(rangeSettings.speedIndex) === 0) {
        $("#controls-speed .controls-arrows-down").addClass("disabled");
    }
    else {
        $("#controls-speed .controls-arrows-up").removeClass("disabled");
        $("#controls-speed .controls-arrows-down").removeClass("disabled");
    }

    if (parseInt(rangeSettings.tempIndex) === configJson.outsideTemps.length - 1) {
        $("#controls-temp .controls-arrows-down").addClass("disabled");
    }
    else if (parseInt(rangeSettings.tempIndex) === 0) {
        $("#controls-temp .controls-arrows-up").addClass("disabled");
    }
    else {
        $("#controls-temp .controls-arrows-up").removeClass("disabled");
        $("#controls-temp .controls-arrows-down").removeClass("disabled");
    }

}

// ***********************
// get the range data from the battery specific JSON
// @batteryId => battery type [70D, 85, 85D, P85D]
// @speed => current speed selected by user
function getRangesForBatteries(batteryId, speed) {

    var tmpRangeData = rangeData["rangedata_" + batteryId];
    var miles;

    _.each(tmpRangeData, function(v, k) {
        if (v.ac == rangeSettings.ac && v.lights == rangeSettings.lights && v.windows == rangeSettings.windows && v.temp == rangeSettings.temp && v.wheelsize == rangeSettings.wheels) {
            _.each(v.hwy, function(vv, kk) {
                if (rangeSettings.speed == vv.mph) {
                    miles = vv.miles;
                }
            });
        }
    });

    return Math.round(miles);

}

// ***********************
// initialize the click handlers for controls
function initButtons() {

    if ($("#controls-speed .controls-arrows-up").length) {
        $("#controls-speed .controls-arrows-up").unbind("click");
        $("#controls-speed .controls-arrows-up").click(function() {
            setSpeedIndex($("#controls-current-speed").val(), "up");
        });
    }
    if ($("#controls-speed .controls-arrows-down").length) {
        $("#controls-speed .controls-arrows-down").unbind("click");
        $("#controls-speed .controls-arrows-down").click(function() {
            setSpeedIndex($("#controls-current-speed").val(), "down");
        });
    }
    if ($("#controls-temp .controls-arrows-up").length) {
        $("#controls-temp .controls-arrows-up").unbind("click");
        $("#controls-temp .controls-arrows-up").click(function() {
            setTemperature($("#controls-current-temp").val(), "up");
        });
    }
    if ($("#controls-temp .controls-arrows-down").length) {
        $("#controls-temp .controls-arrows-down").unbind("click");
        $("#controls-temp .controls-arrows-down").click(function() {
            setTemperature($("#controls-current-temp").val(), "down");
        });
    }
    if ($("#controls-ac #controls-ac-onoff").length) {
        $("#controls-ac #controls-ac-onoff").unbind("click");
        $("#controls-ac #controls-ac-onoff").click(function() {
            setAC($("#controls-current-ac").val());
        });
    }
    if ($("#controls-wheels-19").length) {
        $("#controls-wheels-19").unbind("click");
        $("#controls-wheels-19").click(function() {
            setWheels(19);
        });
    }
    if ($("#controls-wheels-21").length) {
        $("#controls-wheels-21").unbind("click");
        $("#controls-wheels-21").click(function() {
            setWheels(21);
        });
    }

}

// ***********************
// initialize default values for controls
function initDefaultData() {

    $("#controls-current-speed").val(configJson.speedIndex);
    $("#controls-current-temp").val(configJson.temperatureIndex);
    $("#controls-current-ac").val(rangeSettings.ac);
    $("#controls-current-wheel").val(rangeSettings.wheels);

}

// ***********************
// set the current speed from user selection
function setSpeedIndex(currentSpeed, direction) {

    // set speed index
    var newSpeedIndex = direction === "up" ? parseInt(currentSpeed) + 1 : parseInt(currentSpeed) - 1;

    if (newSpeedIndex > configJson.speedRange.length - 1) {
        newSpeedIndex = currentSpeed;
    }
    if (newSpeedIndex < 0) {
        newSpeedIndex = 0;
    }

    rangeSettings.speedIndex = newSpeedIndex;
    $("#controls-current-speed").val(newSpeedIndex);

    updateUI();
}

// ***********************
// set the current temperature based on user selection
function setTemperature(currentTemp, direction) {

    var newTempIndex = direction === "up" ? parseInt(currentTemp) - 1 : parseInt(currentTemp) + 1;

    if (newTempIndex > configJson.outsideTemps.length - 1) {
        newTempIndex = currentTemp;
    }
    if (newTempIndex < 0) {
        newTempIndex = 0;
    }

    rangeSettings.tempIndex = newTempIndex;
    $("#controls-current-temp").val(newTempIndex);

    updateUI();
}

// ***********************
// set the current data based on AC button selection
function setAC(onOff) {

    if (onOff === "on") {
        rangeSettings.ac = "off";
    }
    else {
        rangeSettings.ac = "on";
    }

    $("#controls-current-ac").val(rangeSettings.ac);

    updateUI();
}

// ***********************
// set the current wheels based on user selection
function setWheels(wheelSize) {
    rangeSettings.wheels = wheelSize;
    $("#controls-current-wheel").val(wheelSize);
    updateUI();
}




















