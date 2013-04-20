var Normalizer = function () {

    var matchToSeconds = function(match) {
        var h = typeof match[1] === 'undefined' ? 0 : parseInt(match[1],10);
        var m = typeof match[2] === 'undefined' ? 0 : parseInt(match[2],10);
        var s = typeof match[3] === 'undefined' ? 0 : parseInt(match[3],10);

        return ((h * 60) + m) * 60 + s;
    };

    /**
     * Takes a string an attempts to determine a duration in seconds from it.
     *
     * Time might be written as:
     * * h:mm:ss
     * * m:ss
     * * s
     * * h [hours/hr/h] m [minutes/min/mins/m] s [seconds/sec/s]
     *
     * Unless the last number is qualified, it will be assumed to be seconds, the second last will be minutes, third
     * last will be hours. No bigger units are supported.
     *
     * @param t A string representing a duration
     */
    var normalizeTime = function (t) {
        if (typeof t === 'undefined') {
            return null;
        }

        t = String(t).trim();

        var colon_re = /(?:(?:(\d+):)?(\d{1,2}):)?(\d{1,2})$/;
        var text_re = /(?:(\d+)\s*(?:hours|hr|hrs|h)\s*)?(?:(\d+)\s*(?:minutes|min|mins|m)\s*)?(?:(\d+)\s*(?:seconds|sec|s))?/;

        var match = t.match(colon_re);
        if (match === null) {
            match = t.match(text_re);
            if (match === null) {
                return null;
            }
        }

        return new Qty(matchToSeconds(match) + " s");
    };

    /**
     * Takes a string and attempts to determine a speed in m/s from it.
     *
     * Speed might be written as
     * * # [distance_unit]/[time_unit]
     * * # [distance_unit] per [time_unit]
     *
     * @param v A string representing a speed
     */
    var normalizeSpeed = function(v) {
        var per_re = /\s*per\s*/;

        v = v.replace(per_re, '/');

        var speed = null;

        try {
            speed = new Qty(v);

            speed = speed.to("m/s");
        } catch (e) {
            return null;
        }

        return speed;
    };

    /**
     * Takes a string and attempts to determine a speed in m/s from it.
     *
     * Speed might be written as
     * * # [distance_unit]/[time_unit]
     * * # [distance_unit] per [time_unit]
     *
     * @param v A string representing a speed
     */
    var normalizePace = function(v) {
        var per_re = /\s*per\s*/;

        v = v.replace(per_re, '/');

        var colon_re = /(?:(?:(\d+):)?(\d{1,2}):)?(\d{1,2})\/([a-z\-]*)/;
        var text_re = /(?:(\d+)\s*(?:hours|hr|hrs|h)\s*)?(?:(\d+)\s*(?:minutes|min|mins|m)\s*)?(?:(\d+)\s*(?:seconds|sec|s))?\/([a-z\-]*)/;

        var match = v.match(colon_re);
        if (match === null) {
            match = v.match(text_re);
        }

        if (match !== null) {
            v = matchToSeconds(match) + " s/" + match[4];
        } else if (v.match(/\d+\s*\/[a-z\-]*/) === null) {
            //avoid unparseable values
            return null;
        }

        var pace = null;

        try {
            pace = new Qty(v);

            pace = pace.to("s/m");
        } catch (e) {
            return null;
        }

        return pace;
    };

    var normalizeDistance = function(d) {
        var per_re = /\s*per\s*/;

        d = d.replace(per_re, '/');

        var distance = null;

        try {
            distance = new Qty(d);

            distance = distance.to("m");
        } catch (e) {
            return null;
        }

        return distance;
    };

    return {
        "normalizeTime": normalizeTime,
        "normalizeSpeed": normalizeSpeed,
        "normalizePace": normalizePace,
        "normalizeDistance": normalizeDistance
    };
}();

var Formatter = function() {
    var formatSecondsAsHMMSS = function(seconds) {
        var h = Math.floor(seconds/3600);
        var m = Math.floor((seconds-h*3600)/60);
        var s = Math.round(seconds-h*3600-m*60);

        return h + ':' + (m<10?'0':'') + m + ':' + (s<10?'0':'') + s;
    };

    return {
        "formatSecondsAsHMMSS": formatSecondsAsHMMSS
    };
}();

var Movementium = function (n, f) {
    const MODE_VELOCITY = 'velocity', MODE_DISTANCE = 'distance', MODE_TIME = 'time';
    const MODE_SPEED = 'speed', MODE_PACE = 'pace';
    const UNIT_METER = 'meter', UNIT_KILOMETER = 'kilometer', UNIT_YARD = 'yard', UNIT_MILE = 'mile',
        UNIT_SECOND = 'second', UNIT_HMS = 'hms',
        UNIT_METERSPERSECOND = 'meterspersecond', UNIT_KPH = 'kph', UNIT_MPH = 'mph';

    var mode = null;
    var velocity_mode = null;

    var operator = null;

    var unit = {
        "distance": null,
        "time": null,
        "pace": null,
        "speed": null
    };

    var input = {
        "velocity": null,
        "distance": null,
        "time": null,
        "pace": null,
        "speed": null
    };

    var normalized = {
        "velocity": null,
        "distance": null,
        "time": null,
        "pace": null,
        "speed": null
    };

    var container = {
        "content": null,
        "velocity": null,
        "distance": null,
        "time": null,
        "speed": null,
        "pace": null,
        "operand": null,
        "operand1": null,
        "operand2": null,
        "operand3": null,
        "operator": null
    };

    var menu = {
        "mode": null,
        "calc_mode": {
            "velocity": null,
            "distance": null,
            "time": null
        },
        "velocity_mode": {
            "pace": null,
            "speed": null
        },
        "unit": null,
        "distance_unit": {
            "meter": null,
            "kilometer": null,
            "yard": null,
            "mile": null
        },
        "time_unit": {
            "second": null,
            "hms": null
        },
        "speed_unit": {
            "meterspersecond": null,
            "kph": null,
            "mph": null
        },
        "pace_unit": {
            "meter": null,
            "kilometer": null,
            "yard": null,
            "mile": null
        }
    };

    var button = {
        "mode_menu": null,
        "unit_menu": null,
        "unit_menu_back": null
    };

    var toggleModeMenu = function(event) {
        menu.unit.hide();

        if (menu.mode.css('display') === 'none') {
            $(document.body).addClass('left-menu-open');

            setTimeout(function(){ container.content.on('click', toggleModeMenu) }, 10);

            menu.mode.show();
        } else {
            $(document.body).removeClass('left-menu-open');

            container.content.off('click');

            menu.mode.hide();
        }
    };

    var toggleUnitMenu = function() {
        menu.mode.hide();

        if (menu.unit.css('display') === 'none') {
            $(document.body).addClass('right-menu-open');

            setTimeout(function(){ container.content.on('click', toggleUnitMenu) }, 10);

            menu.unit.show();
        } else {
            $(document.body).removeClass('right-menu-open');

            container.content.off('click');

            menu.unit.hide();
        }
    };

    var handleVariableChange = function() {
        var velocity;
        var distance = n.normalizeDistance(input.distance.val());
        var time = n.normalizeTime(input.time.val());

        if (velocity_mode == MODE_PACE) {
            velocity = n.normalizePace(input.velocity.val());

            if (mode === MODE_VELOCITY) {
                if (distance === null || time === null) {
                    //clear the velocity
                    velocity = '';
                } else {
                    velocity = time.div(distance);
                }
            } else if (mode === MODE_DISTANCE) {
                if (velocity === null || time === null) {
                    //clear the distance
                    distance = '';
                } else {
                    distance = time.div(velocity);
                }
            } else { //MODE_TIME
                if (velocity === null || distance === null) {
                    //clear the time
                    time = '';
                } else {
                    time = velocity.mul(distance);
                }
            }
        } else { //MODE_SPEED
            velocity = n.normalizeSpeed(input.velocity.val());

            if (mode === MODE_VELOCITY) {
                if (distance === null || time === null) {
                    //clear the velocity
                    velocity = '';
                } else {
                    velocity = distance.div(time);
                }
            } else if (mode === MODE_DISTANCE) {
                if (velocity === null || time === null) {
                    //clear the distance
                    distance = '';
                } else {
                    distance = time.mul(velocity);
                }
            } else { //MODE_TIME
                if (velocity === null || distance === null) {
                    //clear the time
                    time = '';
                } else {
                    time = distance.div(velocity);
                }
            }
        }

        //convert to user-specified unit
        if (distance !== null && distance !== '') {
            distance = distance.to(unit.distance).toPrec('0.001 '+unit.distance);
        }

        if (time !== null && time !== '') {
            if (unit.time === UNIT_HMS) {
                time = f.formatSecondsAsHMMSS(time.scalar);
            } else {
                time = time.toPrec('0.001 s');
            }
        }

        if (velocity !== null && velocity !== '') {
            if (velocity_mode == MODE_PACE) {

                var postfix = '';
                if (unit.pace === UNIT_METER) {
                    postfix = '/m';
                } else if (unit.pace === UNIT_KILOMETER) {
                    velocity = velocity.to('s/km');
                    postfix = '/km';
                } else if (unit.pace === UNIT_YARD) {
                    velocity = velocity.to('s/yd');
                    postfix = '/yd';
                } else if (unit.pace === UNIT_MILE) {
                    velocity = velocity.to('s/mi');
                    postfix = '/mi';
                }

                if (unit.time === UNIT_HMS) {
                    velocity = f.formatSecondsAsHMMSS(velocity.scalar) + postfix;
                } else {
                    velocity = velocity.toPrec('0.001 '+velocity.units());
                }
            } else { //MODE_SPEED
                if (unit.speed === UNIT_KPH) {
                    velocity = velocity.to('km/h').toPrec('0.001 km/h');
                } else if (unit.speed === UNIT_MPH) {
                    velocity = velocity.to('mi/h').toPrec('0.001 mi/h');
                }
            }
        }

        if (mode === MODE_VELOCITY) {
            input.velocity.val(velocity);
        } else if (mode === MODE_DISTANCE) {
            input.distance.val(distance);
        } else { //MODE_TIME
            input.time.val(time);
        }

        normalized.velocity.text(velocity === null ? '' : velocity);
        normalized.distance.text(distance === null ? '' : distance);
        normalized.time.text(time === null ? '' : time);
    };

    var handleModeChange = function() {
        if (velocity_mode == MODE_PACE) {
            input.velocity = input.pace;
            normalized.velocity = normalized.pace;
            container.velocity = container.pace;

            container.speed.appendTo(container.operand);
            input.speed.removeAttr('readonly');

            if (mode === MODE_VELOCITY) {
                container.time.appendTo(container.operand1);
                container.distance.appendTo(container.operand2);
                container.velocity.appendTo(container.operand3);

                input.velocity.attr('readonly', 'readonly');
                input.time.removeAttr('readonly');
                input.distance.removeAttr('readonly');

                operator = '/';
            } else if (mode === MODE_DISTANCE) {
                container.time.appendTo(container.operand1);
                container.velocity.appendTo(container.operand2);
                container.distance.appendTo(container.operand3);

                input.distance.attr('readonly', 'readonly');
                input.time.removeAttr('readonly');
                input.velocity.removeAttr('readonly');

                operator = '/';
            } else { //MODE_TIME
                container.velocity.appendTo(container.operand1);
                container.distance.appendTo(container.operand2);
                container.time.appendTo(container.operand3);

                input.time.attr('readonly', 'readonly');
                input.velocity.removeAttr('readonly');
                input.distance.removeAttr('readonly');

                operator = 'x';
            }
        } else { //MODE_SPEED
            input.velocity = input.speed;
            normalized.velocity = normalized.speed;
            container.velocity = container.speed;

            container.pace.appendTo(container.operand);

            if (mode === MODE_VELOCITY) {
                container.distance.appendTo(container.operand1);
                container.time.appendTo(container.operand2);
                container.velocity.appendTo(container.operand3);

                input.velocity.attr('readonly', 'readonly');
                input.time.removeAttr('readonly');
                input.distance.removeAttr('readonly');

                operator = '/';
            } else if (mode === MODE_DISTANCE) {
                container.velocity.appendTo(container.operand1);
                container.time.appendTo(container.operand2);
                container.distance.appendTo(container.operand3);

                input.distance.attr('readonly', 'readonly');
                input.velocity.removeAttr('readonly');
                input.time.removeAttr('readonly');

                operator = 'x';
            } else { //MODE_TIME
                container.distance.appendTo(container.operand1);
                container.velocity.appendTo(container.operand2);
                container.time.appendTo(container.operand3);

                input.time.attr('readonly', 'readonly');
                input.velocity.removeAttr('readonly');
                input.distance.removeAttr('readonly');

                operator = '/';
            }
        }

        container.operator.text(operator);

        updateModeMenu();

        handleVariableChange();
    };

    var updateModeMenu = function() {
        menu.mode.find('li').removeClass("active");

        menu.calc_mode[mode].addClass("active");
        menu.velocity_mode[velocity_mode].addClass("active");
    };

    var handleUnitChange = function() {
        updateUnitMenu();

        handleVariableChange();
    };

    var updateUnitMenu = function() {
        menu.unit.find('li').removeClass("active");

        menu.distance_unit[unit.distance].addClass("active");
        menu.time_unit[unit.time].addClass("active");
        menu.speed_unit[unit.speed].addClass("active");
        menu.pace_unit[unit.pace].addClass("active");
    };

    var init = function(options) {
        input.distance = $(options.ref.distance_input);
        input.pace = $(options.ref.pace_input);
        input.speed = $(options.ref.speed_input);
        input.time = $(options.ref.time_input);

        normalized.distance = $(options.ref.distance_normalized);
        normalized.pace = $(options.ref.pace_normalized);
        normalized.speed = $(options.ref.speed_normalized);
        normalized.time = $(options.ref.time_normalized);

        container.content = $(options.ref.content);

        container.distance = $(options.ref.distance_container);
        container.pace = $(options.ref.pace_container);
        container.time = $(options.ref.time_container);
        container.speed = $(options.ref.speed_container);

        container.operand = $(options.ref.operand_container);
        container.operand1 = $(options.ref.operand1_container);
        container.operand2 = $(options.ref.operand2_container);
        container.operand3 = $(options.ref.operand3_container);

        container.operator = $(options.ref.operator_container);

        menu.mode = $(options.ref.menu_mode);

        menu.calc_mode.distance = $(options.ref.menu_distance);
        menu.calc_mode.time = $(options.ref.menu_time);
        menu.calc_mode.velocity = $(options.ref.menu_velocity);

        menu.velocity_mode.pace = $(options.ref.menu_pace);
        menu.velocity_mode.speed = $(options.ref.menu_speed);

        menu.unit = $(options.ref.menu_unit);

        menu.distance_unit.meter = $(options.ref.menu_meter_distance);
        menu.distance_unit.kilometer = $(options.ref.menu_kilometer_distance);
        menu.distance_unit.yard = $(options.ref.menu_yard_distance);
        menu.distance_unit.mile = $(options.ref.menu_mile_distance);

        menu.time_unit.second = $(options.ref.menu_second_time);
        menu.time_unit.hms = $(options.ref.menu_hms_time);

        menu.speed_unit.meterspersecond = $(options.ref.menu_meterspersecond_speed);
        menu.speed_unit.kph = $(options.ref.menu_kph_speed);
        menu.speed_unit.mph = $(options.ref.menu_mph_speed);

        menu.pace_unit.meter = $(options.ref.menu_meter_pace);
        menu.pace_unit.kilometer = $(options.ref.menu_kilometer_pace);
        menu.pace_unit.yard = $(options.ref.menu_yard_pace);
        menu.pace_unit.mile = $(options.ref.menu_mile_pace);

        button.mode_menu = $(options.ref.button_mode_menu);
        button.unit_menu = $(options.ref.button_unit_menu);
        button.unit_menu_back = $(options.ref.button_unit_menu_back);

        velocity_mode = options.velocity_mode;
        mode = options.calc_mode;

        unit.distance = options.distance_unit;
        unit.pace = options.pace_unit;
        unit.speed = options.speed_unit;
        unit.time = options.time_unit;

        //clear the inputs in case they were auto-filled by the browser
        input.distance.val('');
        input.pace.val('');
        input.speed.val('');
        input.time.val('');

        handleModeChange();
        handleUnitChange();

        var modeChangeHandler = function(event) {
            mode = event.data;
            toggleModeMenu();
            handleModeChange();
        };

        menu.calc_mode.distance.on('click', null, MODE_DISTANCE, modeChangeHandler);
        menu.calc_mode.time.on('click', null, MODE_TIME, modeChangeHandler);
        menu.calc_mode.velocity.on('click', null, MODE_VELOCITY, modeChangeHandler);

        var velocityModeChangeHandler = function(event) {
            velocity_mode = event.data;
            toggleModeMenu(event);
            handleModeChange();
        };

        menu.velocity_mode.pace.on('click', null, MODE_PACE, velocityModeChangeHandler);
        menu.velocity_mode.speed.on('click', null, MODE_SPEED, velocityModeChangeHandler);

        var unitChangeHandler = function(event) {
            unit[event.data.type] = event.data.unit;
            toggleUnitMenu(event);
            handleUnitChange();
        };

        menu.distance_unit.meter.on('click', null, {"type": "distance", "unit": UNIT_METER}, unitChangeHandler);
        menu.distance_unit.kilometer.on('click', null, {"type": "distance", "unit": UNIT_KILOMETER}, unitChangeHandler);
        menu.distance_unit.yard.on('click', null, {"type": "distance", "unit": UNIT_YARD}, unitChangeHandler);
        menu.distance_unit.mile.on('click', null, {"type": "distance", "unit": UNIT_MILE}, unitChangeHandler);

        menu.time_unit.second.on('click', null, {"type": "time", "unit": UNIT_SECOND}, unitChangeHandler);
        menu.time_unit.hms.on('click', null, {"type": "time", "unit": UNIT_HMS}, unitChangeHandler);

        menu.speed_unit.meterspersecond.on('click', null, {"type": "speed", "unit": UNIT_METERSPERSECOND}, unitChangeHandler);
        menu.speed_unit.kph.on('click', null, {"type": "speed", "unit": UNIT_KPH}, unitChangeHandler);
        menu.speed_unit.mph.on('click', null, {"type": "speed", "unit": UNIT_MPH}, unitChangeHandler);

        menu.pace_unit.meter.on('click', null, {"type": "pace", "unit": UNIT_METER}, unitChangeHandler);
        menu.pace_unit.kilometer.on('click', null, {"type": "pace", "unit": UNIT_KILOMETER}, unitChangeHandler);
        menu.pace_unit.yard.on('click', null, {"type": "pace", "unit": UNIT_YARD}, unitChangeHandler);
        menu.pace_unit.mile.on('click', null, {"type": "pace", "unit": UNIT_MILE}, unitChangeHandler);

        button.mode_menu.on('click', toggleModeMenu);

        button.unit_menu.on('click', toggleUnitMenu);
        button.unit_menu_back.on('click', toggleUnitMenu);

        input.distance.on('blur', handleVariableChange);
        input.pace.on('blur', handleVariableChange);
        input.speed.on('blur', handleVariableChange);
        input.time.on('blur', handleVariableChange);
    };

    return {
        // contstants
        "MODE_VELOCITY": MODE_VELOCITY,
        "MODE_DISTANCE": MODE_DISTANCE,
        "MODE_TIME": MODE_TIME,
        "MODE_SPEED": MODE_SPEED,
        "MODE_PACE": MODE_PACE,
        "UNIT_METER": UNIT_METER,
        "UNIT_KILOMETER": UNIT_KILOMETER,
        "UNIT_YARD": UNIT_YARD,
        "UNIT_MILE": UNIT_MILE,
        "UNIT_SECOND": UNIT_SECOND,
        "UNIT_HMS": UNIT_HMS,
        "UNIT_METERSPERSECOND": UNIT_METERSPERSECOND,
        "UNIT_KPH": UNIT_KPH,
        "UNIT_MPH": UNIT_MPH,

        //public functions
        "init": init
    };
}(Normalizer, Formatter);


$(document).ready(function() {
    Movementium.init({
        "calc_mode": Movementium.MODE_VELOCITY,
        "velocity_mode": Movementium.MODE_PACE,
        "distance_unit": Movementium.UNIT_KILOMETER,
        "time_unit": Movementium.UNIT_HMS,
        "speed_unit": Movementium.UNIT_KPH,
        "pace_unit": Movementium.UNIT_KILOMETER,
        "ref": {
            "content": "#content",

            //variable inputs
            "distance_input": "#distance",
            "pace_input": "#pace",
            "time_input": "#time",
            "speed_input": "#speed",

            //variable containers
            "distance_container": "#distanceContainer",
            "pace_container": "#paceContainer",
            "time_container": "#timeContainer",
            "speed_container": "#speedContainer",

            //operand containers
            "operand_container": "#operandContainer",
            "operand1_container": "#operand1",
            "operand2_container": "#operand2",
            "operand3_container": "#operand3",

            //operator container
            "operator_container": "#operator",

            //normalized value containers
            "distance_normalized": "#distanceNormalized",
            "pace_normalized": "#paceNormalized",
            "time_normalized": "#timeNormalized",
            "speed_normalized": "#speedNormalized",

            //buttons
            "button_mode_menu": "#modeMenuButton",
            "button_unit_menu": "#unitMenuButton",
            "button_unit_menu_back": "#unitMenuBackButton",

            //menus
            "menu_mode": "#modeMenu",
            "menu_unit": "#unitMenu",

            //calc_mode menu
            "menu_velocity": "#velocityMode",
            "menu_distance": "#distanceMode",
            "menu_time": "#timeMode",

            //velocity mode menu
            "menu_pace": "#paceMode",
            "menu_speed": "#speedMode",

            //distance unit menu
            "menu_meter_distance": "#meterDistance",
            "menu_kilometer_distance": "#kilometerDistance",
            "menu_yard_distance": "#yardDistance",
            "menu_mile_distance": "#mileDistance",

            //time unit menu
            "menu_second_time": "#secondTime",
            "menu_hms_time": "#hmsTime",

            //speed unit menu
            "menu_meterspersecond_speed": "#metersPerSecondSpeed",
            "menu_kph_speed": "#kphSpeed",
            "menu_mph_speed": "#mphSpeed",

            //pace unit menu
            "menu_meter_pace": "#meterPace",
            "menu_kilometer_pace": "#kilometerPace",
            "menu_yard_pace": "#yardPace",
            "menu_mile_pace": "#milePace"
        }
    });
});