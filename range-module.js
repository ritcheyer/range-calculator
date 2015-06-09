

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
        rangeSettings.wheelFPS   = configJson.wheelFPS;
        rangeSettings.speedIndex = configJson.speedIndex;
        rangeSettings.speed      = configJson.speed;
        rangeSettings.tempIndex  = configJson.temperatureIndex;
        rangeSettings.temp       = configJson.temperature;
        rangeSettings.ac         = configJson.ac.replace("ac","").toLowerCase();;
        rangeSettings.wheels     = configJson.wheels.replace("Wheels","");
        rangeSettings.windows    = configJson.windows.replace("Windows","").toLowerCase();
        rangeSettings.season     = configJson.season;
        rangeSettings.road       = configJson.road;
        rangeSettings.lights     = configJson.lights.replace("Lights","").toLowerCase();
    });

});
    var needIeFallback = $('html').hasClass('lt-ie9');

// ***********************
// grab the range data JSON files and set into local obj
function initializeRangeData() {
    var jsonDir = "data/";
    var region = Drupal.settings.tesla.unit;

    // grab the 4 json file data for imperial unit countries
    $.when( $.getJSON(jsonDir + region + '70DMiles.json'),
            $.getJSON(jsonDir + region + '85Miles.json'),
            $.getJSON(jsonDir + region + '85DMiles.json'),
            $.getJSON(jsonDir + region + 'P85DMiles.json') )
    // set global data for later use
    .done(function( json1, json2, json3, json4 ) {
            rangeData.rangedata_70D  = json1[0];
            rangeData.rangedata_85   = json2[0];
            rangeData.rangedata_85D  = json3[0];
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

    rangeSettings.speedIndex    = $(".range-controls--speed .spinner-number").data('oldvalue');
    rangeSettings.tempIndex     = $(".range-controls--temperature .spinner-number").data('oldvalue');
    rangeSettings.ac            = $(".range-controls--airconditioning .controls-data").data('value');

    rangeSettings.speed         = configJson.speedRange[rangeSettings.speedIndex];
    rangeSettings.temp          = configJson.outsideTemps[rangeSettings.tempIndex];
    rangeSettings.wheels        = $(".range-controls--wheels input:checked").val();

    $(".battery-option.BT70D .battery-range-content").html(getRangesForBatteries("70D"));
    $(".battery-option.BT85 .battery-range-content").html(getRangesForBatteries("85"));
    $(".battery-option.BT85D .battery-range-content").html(getRangesForBatteries("85D"));
    $(".battery-option.P85D .battery-range-content").html(getRangesForBatteries("P85D"));
    $(".battery-option.BT70D .battery-range-units").html(configJson.speedLabel.toUpperCase());
    $(".battery-option.BT85 .battery-range-units").html(configJson.speedLabel.toUpperCase());
    $(".battery-option.BT85D .battery-range-units").html(configJson.speedLabel.toUpperCase());
    $(".battery-option.P85D .battery-range-units").html(configJson.speedLabel.toUpperCase());

    $(".range-controls--speed .spinner-number").text(rangeSettings.speed);
    $(".range-controls--speed .spinner-unit").text(configJson.measurement);
    $(".range-controls--temperature .spinner-number").text(rangeSettings.temp);

    if (rangeSettings.wheels == '19') {
        $(".wheels-front").removeClass("wheels-twentyone").addClass("wheels-nineteen");
        $(".wheels-rear").removeClass("wheels-twentyone").addClass("wheels-nineteen");
    } else {
        $(".wheels-front").removeClass("wheels-nineteen").addClass("wheels-twentyone");
        $(".wheels-rear").removeClass("wheels-nineteen").addClass("wheels-twentyone");
    }

    // speed spinner
    var increaseSpeedRangeSpinner = $(".range-controls--speed .spinner-controls--increase"),
        decreaseSpeedRangeSpinner = $(".range-controls--speed .spinner-controls--decrease");

    if (parseInt(rangeSettings.speedIndex) === configJson.speedRange.length - 1) {
        if(needIeFallback) {
            increaseSpeedRangeSpinner.addClass("disabled");
        } else {
            increaseSpeedRangeSpinner.attr("disabled", "disabled");
        }
    } else if (parseInt(rangeSettings.speedIndex) === 0) {
        if(needIeFallback) {
            decreaseSpeedRangeSpinner.addClass("disabled");
        } else {
            decreaseSpeedRangeSpinner.attr("disabled", "disabled");
        }
    } else {
        if(needIeFallback) {
            increaseSpeedRangeSpinner.removeClass("disabled");
            decreaseSpeedRangeSpinner.removeClass("disabled");
        } else {
            increaseSpeedRangeSpinner.removeAttr("disabled");
            decreaseSpeedRangeSpinner.removeAttr("disabled");
        }
    }

    // temperature spinner
    var increaseTemperatureRangeSpinner = $(".range-controls--temperature .spinner-controls--increase"),
        decreaseTemperatureRangeSpinner = $(".range-controls--temperature .spinner-controls--decrease");

    if (parseInt(rangeSettings.tempIndex) === configJson.outsideTemps.length - 1) {
        if(needIeFallback) {
            decreaseTemperatureRangeSpinner.addClass("disabled");
        } else {
            decreaseTemperatureRangeSpinner.attr("disabled", "disabled");
        }
    } else if (parseInt(rangeSettings.tempIndex) === 0) {
        if(needIeFallback) {
            increaseTemperatureRangeSpinner.addClass("disabled");
        } else {
            increaseTemperatureRangeSpinner.attr("disabled", "disabled");
        }
    } else {
        if(needIeFallback) {
            increaseTemperatureRangeSpinner.removeClass("disabled");
            decreaseTemperatureRangeSpinner.removeClass("disabled");
        } else {
            increaseTemperatureRangeSpinner.removeAttr("disabled");
            decreaseTemperatureRangeSpinner.removeAttr("disabled");
        }
    }

    // air conditioning spinner
    if (rangeSettings.tempIndex >= 3) {

        $(".range-controls--airconditioning .controls-text").text('Heat ' + rangeSettings.ac);
        if(rangeSettings.ac === "on") {
            $(".range-controls--airconditioning").removeClass('climate-on climate-off climate-heat climate-ac').addClass('climate-on climate-heat');
        } else {
            $(".range-controls--airconditioning").removeClass('climate-on climate-off climate-heat climate-ac').addClass('climate-off climate-heat');
        }
    } else {

        $(".range-controls--airconditioning .controls-text").text('AC ' + rangeSettings.ac);
        if(rangeSettings.ac === "on") {
            $(".range-controls--airconditioning").removeClass('climate-on climate-off climate-heat climate-ac').addClass('climate-on climate-ac');
        } else {
            $(".range-controls--airconditioning").removeClass('climate-on climate-off climate-heat climate-ac').addClass('climate-off climate-ac');
        }
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
    if ($(".range-controls--speed .spinner-controls--increase").length) {
        $(".range-controls--speed .spinner-controls--increase").unbind("click");
        $(".range-controls--speed .spinner-controls--increase").click(function() {
            setSpeedIndex($(".range-controls--speed .spinner-number").data('oldvalue'), "up");
        });
    }
    if ($(".range-controls--speed .spinner-controls--decrease").length) {
        $(".range-controls--speed .spinner-controls--decrease").unbind("click");
        $(".range-controls--speed .spinner-controls--decrease").click(function() {
            setSpeedIndex($(".range-controls--speed .spinner-number").data('oldvalue'), "down");
        });
    }
    if ($(".range-controls--temperature .spinner-controls--increase").length) {
        $(".range-controls--temperature .spinner-controls--increase").unbind("click");
        $(".range-controls--temperature .spinner-controls--increase").click(function() {
            setTemperature($(".range-controls--temperature .spinner-number").data('oldvalue'), "up");
        });
    }
    if ($(".range-controls--temperature .spinner-controls--decrease").length) {
        $(".range-controls--temperature .spinner-controls--decrease").unbind("click");
        $(".range-controls--temperature .spinner-controls--decrease").click(function() {
            setTemperature($(".range-controls--temperature .spinner-number").data('oldvalue'), "down");
        });
    }
    if ($(".range-controls--airconditioning .controls-data").length) {
        $(".range-controls--airconditioning .controls-data").unbind("click");
        $(".range-controls--airconditioning .controls-data").click(function() {
            setAC($(".range-controls--airconditioning .controls-data").data('value'));
        });
    }

    if ($(".range-controls--wheels input").length) {
        $(".range-controls--wheels input").unbind("click");
        $(".range-controls--wheels input").click(function() {
            setWheels($(this));
        });
    }
}

// ***********************
// initialize default values for controls
function initDefaultData() {
    $(".range-controls--speed .spinner-number").data('oldvalue', configJson.speedIndex);
    $(".range-controls--temperature .spinner-number").data('oldvalue', configJson.temperatureIndex);

    $(".range-controls--airconditioning .controls-data").data('value', rangeSettings.ac)
    $(".range-controls--wheels input").data('value', rangeSettings.wheels);
}

// ***********************
// initialize wheel animation
function initializeAnimations() {
    console.log("initializing animations");
    var framerate = rangeSettings.wheelFPS[rangeSettings.speedIndex];

     try {
         // wheels sprite sheet animation
         this.$el.find('#front-wheels, #rear-wheels').sprite({
            fps: framerate,
            no_of_frames: 12
         });
     }
     catch (error) {
         //alert("initializeAnimations: Could not init wheel sprite.");
     }

     // this.running = true;
     // module.on('scroll', this.handleScroll, this);
     // module.on('scrollStop', this.handleScrollStop, this);
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
    $(".range-controls--speed .spinner-number").data('oldvalue', newSpeedIndex);

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
    $(".range-controls--temperature .spinner-number").data('oldvalue', newTempIndex);

    updateUI();
}

// ***********************
// set the current data based on AC button selection
function setAC(onOff) {

    if (onOff === "on") {
        $(".range-controls--airconditioning .controls-data").prop('checked', false);
        rangeSettings.ac = "off";
    }
    else {
        $(".range-controls--airconditioning .controls-data").prop('checked', true);
        rangeSettings.ac = "on";
    }

    $(".range-controls--airconditioning .controls-data").data('value', rangeSettings.ac);

    updateUI();
}

// ***********************
// set the current wheels based on user selection
function setWheels(wheelSize) {

    // console.log('setting me');

    // console.log(wheelSize);
    // console.log(wheelSize.val());

    rangeSettings.wheels = wheelSize.val();
    $('.controls-wheelsize label').removeClass('selected');

    if(wheelSize.val() == '19') {
        $(".wheelsize-nineteen").addClass('selected');
    } else {
        $(".wheelsize-twentyone").addClass('selected');
    }



    updateUI();
}
