/*!
 * jQuery Chord Transposer plugin v1.0
 * http://codegavin.com/projects/transposer
 *
 * Copyright 2010, Jesse Gavin
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://codegavin.com/license
 *
 * Date: Sat Jun 26 21:27:00 2010 -0600
 */
(function($) {

    $.fn.transpose = function(options) {
        var opts = $.extend({}, $.fn.transpose.defaults, options);

        var currentKey = null;

        var keys = [
            { name: 'Ab',   value: 0,   type: 'F' },
            { name: 'A',    value: 1,   type: 'N' },
            { name: 'A#',   value: 2,   type: 'S' },
            { name: 'Bb',   value: 2,   type: 'F' },
            { name: 'B',    value: 3,   type: 'N' },
            { name: 'C',    value: 4,   type: 'N' },
            { name: 'C#',   value: 5,   type: 'S' },
            { name: 'Db',   value: 5,   type: 'F' },
            { name: 'D',    value: 6,   type: 'N' },
            { name: 'D#',   value: 7,   type: 'S' },
            { name: 'Eb',   value: 7,   type: 'F' },
            { name: 'E',    value: 8,   type: 'N' },
            { name: 'F',    value: 9,   type: 'N' },
            { name: 'F#',   value: 10,   type: 'S' },
            { name: 'Gb',   value: 10,   type: 'F' },
            { name: 'G',    value: 11,   type: 'N' },
            { name: 'G#',   value: 0,   type: 'S' }
        ];

        // A canonical ordered list of keys for cycling through with +/- buttons
        var displayKeys = [
            { name: 'C', value: 4, type: 'N' },
            { name: 'C#', value: 5, type: 'S' },
            { name: 'D', value: 6, type: 'N' },
            { name: 'Eb', value: 7, type: 'F' }, // Prefer Eb over D# for display
            { name: 'E', value: 8, type: 'N' },
            { name: 'F', value: 9, type: 'N' },
            { name: 'F#', value: 10, type: 'S' },
            { name: 'G', value: 11, type: 'N' },
            { name: 'Ab', value: 0, type: 'F' }, // Prefer Ab over G# for display
            { name: 'A', value: 1, type: 'N' },
            { name: 'Bb', value: 2, type: 'F' }, // Prefer Bb over A# for display
            { name: 'B', value: 3, type: 'N' }
        ];


        var getKeyByName = function (name) {
            if (name.charAt(name.length-1) == "m") {
                name = name.substring(0, name.length-1);
            }
            for (var i = 0; i < keys.length; i++) {
                if (name == keys[i].name) {
                    return keys[i];
                }
            }
            return null; // Return null if key not found
        };

        var getChordRoot = function (input) {
            if (input.length > 1 && (input.charAt(1) == "b" || input.charAt(1) == "#"))
                return input.substr(0, 2);
            else
                return input.substr(0, 1);
        };

        var getNewKey = function (oldKey, delta, targetKey) {
            var keyValue = getKeyByName(oldKey).value + delta;

            if (keyValue > 11) {
                keyValue -= 12;
            } else if (keyValue < 0) {
                keyValue += 12;
            }

            var i=0;
            // This logic tries to return the Flat or Sharp Key based on the targetKey's type.
            // This is crucial for correctly displaying, e.g., Db instead of C# if the target key is Db.
            if (keyValue == 0 || keyValue == 2 || keyValue == 5 || keyValue == 7 || keyValue == 10) {
                // If targetKey is a Flat key, try to find the flat equivalent
                if (targetKey && targetKey.type == "F") {
                    for (;i<keys.length;i++) {
                        if (keys[i].value == keyValue && keys[i].type == "F") {
                            return keys[i];
                        }
                    }
                }
                // Otherwise, try to find the sharp equivalent (or natural if applicable)
                for (i=0;i<keys.length;i++) {
                    if (keys[i].value == keyValue && keys[i].type == "S") {
                        return keys[i];
                    }
                }
            }
            // Return the Natural Key
            for (;i<keys.length;i++) {
                if (keys[i].value == keyValue && keys[i].type == "N") {
                    return keys[i];
                }
            }
            // Fallback: if no specific type found, return any key with the value
            for (i=0;i<keys.length;i++) {
                if (keys[i].value == keyValue) {
                    return keys[i];
                }
            }
            return null; // Should not happen if keys array is complete
        };

        var getDelta = function (oldIndex, newIndex) {
            if (oldIndex > newIndex)
                return 0 - (oldIndex - newIndex);
            else if (oldIndex < newIndex)
                return 0 + (newIndex - oldIndex);
            else
                return 0;
        };

        var transposeSong = function (target, keyName) {
            var newKey = getKeyByName(keyName);

            if (!newKey || currentKey.name == newKey.name) {
                return;
            }

            var delta = getDelta(currentKey.value, newKey.value);

            $("span.c", target).each(function (i, el) {
                transposeChord(el, delta, newKey); // Pass newKey as targetKey
            });

            currentKey = newKey;
            // Eliminado: $('#current-key-display').text(currentKey.name); // Ya no se actualiza la clave mostrada
        };

        var transposeChord = function (selector, delta, targetKey) {
            var el = $(selector);
            var oldChord = el.text();
            var oldChordRoot = getChordRoot(oldChord);
            var newChordRoot = getNewKey(oldChordRoot, delta, targetKey); // Use targetKey to guide sharp/flat

            if (!newChordRoot) {
                console.warn("Could not find new chord root for:", oldChordRoot);
                return;
            }

            var newChord = newChordRoot.name + oldChord.substr(oldChordRoot.length);
            el.text(newChord);

            var sib = el[0].nextSibling;
            if (sib && sib.nodeType == 3 && sib.nodeValue.length > 0 && sib.nodeValue.charAt(0) != "/") {
                var wsLength = getNewWhiteSpaceLength(oldChord.length, newChord.length, sib.nodeValue.length);
                sib.nodeValue = makeString(" ", wsLength);
            }
        };

        var getNewWhiteSpaceLength = function (a, b, c) {
            if (a > b)
                return (c + (a - b));
            else if (a < b)
                return (c - (b - a));
            else
                return c;
        };

        var makeString = function (s, repeat) {
            var o = [];
            for (var i = 0; i < repeat; i++) o.push(s);
            return o.join("");
        }


        var isChordLine = function (input) {
            var tokens = input.replace(/\s+/, " ").split(" ");

            for (var i = 0; i < tokens.length; i++) {
                if (!$.trim(tokens[i]).length == 0 && !tokens[i].match(opts.chordRegex))
                    return false;
            }
            return true;
        };

        var wrapChords = function (input) {
            return input.replace(opts.chordReplaceRegex, "<span class='c'>$1</span>");
        };


        return $(this).each(function() {

            var startKey = $(this).attr("data-key");
            if (!startKey || $.trim(startKey) == "") {
                startKey = opts.key;
            }

            if (!startKey || $.trim(startKey) == "") {
                console.error("Starting key not defined.");
                return this;
            }

            currentKey = getKeyByName(startKey);
            if (!currentKey) {
                console.error("Invalid starting key:", startKey);
                return this;
            }

            // Eliminado: $('#current-key-display').text(currentKey.name); // Ya no se muestra la clave inicial

            var $this = $(this);

            // Event listeners for +/- buttons
            $('#transpose-up').click(function(e) {
                e.preventDefault();
                let currentIndexInDisplayKeys = -1;
                for (let i = 0; i < displayKeys.length; i++) {
                    if (displayKeys[i].value === currentKey.value) {
                        currentIndexInDisplayKeys = i;
                        break;
                    }
                }
                if (currentIndexInDisplayKeys === -1) {
                    console.error("Current key value not found in displayKeys for transpose up.");
                    return;
                }
                let nextIndex = (currentIndexInDisplayKeys + 1) % displayKeys.length;
                transposeSong($this, displayKeys[nextIndex].name);
            });

            $('#transpose-down').click(function(e) {
                e.preventDefault();
                let currentIndexInDisplayKeys = -1;
                for (let i = 0; i < displayKeys.length; i++) {
                    if (displayKeys[i].value === currentKey.value) {
                        currentIndexInDisplayKeys = i;
                        break;
                    }
                }
                if (currentIndexInDisplayKeys === -1) {
                    console.error("Current key value not found in displayKeys for transpose down.");
                    return;
                }
                let prevIndex = (currentIndexInDisplayKeys - 1 + displayKeys.length) % displayKeys.length;
                transposeSong($this, displayKeys[prevIndex].name);
            });


            var output = [];
            var lines = $(this).text().split(/\r\n|\n/g);
            var line;

            for (var i = 0; i < lines.length; i++) {
                line = lines[i];

                if (isChordLine(line))
                    output.push("<span>" + wrapChords(line) + "</span>");
                else
                    output.push("<span>" + line + "</span>");
            };

            $(this).html(output.join("\n"));
        });
    };


    $.fn.transpose.defaults = {
        chordRegex: /^[A-G][b\#]?(2|4|5|6|7|9|11|13|6\/9|7\-5|7\-9|7\#5|7\#9|7\+5|7\+9|b5|#5|#9|7b5|7b9|7sus2|7sus4|add2|add4|add9|aug|dim|dim7|m\/maj7|m6|m7|m7b5|m9|m11|m13|maj7|maj9|maj11|maj13|M7|M9|M11|M13|mb5|m|sus|sus2|sus4)*(\/[A-G][b\#]*)*$/,
        chordReplaceRegex: /([A-G][b\#]?(2|4|5|6|7|9|11|13|6\/9|7\-5|7\-9|7\#5|7\#9|7\+5|7\+9|b5|#5|#9|7b5|7b9|7sus2|7sus4|add2|add4|add9|aug|dim|dim7|m\/maj7|m6|m7|m7b5|m9|m11|m13|maj7|maj9|maj11|maj13|M7|M9|M11|M13|mb5|m|sus|sus2|sus4)*)/g
    };

})(jQuery);