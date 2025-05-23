/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
(() => {
    let c = {},
        l = {};
    try {
        "undefined" != typeof window && (c = window), "undefined" != typeof document && (l = document);
    } catch (c) {}
    var { userAgent: s = "" } = c.navigator || {},
        a = c,
        z = l;
    function e(c, l, s) {
        var a;
        (l =
            "symbol" ==
            typeof (a = ((c, l) => {
                if ("object" != typeof c || !c) return c;
                var s = c[Symbol.toPrimitive];
                if (void 0 === s) return ("string" === l ? String : Number)(c);
                if ("object" != typeof (s = s.call(c, l || "default"))) return s;
                throw new TypeError("@@toPrimitive must return a primitive value.");
            })(l, "string"))
                ? a
                : a + "") in c
            ? Object.defineProperty(c, l, { value: s, enumerable: !0, configurable: !0, writable: !0 })
            : (c[l] = s);
    }
    function L(l, c) {
        var s,
            a = Object.keys(l);
        return (
            Object.getOwnPropertySymbols &&
                ((s = Object.getOwnPropertySymbols(l)),
                c &&
                    (s = s.filter(function (c) {
                        return Object.getOwnPropertyDescriptor(l, c).enumerable;
                    })),
                a.push.apply(a, s)),
            a
        );
    }
    function t(l) {
        for (var c = 1; c < arguments.length; c++) {
            var s = null != arguments[c] ? arguments[c] : {};
            c % 2
                ? L(Object(s), !0).forEach(function (c) {
                      e(l, c, s[c]);
                  })
                : Object.getOwnPropertyDescriptors
                ? Object.defineProperties(l, Object.getOwnPropertyDescriptors(s))
                : L(Object(s)).forEach(function (c) {
                      Object.defineProperty(l, c, Object.getOwnPropertyDescriptor(s, c));
                  });
        }
        return l;
    }
    a.document, z.documentElement && z.head && "function" == typeof z.addEventListener && z.createElement, ~s.indexOf("MSIE") || s.indexOf("Trident/");
    var z = {
            classic: { fa: "solid", fas: "solid", "fa-solid": "solid", far: "regular", "fa-regular": "regular", fal: "light", "fa-light": "light", fat: "thin", "fa-thin": "thin", fab: "brands", "fa-brands": "brands" },
            duotone: { fa: "solid", fad: "solid", "fa-solid": "solid", "fa-duotone": "solid", fadr: "regular", "fa-regular": "regular", fadl: "light", "fa-light": "light", fadt: "thin", "fa-thin": "thin" },
            sharp: { fa: "solid", fass: "solid", "fa-solid": "solid", fasr: "regular", "fa-regular": "regular", fasl: "light", "fa-light": "light", fast: "thin", "fa-thin": "thin" },
            "sharp-duotone": { fa: "solid", fasds: "solid", "fa-solid": "solid", fasdr: "regular", "fa-regular": "regular", fasdl: "light", "fa-light": "light", fasdt: "thin", "fa-thin": "thin" },
        },
        M = "classic",
        s = { fak: "kit", "fa-kit": "kit" },
        r = { fakd: "kit-duotone", "fa-kit-duotone": "kit-duotone" },
        m = { kit: "fak" },
        f = { "kit-duotone": "fakd" },
        i = "___FONT_AWESOME___";
    let C = (() => {
        try {
            return !0;
        } catch (c) {
            return !1;
        }
    })();
    function o(c) {
        return new Proxy(c, {
            get(c, l) {
                return l in c ? c[l] : c[M];
            },
        });
    }
    var n = t({}, z);
    (n[M] = t(t(t(t({}, { "fa-duotone": "duotone" }), z[M]), s), r)),
        o(n),
        ((z = t(
            {},
            {
                classic: { solid: "fas", regular: "far", light: "fal", thin: "fat", brands: "fab" },
                duotone: { solid: "fad", regular: "fadr", light: "fadl", thin: "fadt" },
                sharp: { solid: "fass", regular: "fasr", light: "fasl", thin: "fast" },
                "sharp-duotone": { solid: "fasds", regular: "fasdr", light: "fasdl", thin: "fasdt" },
            }
        ))[M] = t(t(t(t({}, { duotone: "fad" }), z[M]), m), f)),
        o(z),
        ((s = t(
            {},
            {
                classic: { fab: "fa-brands", fad: "fa-duotone", fal: "fa-light", far: "fa-regular", fas: "fa-solid", fat: "fa-thin" },
                duotone: { fadr: "fa-regular", fadl: "fa-light", fadt: "fa-thin" },
                sharp: { fass: "fa-solid", fasr: "fa-regular", fasl: "fa-light", fast: "fa-thin" },
                "sharp-duotone": { fasds: "fa-solid", fasdr: "fa-regular", fasdl: "fa-light", fasdt: "fa-thin" },
            }
        ))[M] = t(t({}, s[M]), { fak: "fa-kit" })),
        o(s),
        ((r = t(
            {},
            {
                classic: { "fa-brands": "fab", "fa-duotone": "fad", "fa-light": "fal", "fa-regular": "far", "fa-solid": "fas", "fa-thin": "fat" },
                duotone: { "fa-regular": "fadr", "fa-light": "fadl", "fa-thin": "fadt" },
                sharp: { "fa-solid": "fass", "fa-regular": "fasr", "fa-light": "fasl", "fa-thin": "fast" },
                "sharp-duotone": { "fa-solid": "fasds", "fa-regular": "fasdr", "fa-light": "fasdl", "fa-thin": "fasdt" },
            }
        ))[M] = t(t({}, r[M]), { "fa-kit": "fak" })),
        o(r),
        o(
            t(
                {},
                {
                    classic: { 900: "fas", 400: "far", normal: "far", 300: "fal", 100: "fat" },
                    duotone: { 900: "fad", 400: "fadr", 300: "fadl", 100: "fadt" },
                    sharp: { 900: "fass", 400: "fasr", 300: "fasl", 100: "fast" },
                    "sharp-duotone": { 900: "fasds", 400: "fasdr", 300: "fasdl", 100: "fasdt" },
                }
            )
        );
    (n = a || {})[i] || (n[i] = {}), n[i].styles || (n[i].styles = {}), n[i].hooks || (n[i].hooks = {}), n[i].shims || (n[i].shims = []);
    var h = n[i];
    function d(a) {
        return Object.keys(a).reduce((c, l) => {
            var s = a[l];
            return !!s.icon ? (c[s.iconName] = s.icon) : (c[l] = s), c;
        }, {});
    }
    function u(c, l, s) {
        var { skipHooks: a = !1 } = 2 < arguments.length && void 0 !== s ? s : {},
            z = d(l);
        "function" != typeof h.hooks.addPack || a ? (h.styles[c] = t(t({}, h.styles[c] || {}), z)) : h.hooks.addPack(c, d(l)), "fas" === c && u("fa", l);
    }
    var v = {
        cloudflare: [
            640,
            512,
            [],
            "e07d",
            "M407.906,319.913l-230.8-2.928a4.58,4.58,0,0,1-3.632-1.926,4.648,4.648,0,0,1-.494-4.147,6.143,6.143,0,0,1,5.361-4.076L411.281,303.9c27.631-1.26,57.546-23.574,68.022-50.784l13.286-34.542a7.944,7.944,0,0,0,.524-2.936,7.735,7.735,0,0,0-.164-1.631A151.91,151.91,0,0,0,201.257,198.4,68.12,68.12,0,0,0,94.2,269.59C41.924,271.106,0,313.728,0,366.12a96.054,96.054,0,0,0,1.029,13.958,4.508,4.508,0,0,0,4.445,3.871l426.1.051c.043,0,.08-.019.122-.02a5.606,5.606,0,0,0,5.271-4l3.273-11.265c3.9-13.4,2.448-25.8-4.1-34.9C430.124,325.423,420.09,320.487,407.906,319.913ZM513.856,221.1c-2.141,0-4.271.062-6.391.164a3.771,3.771,0,0,0-3.324,2.653l-9.077,31.193c-3.9,13.4-2.449,25.786,4.1,34.89,6.02,8.4,16.054,13.323,28.238,13.9l49.2,2.939a4.491,4.491,0,0,1,3.51,1.894,4.64,4.64,0,0,1,.514,4.169,6.153,6.153,0,0,1-5.351,4.075l-51.125,2.939c-27.754,1.27-57.669,23.574-68.145,50.784l-3.695,9.606a2.716,2.716,0,0,0,2.427,3.68c.046,0,.088.017.136.017h175.91a4.69,4.69,0,0,0,4.539-3.37,124.807,124.807,0,0,0,4.682-34C640,277.3,583.524,221.1,513.856,221.1Z",
        ],
        google: [
            488,
            512,
            [],
            "f1a0",
            "M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z",
        ],
    };
    !(function (c) {
        try {
            for (var l = arguments.length, s = new Array(1 < l ? l - 1 : 0), a = 1; a < l; a++) s[a - 1] = arguments[a];
            c(...s);
        } catch (c) {
            if (!C) throw c;
        }
    })(() => {
        u("fab", v), u("fa-brands", v);
    });
})(),
    (() => {
        let c = {},
            l = {};
        try {
            "undefined" != typeof window && (c = window), "undefined" != typeof document && (l = document);
        } catch (c) {}
        var { userAgent: s = "" } = c.navigator || {},
            a = c,
            z = l;
        function e(c, l, s) {
            var a;
            (l =
                "symbol" ==
                typeof (a = ((c, l) => {
                    if ("object" != typeof c || !c) return c;
                    var s = c[Symbol.toPrimitive];
                    if (void 0 === s) return ("string" === l ? String : Number)(c);
                    if ("object" != typeof (s = s.call(c, l || "default"))) return s;
                    throw new TypeError("@@toPrimitive must return a primitive value.");
                })(l, "string"))
                    ? a
                    : a + "") in c
                ? Object.defineProperty(c, l, { value: s, enumerable: !0, configurable: !0, writable: !0 })
                : (c[l] = s);
        }
        function L(l, c) {
            var s,
                a = Object.keys(l);
            return (
                Object.getOwnPropertySymbols &&
                    ((s = Object.getOwnPropertySymbols(l)),
                    c &&
                        (s = s.filter(function (c) {
                            return Object.getOwnPropertyDescriptor(l, c).enumerable;
                        })),
                    a.push.apply(a, s)),
                a
            );
        }
        function t(l) {
            for (var c = 1; c < arguments.length; c++) {
                var s = null != arguments[c] ? arguments[c] : {};
                c % 2
                    ? L(Object(s), !0).forEach(function (c) {
                          e(l, c, s[c]);
                      })
                    : Object.getOwnPropertyDescriptors
                    ? Object.defineProperties(l, Object.getOwnPropertyDescriptors(s))
                    : L(Object(s)).forEach(function (c) {
                          Object.defineProperty(l, c, Object.getOwnPropertyDescriptor(s, c));
                      });
            }
            return l;
        }
        a.document, z.documentElement && z.head && "function" == typeof z.addEventListener && z.createElement, ~s.indexOf("MSIE") || s.indexOf("Trident/");
        var z = {
                classic: { fa: "solid", fas: "solid", "fa-solid": "solid", far: "regular", "fa-regular": "regular", fal: "light", "fa-light": "light", fat: "thin", "fa-thin": "thin", fab: "brands", "fa-brands": "brands" },
                duotone: { fa: "solid", fad: "solid", "fa-solid": "solid", "fa-duotone": "solid", fadr: "regular", "fa-regular": "regular", fadl: "light", "fa-light": "light", fadt: "thin", "fa-thin": "thin" },
                sharp: { fa: "solid", fass: "solid", "fa-solid": "solid", fasr: "regular", "fa-regular": "regular", fasl: "light", "fa-light": "light", fast: "thin", "fa-thin": "thin" },
                "sharp-duotone": { fa: "solid", fasds: "solid", "fa-solid": "solid", fasdr: "regular", "fa-regular": "regular", fasdl: "light", "fa-light": "light", fasdt: "thin", "fa-thin": "thin" },
            },
            M = "classic",
            s = { fak: "kit", "fa-kit": "kit" },
            r = { fakd: "kit-duotone", "fa-kit-duotone": "kit-duotone" },
            m = { kit: "fak" },
            f = { "kit-duotone": "fakd" },
            i = "___FONT_AWESOME___";
        let C = (() => {
            try {
                return !0;
            } catch (c) {
                return !1;
            }
        })();
        function o(c) {
            return new Proxy(c, {
                get(c, l) {
                    return l in c ? c[l] : c[M];
                },
            });
        }
        var n = t({}, z);
        (n[M] = t(t(t(t({}, { "fa-duotone": "duotone" }), z[M]), s), r)),
            o(n),
            ((z = t(
                {},
                {
                    classic: { solid: "fas", regular: "far", light: "fal", thin: "fat", brands: "fab" },
                    duotone: { solid: "fad", regular: "fadr", light: "fadl", thin: "fadt" },
                    sharp: { solid: "fass", regular: "fasr", light: "fasl", thin: "fast" },
                    "sharp-duotone": { solid: "fasds", regular: "fasdr", light: "fasdl", thin: "fasdt" },
                }
            ))[M] = t(t(t(t({}, { duotone: "fad" }), z[M]), m), f)),
            o(z),
            ((s = t(
                {},
                {
                    classic: { fab: "fa-brands", fad: "fa-duotone", fal: "fa-light", far: "fa-regular", fas: "fa-solid", fat: "fa-thin" },
                    duotone: { fadr: "fa-regular", fadl: "fa-light", fadt: "fa-thin" },
                    sharp: { fass: "fa-solid", fasr: "fa-regular", fasl: "fa-light", fast: "fa-thin" },
                    "sharp-duotone": { fasds: "fa-solid", fasdr: "fa-regular", fasdl: "fa-light", fasdt: "fa-thin" },
                }
            ))[M] = t(t({}, s[M]), { fak: "fa-kit" })),
            o(s),
            ((r = t(
                {},
                {
                    classic: { "fa-brands": "fab", "fa-duotone": "fad", "fa-light": "fal", "fa-regular": "far", "fa-solid": "fas", "fa-thin": "fat" },
                    duotone: { "fa-regular": "fadr", "fa-light": "fadl", "fa-thin": "fadt" },
                    sharp: { "fa-solid": "fass", "fa-regular": "fasr", "fa-light": "fasl", "fa-thin": "fast" },
                    "sharp-duotone": { "fa-solid": "fasds", "fa-regular": "fasdr", "fa-light": "fasdl", "fa-thin": "fasdt" },
                }
            ))[M] = t(t({}, r[M]), { "fa-kit": "fak" })),
            o(r),
            o(
                t(
                    {},
                    {
                        classic: { 900: "fas", 400: "far", normal: "far", 300: "fal", 100: "fat" },
                        duotone: { 900: "fad", 400: "fadr", 300: "fadl", 100: "fadt" },
                        sharp: { 900: "fass", 400: "fasr", 300: "fasl", 100: "fast" },
                        "sharp-duotone": { 900: "fasds", 400: "fasdr", 300: "fasdl", 100: "fasdt" },
                    }
                )
            );
        (n = a || {})[i] || (n[i] = {}), n[i].styles || (n[i].styles = {}), n[i].hooks || (n[i].hooks = {}), n[i].shims || (n[i].shims = []);
        var h = n[i];
        function d(a) {
            return Object.keys(a).reduce((c, l) => {
                var s = a[l];
                return !!s.icon ? (c[s.iconName] = s.icon) : (c[l] = s), c;
            }, {});
        }
        function u(c, l, s) {
            var { skipHooks: a = !1 } = 2 < arguments.length && void 0 !== s ? s : {},
                z = d(l);
            "function" != typeof h.hooks.addPack || a ? (h.styles[c] = t(t({}, h.styles[c] || {}), z)) : h.hooks.addPack(c, d(l)), "fas" === c && u("fa", l);
        }
        var v = {
            sun: [
                512,
                512,
                [9728],
                "f185",
                "M361.5 1.2c5 2.1 8.6 6.6 9.6 11.9L391 121l107.9 19.8c5.3 1 9.8 4.6 11.9 9.6s1.5 10.7-1.6 15.2L446.9 256l62.3 90.3c3.1 4.5 3.7 10.2 1.6 15.2s-6.6 8.6-11.9 9.6L391 391 371.1 498.9c-1 5.3-4.6 9.8-9.6 11.9s-10.7 1.5-15.2-1.6L256 446.9l-90.3 62.3c-4.5 3.1-10.2 3.7-15.2 1.6s-8.6-6.6-9.6-11.9L121 391 13.1 371.1c-5.3-1-9.8-4.6-11.9-9.6s-1.5-10.7 1.6-15.2L65.1 256 2.8 165.7c-3.1-4.5-3.7-10.2-1.6-15.2s6.6-8.6 11.9-9.6L121 121 140.9 13.1c1-5.3 4.6-9.8 9.6-11.9s10.7-1.5 15.2 1.6L256 65.1 346.3 2.8c4.5-3.1 10.2-3.7 15.2-1.6zM160 256a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zm224 0a128 128 0 1 0 -256 0 128 128 0 1 0 256 0z",
            ],
            "hand": [
                512,
                512,
                [129306, 9995, "hand-paper"],
                "f256",
                "M256 0c-25.3 0-47.2 14.7-57.6 36c-7-2.6-14.5-4-22.4-4c-35.3 0-64 28.7-64 64l0 165.5-2.7-2.7c-25-25-65.5-25-90.5 0s-25 65.5 0 90.5L106.5 437c48 48 113.1 75 181 75l8.5 0 8 0c1.5 0 3-.1 4.5-.4c91.7-6.2 165-79.4 171.1-171.1c.3-1.5 .4-3 .4-4.5l0-176c0-35.3-28.7-64-64-64c-5.5 0-10.9 .7-16 2l0-2c0-35.3-28.7-64-64-64c-7.9 0-15.4 1.4-22.4 4C303.2 14.7 281.3 0 256 0zM240 96.1l0-.1 0-32c0-8.8 7.2-16 16-16s16 7.2 16 16l0 31.9 0 .1 0 136c0 13.3 10.7 24 24 24s24-10.7 24-24l0-136c0 0 0 0 0-.1c0-8.8 7.2-16 16-16s16 7.2 16 16l0 55.9c0 0 0 .1 0 .1l0 80c0 13.3 10.7 24 24 24s24-10.7 24-24l0-71.9c0 0 0-.1 0-.1c0-8.8 7.2-16 16-16s16 7.2 16 16l0 172.9c-.1 .6-.1 1.3-.2 1.9c-3.4 69.7-59.3 125.6-129 129c-.6 0-1.3 .1-1.9 .2l-4.9 0-8.5 0c-55.2 0-108.1-21.9-147.1-60.9L52.7 315.3c-6.2-6.2-6.2-16.4 0-22.6s16.4-6.2 22.6 0L119 336.4c6.9 6.9 17.2 8.9 26.2 5.2s14.8-12.5 14.8-22.2L160 96c0-8.8 7.2-16 16-16c8.8 0 16 7.1 16 15.9L192 232c0 13.3 10.7 24 24 24s24-10.7 24-24l0-135.9z",
            ],
            "user": [
                448,
                512,
                [128100, 62144],
                "f007",
                "M304 128a80 80 0 1 0 -160 0 80 80 0 1 0 160 0zM96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM49.3 464l349.5 0c-8.9-63.3-63.3-112-129-112l-91.4 0c-65.7 0-120.1 48.7-129 112zM0 482.3C0 383.8 79.8 304 178.3 304l91.4 0C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7L29.7 512C13.3 512 0 498.7 0 482.3z",
            ],
            "circle-play": [
                512,
                512,
                [61469, "play-circle"],
                "f144",
                "M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zM188.3 147.1c7.6-4.2 16.8-4.1 24.3 .5l144 88c7.1 4.4 11.5 12.1 11.5 20.5s-4.4 16.1-11.5 20.5l-144 88c-7.4 4.5-16.7 4.7-24.3 .5s-12.3-12.2-12.3-20.9l0-176c0-8.7 4.7-16.7 12.3-20.9z",
            ],
            "circle-question": [
                512,
                512,
                [62108, "question-circle"],
                "f059",
                "M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm169.8-90.7c7.9-22.3 29.1-37.3 52.8-37.3l58.3 0c34.9 0 63.1 28.3 63.1 63.1c0 22.6-12.1 43.5-31.7 54.8L280 264.4c-.2 13-10.9 23.6-24 23.6c-13.3 0-24-10.7-24-24l0-13.5c0-8.6 4.6-16.5 12.1-20.8l44.3-25.4c4.7-2.7 7.6-7.7 7.6-13.1c0-8.4-6.8-15.1-15.1-15.1l-58.3 0c-3.4 0-6.4 2.1-7.5 5.3l-.4 1.2c-4.4 12.5-18.2 19-30.6 14.6s-19-18.2-14.6-30.6l.4-1.2zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z",
            ],
            "eye": [
                576,
                512,
                [128065],
                "f06e",
                "M288 80c-65.2 0-118.8 29.6-159.9 67.7C89.6 183.5 63 226 49.4 256c13.6 30 40.2 72.5 78.6 108.3C169.2 402.4 222.8 432 288 432s118.8-29.6 159.9-67.7C486.4 328.5 513 286 526.6 256c-13.6-30-40.2-72.5-78.6-108.3C406.8 109.6 353.2 80 288 80zM95.4 112.6C142.5 68.8 207.2 32 288 32s145.5 36.8 192.6 80.6c46.8 43.5 78.1 95.4 93 131.1c3.3 7.9 3.3 16.7 0 24.6c-14.9 35.7-46.2 87.7-93 131.1C433.5 443.2 368.8 480 288 480s-145.5-36.8-192.6-80.6C48.6 356 17.3 304 2.5 268.3c-3.3-7.9-3.3-16.7 0-24.6C17.3 208 48.6 156 95.4 112.6zM288 336c44.2 0 80-35.8 80-80s-35.8-80-80-80c-.7 0-1.3 0-2 0c1.3 5.1 2 10.5 2 16c0 35.3-28.7 64-64 64c-5.5 0-10.9-.7-16-2c0 .7 0 1.3 0 2c0 44.2 35.8 80 80 80zm0-208a128 128 0 1 1 0 256 128 128 0 1 1 0-256z",
            ],
            "envelope": [
                512,
                512,
                [128386, 9993, 61443],
                "f0e0",
                "M64 112c-8.8 0-16 7.2-16 16l0 22.1L220.5 291.7c20.7 17 50.4 17 71.1 0L464 150.1l0-22.1c0-8.8-7.2-16-16-16L64 112zM48 212.2L48 384c0 8.8 7.2 16 16 16l384 0c8.8 0 16-7.2 16-16l0-171.8L322 328.8c-38.4 31.5-93.7 31.5-132 0L48 212.2zM0 128C0 92.7 28.7 64 64 64l384 0c35.3 0 64 28.7 64 64l0 256c0 35.3-28.7 64-64 64L64 448c-35.3 0-64-28.7-64-64L0 128z",
            ],
            "keyboard": [
                576,
                512,
                [9000],
                "f11c",
                "M64 112c-8.8 0-16 7.2-16 16l0 256c0 8.8 7.2 16 16 16l448 0c8.8 0 16-7.2 16-16l0-256c0-8.8-7.2-16-16-16L64 112zM0 128C0 92.7 28.7 64 64 64l448 0c35.3 0 64 28.7 64 64l0 256c0 35.3-28.7 64-64 64L64 448c-35.3 0-64-28.7-64-64L0 128zM176 320l224 0c8.8 0 16 7.2 16 16l0 16c0 8.8-7.2 16-16 16l-224 0c-8.8 0-16-7.2-16-16l0-16c0-8.8 7.2-16 16-16zm-72-72c0-8.8 7.2-16 16-16l16 0c8.8 0 16 7.2 16 16l0 16c0 8.8-7.2 16-16 16l-16 0c-8.8 0-16-7.2-16-16l0-16zm16-96l16 0c8.8 0 16 7.2 16 16l0 16c0 8.8-7.2 16-16 16l-16 0c-8.8 0-16-7.2-16-16l0-16c0-8.8 7.2-16 16-16zm64 96c0-8.8 7.2-16 16-16l16 0c8.8 0 16 7.2 16 16l0 16c0 8.8-7.2 16-16 16l-16 0c-8.8 0-16-7.2-16-16l0-16zm16-96l16 0c8.8 0 16 7.2 16 16l0 16c0 8.8-7.2 16-16 16l-16 0c-8.8 0-16-7.2-16-16l0-16c0-8.8 7.2-16 16-16zm64 96c0-8.8 7.2-16 16-16l16 0c8.8 0 16 7.2 16 16l0 16c0 8.8-7.2 16-16 16l-16 0c-8.8 0-16-7.2-16-16l0-16zm16-96l16 0c8.8 0 16 7.2 16 16l0 16c0 8.8-7.2 16-16 16l-16 0c-8.8 0-16-7.2-16-16l0-16c0-8.8 7.2-16 16-16zm64 96c0-8.8 7.2-16 16-16l16 0c8.8 0 16 7.2 16 16l0 16c0 8.8-7.2 16-16 16l-16 0c-8.8 0-16-7.2-16-16l0-16zm16-96l16 0c8.8 0 16 7.2 16 16l0 16c0 8.8-7.2 16-16 16l-16 0c-8.8 0-16-7.2-16-16l0-16c0-8.8 7.2-16 16-16zm64 96c0-8.8 7.2-16 16-16l16 0c8.8 0 16 7.2 16 16l0 16c0 8.8-7.2 16-16 16l-16 0c-8.8 0-16-7.2-16-16l0-16zm16-96l16 0c8.8 0 16 7.2 16 16l0 16c0 8.8-7.2 16-16 16l-16 0c-8.8 0-16-7.2-16-16l0-16c0-8.8 7.2-16 16-16z",
            ],
            "copy": [
                448,
                512,
                [],
                "f0c5",
                "M384 336l-192 0c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l140.1 0L400 115.9 400 320c0 8.8-7.2 16-16 16zM192 384l192 0c35.3 0 64-28.7 64-64l0-204.1c0-12.7-5.1-24.9-14.1-33.9L366.1 14.1c-9-9-21.2-14.1-33.9-14.1L192 0c-35.3 0-64 28.7-64 64l0 256c0 35.3 28.7 64 64 64zM64 128c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l192 0c35.3 0 64-28.7 64-64l0-32-48 0 0 32c0 8.8-7.2 16-16 16L64 464c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l32 0 0-48-32 0z",
            ],
        };
        
        !(function (c) {
            try {
                for (var l = arguments.length, s = new Array(1 < l ? l - 1 : 0), a = 1; a < l; a++) s[a - 1] = arguments[a];
                c(...s);
            } catch (c) {
                if (!C) throw c;
            }
        })(() => {
            u("far", v), u("fa-regular", v);
        });
    })(),
    (() => {
        let c = {},
            l = {};
        try {
            "undefined" != typeof window && (c = window), "undefined" != typeof document && (l = document);
        } catch (c) {}
        var { userAgent: s = "" } = c.navigator || {},
            a = c,
            z = l;
        function e(c, l, s) {
            var a;
            (l =
                "symbol" ==
                typeof (a = ((c, l) => {
                    if ("object" != typeof c || !c) return c;
                    var s = c[Symbol.toPrimitive];
                    if (void 0 === s) return ("string" === l ? String : Number)(c);
                    if ("object" != typeof (s = s.call(c, l || "default"))) return s;
                    throw new TypeError("@@toPrimitive must return a primitive value.");
                })(l, "string"))
                    ? a
                    : a + "") in c
                ? Object.defineProperty(c, l, { value: s, enumerable: !0, configurable: !0, writable: !0 })
                : (c[l] = s);
        }
        function L(l, c) {
            var s,
                a = Object.keys(l);
            return (
                Object.getOwnPropertySymbols &&
                    ((s = Object.getOwnPropertySymbols(l)),
                    c &&
                        (s = s.filter(function (c) {
                            return Object.getOwnPropertyDescriptor(l, c).enumerable;
                        })),
                    a.push.apply(a, s)),
                a
            );
        }
        function t(l) {
            for (var c = 1; c < arguments.length; c++) {
                var s = null != arguments[c] ? arguments[c] : {};
                c % 2
                    ? L(Object(s), !0).forEach(function (c) {
                          e(l, c, s[c]);
                      })
                    : Object.getOwnPropertyDescriptors
                    ? Object.defineProperties(l, Object.getOwnPropertyDescriptors(s))
                    : L(Object(s)).forEach(function (c) {
                          Object.defineProperty(l, c, Object.getOwnPropertyDescriptor(s, c));
                      });
            }
            return l;
        }
        a.document, z.documentElement && z.head && "function" == typeof z.addEventListener && z.createElement, ~s.indexOf("MSIE") || s.indexOf("Trident/");
        var z = {
                classic: { fa: "solid", fas: "solid", "fa-solid": "solid", far: "regular", "fa-regular": "regular", fal: "light", "fa-light": "light", fat: "thin", "fa-thin": "thin", fab: "brands", "fa-brands": "brands" },
                duotone: { fa: "solid", fad: "solid", "fa-solid": "solid", "fa-duotone": "solid", fadr: "regular", "fa-regular": "regular", fadl: "light", "fa-light": "light", fadt: "thin", "fa-thin": "thin" },
                sharp: { fa: "solid", fass: "solid", "fa-solid": "solid", fasr: "regular", "fa-regular": "regular", fasl: "light", "fa-light": "light", fast: "thin", "fa-thin": "thin" },
                "sharp-duotone": { fa: "solid", fasds: "solid", "fa-solid": "solid", fasdr: "regular", "fa-regular": "regular", fasdl: "light", "fa-light": "light", fasdt: "thin", "fa-thin": "thin" },
            },
            M = "classic",
            s = { fak: "kit", "fa-kit": "kit" },
            r = { fakd: "kit-duotone", "fa-kit-duotone": "kit-duotone" },
            m = { kit: "fak" },
            f = { "kit-duotone": "fakd" },
            i = "___FONT_AWESOME___";
        let C = (() => {
            try {
                return !0;
            } catch (c) {
                return !1;
            }
        })();
        function o(c) {
            return new Proxy(c, {
                get(c, l) {
                    return l in c ? c[l] : c[M];
                },
            });
        }
        var n = t({}, z);
        (n[M] = t(t(t(t({}, { "fa-duotone": "duotone" }), z[M]), s), r)),
            o(n),
            ((z = t(
                {},
                {
                    classic: { solid: "fas", regular: "far", light: "fal", thin: "fat", brands: "fab" },
                    duotone: { solid: "fad", regular: "fadr", light: "fadl", thin: "fadt" },
                    sharp: { solid: "fass", regular: "fasr", light: "fasl", thin: "fast" },
                    "sharp-duotone": { solid: "fasds", regular: "fasdr", light: "fasdl", thin: "fasdt" },
                }
            ))[M] = t(t(t(t({}, { duotone: "fad" }), z[M]), m), f)),
            o(z),
            ((s = t(
                {},
                {
                    classic: { fab: "fa-brands", fad: "fa-duotone", fal: "fa-light", far: "fa-regular", fas: "fa-solid", fat: "fa-thin" },
                    duotone: { fadr: "fa-regular", fadl: "fa-light", fadt: "fa-thin" },
                    sharp: { fass: "fa-solid", fasr: "fa-regular", fasl: "fa-light", fast: "fa-thin" },
                    "sharp-duotone": { fasds: "fa-solid", fasdr: "fa-regular", fasdl: "fa-light", fasdt: "fa-thin" },
                }
            ))[M] = t(t({}, s[M]), { fak: "fa-kit" })),
            o(s),
            ((r = t(
                {},
                {
                    classic: { "fa-brands": "fab", "fa-duotone": "fad", "fa-light": "fal", "fa-regular": "far", "fa-solid": "fas", "fa-thin": "fat" },
                    duotone: { "fa-regular": "fadr", "fa-light": "fadl", "fa-thin": "fadt" },
                    sharp: { "fa-solid": "fass", "fa-regular": "fasr", "fa-light": "fasl", "fa-thin": "fast" },
                    "sharp-duotone": { "fa-solid": "fasds", "fa-regular": "fasdr", "fa-light": "fasdl", "fa-thin": "fasdt" },
                }
            ))[M] = t(t({}, r[M]), { "fa-kit": "fak" })),
            o(r),
            o(
                t(
                    {},
                    {
                        classic: { 900: "fas", 400: "far", normal: "far", 300: "fal", 100: "fat" },
                        duotone: { 900: "fad", 400: "fadr", 300: "fadl", 100: "fadt" },
                        sharp: { 900: "fass", 400: "fasr", 300: "fasl", 100: "fast" },
                        "sharp-duotone": { 900: "fasds", 400: "fasdr", 300: "fasdl", 100: "fasdt" },
                    }
                )
            );
        (n = a || {})[i] || (n[i] = {}), n[i].styles || (n[i].styles = {}), n[i].hooks || (n[i].hooks = {}), n[i].shims || (n[i].shims = []);
        var h = n[i];
        function d(a) {
            return Object.keys(a).reduce((c, l) => {
                var s = a[l];
                return !!s.icon ? (c[s.iconName] = s.icon) : (c[l] = s), c;
            }, {});
        }
        function u(c, l, s) {
            var { skipHooks: a = !1 } = 2 < arguments.length && void 0 !== s ? s : {},
                z = d(l);
            "function" != typeof h.hooks.addPack || a ? (h.styles[c] = t(t({}, h.styles[c] || {}), z)) : h.hooks.addPack(c, d(l)), "fas" === c && u("fa", l);
        }
        var v = {
            "right-from-bracket": [
                512,
                512,
                ["sign-out-alt"],
                "f2f5",
                "M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z",
            ],
            "forward-step": [
                320,
                512,
                ["step-forward"],
                "f051",
                "M52.5 440.6c-9.5 7.9-22.8 9.7-34.1 4.4S0 428.4 0 416L0 96C0 83.6 7.2 72.3 18.4 67s24.5-3.6 34.1 4.4l192 160L256 241l0-145c0-17.7 14.3-32 32-32s32 14.3 32 32l0 320c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-145-11.5 9.6-192 160z",
            ],
            "triangle-exclamation": [
                512,
                512,
                [9888, "exclamation-triangle", "warning"],
                "f071",
                "M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480L40 480c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24l0 112c0 13.3 10.7 24 24 24s24-10.7 24-24l0-112c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z",
            ],
            "table-cells-large": [
                512,
                512,
                ["th-large"],
                "f009",
                "M448 96l0 128-160 0 0-128 160 0zm0 192l0 128-160 0 0-128 160 0zM224 224L64 224 64 96l160 0 0 128zM64 288l160 0 0 128L64 416l0-128zM64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32z",
            ],
            "backward": [
                512,
                512,
                [9194],
                "f04a",
                "M459.5 440.6c9.5 7.9 22.8 9.7 34.1 4.4s18.4-16.6 18.4-29l0-320c0-12.4-7.2-23.7-18.4-29s-24.5-3.6-34.1 4.4L288 214.3l0 41.7 0 41.7L459.5 440.6zM256 352l0-96 0-128 0-32c0-12.4-7.2-23.7-18.4-29s-24.5-3.6-34.1 4.4l-192 160C4.2 237.5 0 246.5 0 256s4.2 18.5 11.5 24.6l192 160c9.5 7.9 22.8 9.7 34.1 4.4s18.4-16.6 18.4-29l0-64z",
            ],
            "caret-right": [
                256,
                512,
                [],
                "f0da",
                "M246.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-128-128c-9.2-9.2-22.9-11.9-34.9-6.9s-19.8 16.6-19.8 29.6l0 256c0 12.9 7.8 24.6 19.8 29.6s25.7 2.2 34.9-6.9l128-128z",
            ],
            "volume-low": [
                448,
                512,
                [128264, "volume-down"],
                "f027",
                "M301.1 34.8C312.6 40 320 51.4 320 64l0 384c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352 64 352c-35.3 0-64-28.7-64-64l0-64c0-35.3 28.7-64 64-64l67.8 0L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3zM412.6 181.5C434.1 199.1 448 225.9 448 256s-13.9 56.9-35.4 74.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C393.1 284.4 400 271 400 256s-6.9-28.4-17.7-37.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5z",
            ],
            "list": [
                512,
                512,
                ["list-squares"],
                "f03a",
                "M40 48C26.7 48 16 58.7 16 72l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24L40 48zM192 64c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L192 64zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-288 0zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-288 0zM16 232l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24l-48 0c-13.3 0-24 10.7-24 24zM40 368c-13.3 0-24 10.7-24 24l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24l-48 0z",
            ],
            "hand": [
                512,
                512,
                [129306, 9995, "hand-paper"],
                "f256",
                "M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 208c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-176c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 272c0 1.5 0 3.1 .1 4.6L67.6 283c-16-15.2-41.3-14.6-56.6 1.4s-14.6 41.3 1.4 56.6L124.8 448c43.1 41.1 100.4 64 160 64l19.2 0c97.2 0 176-78.8 176-176l0-208c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 112c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-176c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 176c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-208z",
            ],
            "i-cursor": [
                256,
                512,
                [],
                "f246",
                "M.1 29.3C-1.4 47 11.7 62.4 29.3 63.9l8 .7C70.5 67.3 96 95 96 128.3L96 224l-32 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l32 0 0 95.7c0 33.3-25.5 61-58.7 63.8l-8 .7C11.7 449.6-1.4 465 .1 482.7s16.9 30.7 34.5 29.2l8-.7c34.1-2.8 64.2-18.9 85.4-42.9c21.2 24 51.2 40 85.4 42.9l8 .7c17.6 1.5 33.1-11.6 34.5-29.2s-11.6-33.1-29.2-34.5l-8-.7C185.5 444.7 160 417 160 383.7l0-95.7 32 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-32 0 0-95.7c0-33.3 25.5-61 58.7-63.8l8-.7c17.6-1.5 30.7-16.9 29.2-34.5S239-1.4 221.3 .1l-8 .7C179.2 3.6 149.2 19.7 128 43.7c-21.2-24-51.2-40-85.4-42.9l-8-.7C17-1.4 1.6 11.7 .1 29.3z",
            ],
            "user": [
                448,
                512,
                [128100, 62144],
                "f007",
                "M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z",
            ],
            "key": [
                512,
                512,
                [128273],
                "f084",
                "M336 352c97.2 0 176-78.8 176-176S433.2 0 336 0S160 78.8 160 176c0 18.7 2.9 36.8 8.3 53.7L7 391c-4.5 4.5-7 10.6-7 17l0 80c0 13.3 10.7 24 24 24l80 0c13.3 0 24-10.7 24-24l0-40 40 0c13.3 0 24-10.7 24-24l0-40 40 0c6.4 0 12.5-2.5 17-7l33.3-33.3c16.9 5.4 35 8.3 53.7 8.3zM376 96a40 40 0 1 1 0 80 40 40 0 1 1 0-80z",
            ],
            "circle-play": [
                512,
                512,
                [61469, "play-circle"],
                "f144",
                "M0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zM188.3 147.1c-7.6 4.2-12.3 12.3-12.3 20.9l0 176c0 8.7 4.7 16.7 12.3 20.9s16.8 4.1 24.3-.5l144-88c7.1-4.4 11.5-12.1 11.5-20.5s-4.4-16.1-11.5-20.5l-144-88c-7.4-4.5-16.7-4.7-24.3-.5z",
            ],
            "pause": [
                320,
                512,
                [9208],
                "f04c",
                "M48 64C21.5 64 0 85.5 0 112L0 400c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48L48 64zm192 0c-26.5 0-48 21.5-48 48l0 288c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48l-32 0z",
            ],
            "file-signature": [
                576,
                512,
                [],
                "f573",
                "M64 0C28.7 0 0 28.7 0 64L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-19.3c-2.7 1.1-5.4 2-8.2 2.7l-60.1 15c-3 .7-6 1.2-9 1.4c-.9 .1-1.8 .2-2.7 .2l-64 0c-6.1 0-11.6-3.4-14.3-8.8l-8.8-17.7c-1.7-3.4-5.1-5.5-8.8-5.5s-7.2 2.1-8.8 5.5l-8.8 17.7c-2.9 5.9-9.2 9.4-15.7 8.8s-12.1-5.1-13.9-11.3L144 381l-9.8 32.8c-6.1 20.3-24.8 34.2-46 34.2L80 448c-8.8 0-16-7.2-16-16s7.2-16 16-16l8.2 0c7.1 0 13.3-4.6 15.3-11.4l14.9-49.5c3.4-11.3 13.8-19.1 25.6-19.1s22.2 7.8 25.6 19.1l11.6 38.6c7.4-6.2 16.8-9.7 26.8-9.7c15.9 0 30.4 9 37.5 23.2l4.4 8.8 8.9 0c-3.1-8.8-3.7-18.4-1.4-27.8l15-60.1c2.8-11.3 8.6-21.5 16.8-29.7L384 203.6l0-43.6-128 0c-17.7 0-32-14.3-32-32L224 0 64 0zM256 0l0 128 128 0L256 0zM549.8 139.7c-15.6-15.6-40.9-15.6-56.6 0l-29.4 29.4 71 71 29.4-29.4c15.6-15.6 15.6-40.9 0-56.6l-14.4-14.4zM311.9 321c-4.1 4.1-7 9.2-8.4 14.9l-15 60.1c-1.4 5.5 .2 11.2 4.2 15.2s9.7 5.6 15.2 4.2l60.1-15c5.6-1.4 10.8-4.3 14.9-8.4L512.1 262.7l-71-71L311.9 321z",
            ],
            "puzzle-piece": [
                512,
                512,
                [129513],
                "f12e",
                "M192 104.8c0-9.2-5.8-17.3-13.2-22.8C167.2 73.3 160 61.3 160 48c0-26.5 28.7-48 64-48s64 21.5 64 48c0 13.3-7.2 25.3-18.8 34c-7.4 5.5-13.2 13.6-13.2 22.8c0 12.8 10.4 23.2 23.2 23.2l56.8 0c26.5 0 48 21.5 48 48l0 56.8c0 12.8 10.4 23.2 23.2 23.2c9.2 0 17.3-5.8 22.8-13.2c8.7-11.6 20.7-18.8 34-18.8c26.5 0 48 28.7 48 64s-21.5 64-48 64c-13.3 0-25.3-7.2-34-18.8c-5.5-7.4-13.6-13.2-22.8-13.2c-12.8 0-23.2 10.4-23.2 23.2L384 464c0 26.5-21.5 48-48 48l-56.8 0c-12.8 0-23.2-10.4-23.2-23.2c0-9.2 5.8-17.3 13.2-22.8c11.6-8.7 18.8-20.7 18.8-34c0-26.5-28.7-48-64-48s-64 21.5-64 48c0 13.3 7.2 25.3 18.8 34c7.4 5.5 13.2 13.6 13.2 22.8c0 12.8-10.4 23.2-23.2 23.2L48 512c-26.5 0-48-21.5-48-48L0 343.2C0 330.4 10.4 320 23.2 320c9.2 0 17.3 5.8 22.8 13.2C54.7 344.8 66.7 352 80 352c26.5 0 48-28.7 48-64s-21.5-64-48-64c-13.3 0-25.3 7.2-34 18.8C40.5 250.2 32.4 256 23.2 256C10.4 256 0 245.6 0 232.8L0 176c0-26.5 21.5-48 48-48l120.8 0c12.8 0 23.2-10.4 23.2-23.2z",
            ],
            "circle-question": [
                512,
                512,
                [62108, "question-circle"],
                "f059",
                "M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM169.8 165.3c7.9-22.3 29.1-37.3 52.8-37.3l58.3 0c34.9 0 63.1 28.3 63.1 63.1c0 22.6-12.1 43.5-31.7 54.8L280 264.4c-.2 13-10.9 23.6-24 23.6c-13.3 0-24-10.7-24-24l0-13.5c0-8.6 4.6-16.5 12.1-20.8l44.3-25.4c4.7-2.7 7.6-7.7 7.6-13.1c0-8.4-6.8-15.1-15.1-15.1l-58.3 0c-3.4 0-6.4 2.1-7.5 5.3l-.4 1.2c-4.4 12.5-18.2 19-30.6 14.6s-19-18.2-14.6-30.6l.4-1.2zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z",
            ],
            "eye": [
                576,
                512,
                [128065],
                "f06e",
                "M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3z",
            ],
            "pen": [
                512,
                512,
                [128394],
                "f304",
                "M362.7 19.3L314.3 67.7 444.3 197.7l48.4-48.4c25-25 25-65.5 0-90.5L453.3 19.3c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2C-1.5 489.7 .8 498.8 7 505s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L421.7 220.3 291.7 90.3z",
            ],
            "pen-fancy": [
                512,
                512,
                [128395, 10002],
                "f5ac",
                "M373.5 27.1C388.5 9.9 410.2 0 433 0c43.6 0 79 35.4 79 79c0 22.8-9.9 44.6-27.1 59.6L277.7 319l-10.3-10.3-64-64L193 234.3 373.5 27.1zM170.3 256.9l10.4 10.4 64 64 10.4 10.4-19.2 83.4c-3.9 17.1-16.9 30.7-33.8 35.4L24.3 510.3l95.4-95.4c2.6 .7 5.4 1.1 8.3 1.1c17.7 0 32-14.3 32-32s-14.3-32-32-32s-32 14.3-32 32c0 2.9 .4 5.6 1.1 8.3L1.7 487.6 51.5 310c4.7-16.9 18.3-29.9 35.4-33.8l83.4-19.2z",
            ],
            "poo": [
                512,
                512,
                [128169],
                "f2fe",
                "M268.9 .9c-5.5-.7-11 1.4-14.5 5.7s-4.6 10.1-2.8 15.4c2.8 8.2 4.3 16.9 4.3 26.1c0 44.1-35.7 79.9-79.8 80L160 128c-35.3 0-64 28.7-64 64c0 19.1 8.4 36.3 21.7 48L104 240c-39.8 0-72 32.2-72 72c0 23.2 11 43.8 28 57c-34.1 5.7-60 35.3-60 71c0 39.8 32.2 72 72 72l368 0c39.8 0 72-32.2 72-72c0-35.7-25.9-65.3-60-71c17-13.2 28-33.8 28-57c0-39.8-32.2-72-72-72l-13.7 0c13.3-11.7 21.7-28.9 21.7-48c0-35.3-28.7-64-64-64l-5.5 0c3.5-10 5.5-20.8 5.5-32c0-48.6-36.2-88.8-83.1-95.1zM192 256a32 32 0 1 1 0 64 32 32 0 1 1 0-64zm96 32a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm64 108.3c0 2.4-.7 4.8-2.2 6.7c-8.2 10.5-39.5 45-93.8 45s-85.6-34.6-93.8-45c-1.5-1.9-2.2-4.3-2.2-6.7c0-6.8 5.5-12.3 12.3-12.3l167.4 0c6.8 0 12.3 5.5 12.3 12.3z",
            ],
            "envelope": [
                512,
                512,
                [128386, 9993, 61443],
                "f0e0",
                "M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48L48 64zM0 176L0 384c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-208L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z",
            ],
            "circle-info": [
                512,
                512,
                ["info-circle"],
                "f05a",
                "M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336l24 0 0-64-24 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l48 0c13.3 0 24 10.7 24 24l0 88 8 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-80 0c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z",
            ],
            "braille": [
                640,
                512,
                [],
                "f2a1",
                "M0 96a64 64 0 1 1 128 0A64 64 0 1 1 0 96zM224 272a16 16 0 1 0 0-32 16 16 0 1 0 0 32zm0-80a64 64 0 1 1 0 128 64 64 0 1 1 0-128zM80 416a16 16 0 1 0 -32 0 16 16 0 1 0 32 0zM0 416a64 64 0 1 1 128 0A64 64 0 1 1 0 416zm240 0a16 16 0 1 0 -32 0 16 16 0 1 0 32 0zm-80 0a64 64 0 1 1 128 0 64 64 0 1 1 -128 0zM64 192a64 64 0 1 1 0 128 64 64 0 1 1 0-128zM224 32a64 64 0 1 1 0 128 64 64 0 1 1 0-128zM352 96a64 64 0 1 1 128 0A64 64 0 1 1 352 96zm240 0a16 16 0 1 0 -32 0 16 16 0 1 0 32 0zm-80 0a64 64 0 1 1 128 0A64 64 0 1 1 512 96zm64 176a16 16 0 1 0 0-32 16 16 0 1 0 0 32zm0-80a64 64 0 1 1 0 128 64 64 0 1 1 0-128zm16 224a16 16 0 1 0 -32 0 16 16 0 1 0 32 0zm-80 0a64 64 0 1 1 128 0 64 64 0 1 1 -128 0zM416 272a16 16 0 1 0 0-32 16 16 0 1 0 0 32zm0-80a64 64 0 1 1 0 128 64 64 0 1 1 0-128zm16 224a16 16 0 1 0 -32 0 16 16 0 1 0 32 0zm-80 0a64 64 0 1 1 128 0 64 64 0 1 1 -128 0z",
            ],
            "landmark": [
                512,
                512,
                [127963],
                "f66f",
                "M240.1 4.2c9.8-5.6 21.9-5.6 31.8 0l171.8 98.1L448 104l0 .9 47.9 27.4c12.6 7.2 18.8 22 15.1 36s-16.4 23.8-30.9 23.8L32 192c-14.5 0-27.2-9.8-30.9-23.8s2.5-28.8 15.1-36L64 104.9l0-.9 4.4-1.6L240.1 4.2zM64 224l64 0 0 192 40 0 0-192 64 0 0 192 48 0 0-192 64 0 0 192 40 0 0-192 64 0 0 196.3c.6 .3 1.2 .7 1.8 1.1l48 32c11.7 7.8 17 22.4 12.9 35.9S494.1 512 480 512L32 512c-14.1 0-26.5-9.2-30.6-22.7s1.1-28.1 12.9-35.9l48-32c.6-.4 1.2-.7 1.8-1.1L64 224z",
            ],
            "backward-step": [
                320,
                512,
                ["step-backward"],
                "f048",
                "M267.5 440.6c9.5 7.9 22.8 9.7 34.1 4.4s18.4-16.6 18.4-29l0-320c0-12.4-7.2-23.7-18.4-29s-24.5-3.6-34.1 4.4l-192 160L64 241 64 96c0-17.7-14.3-32-32-32S0 78.3 0 96L0 416c0 17.7 14.3 32 32 32s32-14.3 32-32l0-145 11.5 9.6 192 160z",
            ],
            "keyboard": [
                576,
                512,
                [9000],
                "f11c",
                "M64 64C28.7 64 0 92.7 0 128L0 384c0 35.3 28.7 64 64 64l448 0c35.3 0 64-28.7 64-64l0-256c0-35.3-28.7-64-64-64L64 64zm16 64l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16zM64 240c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32zm16 80l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16zm80-176c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32zm16 80l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16zM160 336c0-8.8 7.2-16 16-16l224 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-224 0c-8.8 0-16-7.2-16-16l0-32zM272 128l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16zM256 240c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32zM368 128l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16zM352 240c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32zM464 128l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16zM448 240c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32zm16 80l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16z",
            ],
            "caret-down": [
                320,
                512,
                [],
                "f0d7",
                "M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z",
            ],
            "arrow-right-arrow-left": [
                448,
                512,
                [8644, "exchange"],
                "f0ec",
                "M438.6 150.6c12.5-12.5 12.5-32.8 0-45.3l-96-96c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.7 96 32 96C14.3 96 0 110.3 0 128s14.3 32 32 32l306.7 0-41.4 41.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l96-96zm-333.3 352c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 416 416 416c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0 41.4-41.4c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-96 96c-12.5 12.5-12.5 32.8 0 45.3l96 96z",
            ],
            "person-through-window": [
                640,
                512,
                [],
                "e5a9",
                "M64 64l224 0 0 9.8c0 39-23.7 74-59.9 88.4C167.6 186.5 128 245 128 310.2l0 73.8s0 0 0 0l-64 0L64 64zm288 0l224 0 0 320-67.7 0-3.7-4.5-75.2-90.2c-9.1-10.9-22.6-17.3-36.9-17.3l-71.1 0-41-63.1c-.3-.5-.6-1-1-1.4c44.7-29 72.5-79 72.5-133.6l0-9.8zm73 320l-45.8 0 42.7 64L592 448c26.5 0 48-21.5 48-48l0-352c0-26.5-21.5-48-48-48L48 0C21.5 0 0 21.5 0 48L0 400c0 26.5 21.5 48 48 48l260.2 0 33.2 49.8c9.8 14.7 29.7 18.7 44.4 8.9s18.7-29.7 8.9-44.4L310.5 336l74.6 0 40 48zm-159.5 0L192 384s0 0 0 0l0-73.8c0-10.2 1.6-20.1 4.7-29.5L265.5 384zM192 128a48 48 0 1 0 -96 0 48 48 0 1 0 96 0z",
            ],
            "magnifying-glass": [
                512,
                512,
                [128269, "search"],
                "f002",
                "M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z",
            ],
            "copy": [
                448,
                512,
                [],
                "f0c5",
                "M208 0L332.1 0c12.7 0 24.9 5.1 33.9 14.1l67.9 67.9c9 9 14.1 21.2 14.1 33.9L448 336c0 26.5-21.5 48-48 48l-192 0c-26.5 0-48-21.5-48-48l0-288c0-26.5 21.5-48 48-48zM48 128l80 0 0 64-64 0 0 256 192 0 0-32 64 0 0 48c0 26.5-21.5 48-48 48L48 512c-26.5 0-48-21.5-48-48L0 176c0-26.5 21.5-48 48-48z",
            ],
            "xmark": [
                384,
                512,
                [128473, 10005, 10006, 10060, 215, "close", "multiply", "remove", "times"],
                "f00d",
                "M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z",
            ],
            "vial-circle-check": [
                512,
                512,
                [],
                "e596",
                "M0 64C0 46.3 14.3 32 32 32l64 0 64 0 64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l0 170.8c-20.2 28.6-32 63.5-32 101.2c0 25.2 5.3 49.1 14.8 70.8C189.5 463.7 160.6 480 128 480c-53 0-96-43-96-96L32 96C14.3 96 0 81.7 0 64zM96 96l0 96 64 0 0-96L96 96zM224 368a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm211.3-43.3c-6.2-6.2-16.4-6.2-22.6 0L352 385.4l-28.7-28.7c-6.2-6.2-16.4-6.2-22.6 0s-6.2 16.4 0 22.6l40 40c6.2 6.2 16.4 6.2 22.6 0l72-72c6.2-6.2 6.2-16.4 0-22.6z",
            ],
            "circle-plus": [
                512,
                512,
                ["plus-circle"],
                "f055",
                "M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM232 344l0-64-64 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l64 0 0-64c0-13.3 10.7-24 24-24s24 10.7 24 24l0 64 64 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-64 0 0 64c0 13.3-10.7 24-24 24s-24-10.7-24-24z",
            ],
            "book": [
                448,
                512,
                [128212],
                "f02d",
                "M96 0C43 0 0 43 0 96L0 416c0 53 43 96 96 96l288 0 32 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l0-64c17.7 0 32-14.3 32-32l0-320c0-17.7-14.3-32-32-32L384 0 96 0zm0 384l256 0 0 64L96 448c-17.7 0-32-14.3-32-32s14.3-32 32-32zm32-240c0-8.8 7.2-16 16-16l192 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-192 0c-8.8 0-16-7.2-16-16zm16 48l192 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-192 0c-8.8 0-16-7.2-16-16s7.2-16 16-16z",
            ],
        };
        
        !(function (c) {
            try {
                for (var l = arguments.length, s = new Array(1 < l ? l - 1 : 0), a = 1; a < l; a++) s[a - 1] = arguments[a];
                c(...s);
            } catch (c) {
                if (!C) throw c;
            }
        })(() => {
            u("fas", v), u("fa-solid", v);
        });
    })(),
    (() => {
        function N(c, l, s) {
            var a;
            (l =
                "symbol" ==
                typeof (a = ((c, l) => {
                    if ("object" != typeof c || !c) return c;
                    var s = c[Symbol.toPrimitive];
                    if (void 0 === s) return ("string" === l ? String : Number)(c);
                    if ("object" != typeof (s = s.call(c, l || "default"))) return s;
                    throw new TypeError("@@toPrimitive must return a primitive value.");
                })(l, "string"))
                    ? a
                    : a + "") in c
                ? Object.defineProperty(c, l, { value: s, enumerable: !0, configurable: !0, writable: !0 })
                : (c[l] = s);
        }
        function E(l, c) {
            var s,
                a = Object.keys(l);
            return (
                Object.getOwnPropertySymbols &&
                    ((s = Object.getOwnPropertySymbols(l)),
                    c &&
                        (s = s.filter(function (c) {
                            return Object.getOwnPropertyDescriptor(l, c).enumerable;
                        })),
                    a.push.apply(a, s)),
                a
            );
        }
        function u(l) {
            for (var c = 1; c < arguments.length; c++) {
                var s = null != arguments[c] ? arguments[c] : {};
                c % 2
                    ? E(Object(s), !0).forEach(function (c) {
                          N(l, c, s[c]);
                      })
                    : Object.getOwnPropertyDescriptors
                    ? Object.defineProperties(l, Object.getOwnPropertyDescriptors(s))
                    : E(Object(s)).forEach(function (c) {
                          Object.defineProperty(l, c, Object.getOwnPropertyDescriptor(s, c));
                      });
            }
            return l;
        }
        let I = {},
            F = {},
            D = null,
            T = { mark: (c = () => {}), measure: c };
        try {
            "undefined" != typeof window && (I = window), "undefined" != typeof document && (F = document), "undefined" != typeof MutationObserver && (D = MutationObserver), "undefined" != typeof performance && (T = performance);
        } catch (c) {}
        var { userAgent: c = "" } = I.navigator || {};
        let l = I,
            h = F,
            R = D;
        var s = T;
        let _ = !!l.document,
            r = !!h.documentElement && !!h.head && "function" == typeof h.addEventListener && "function" == typeof h.createElement,
            Y = ~c.indexOf("MSIE") || ~c.indexOf("Trident/");
        var c = {
                classic: { fa: "solid", fas: "solid", "fa-solid": "solid", far: "regular", "fa-regular": "regular", fal: "light", "fa-light": "light", fat: "thin", "fa-thin": "thin", fab: "brands", "fa-brands": "brands" },
                duotone: { fa: "solid", fad: "solid", "fa-solid": "solid", "fa-duotone": "solid", fadr: "regular", "fa-regular": "regular", fadl: "light", "fa-light": "light", fadt: "thin", "fa-thin": "thin" },
                sharp: { fa: "solid", fass: "solid", "fa-solid": "solid", fasr: "regular", "fa-regular": "regular", fasl: "light", "fa-light": "light", fast: "thin", "fa-thin": "thin" },
                "sharp-duotone": { fa: "solid", fasds: "solid", "fa-solid": "solid", fasdr: "regular", "fa-regular": "regular", fasdl: "light", "fa-light": "light", fasdt: "thin", "fa-thin": "thin" },
            },
            W = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"],
            M = "classic",
            f = "duotone",
            U = [M, f, "sharp", "sharp-duotone"],
            B = new Map([
                ["classic", { defaultShortPrefixId: "fas", defaultStyleId: "solid", styleIds: ["solid", "regular", "light", "thin", "brands"], futureStyleIds: [], defaultFontWeight: 900 }],
                ["sharp", { defaultShortPrefixId: "fass", defaultStyleId: "solid", styleIds: ["solid", "regular", "light", "thin"], futureStyleIds: [], defaultFontWeight: 900 }],
                ["duotone", { defaultShortPrefixId: "fad", defaultStyleId: "solid", styleIds: ["solid", "regular", "light", "thin"], futureStyleIds: [], defaultFontWeight: 900 }],
                ["sharp-duotone", { defaultShortPrefixId: "fasds", defaultStyleId: "solid", styleIds: ["solid", "regular", "light", "thin"], futureStyleIds: [], defaultFontWeight: 900 }],
            ]),
            X = ["fak", "fa-kit", "fakd", "fa-kit-duotone"],
            z = { fak: "kit", "fa-kit": "kit" },
            a = { fakd: "kit-duotone", "fa-kit-duotone": "kit-duotone" },
            G = ["fak", "fakd"],
            Q = { kit: "fak" },
            e = { "kit-duotone": "fakd" },
            L = { GROUP: "duotone-group", SWAP_OPACITY: "swap-opacity", PRIMARY: "primary", SECONDARY: "secondary" },
            K = ["fak", "fa-kit", "fakd", "fa-kit-duotone"],
            J = {
                classic: { fab: "fa-brands", fad: "fa-duotone", fal: "fa-light", far: "fa-regular", fas: "fa-solid", fat: "fa-thin" },
                duotone: { fadr: "fa-regular", fadl: "fa-light", fadt: "fa-thin" },
                sharp: { fass: "fa-solid", fasr: "fa-regular", fasl: "fa-light", fast: "fa-thin" },
                "sharp-duotone": { fasds: "fa-solid", fasdr: "fa-regular", fasdl: "fa-light", fasdt: "fa-thin" },
            },
            $ = [
                "fa",
                "fas",
                "far",
                "fal",
                "fat",
                "fad",
                "fadr",
                "fadl",
                "fadt",
                "fab",
                "fass",
                "fasr",
                "fasl",
                "fast",
                "fasds",
                "fasdr",
                "fasdl",
                "fasdt",
                "fa-classic",
                "fa-duotone",
                "fa-sharp",
                "fa-sharp-duotone",
                "fa-solid",
                "fa-regular",
                "fa-light",
                "fa-thin",
                "fa-duotone",
                "fa-brands",
            ],
            t = (m = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]),
            L = [
                ...Object.keys({ classic: ["fas", "far", "fal", "fat", "fad"], duotone: ["fadr", "fadl", "fadt"], sharp: ["fass", "fasr", "fasl", "fast"], "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"] }),
                "solid",
                "regular",
                "light",
                "thin",
                "duotone",
                "brands",
                "2xs",
                "xs",
                "sm",
                "lg",
                "xl",
                "2xl",
                "beat",
                "border",
                "fade",
                "beat-fade",
                "bounce",
                "flip-both",
                "flip-horizontal",
                "flip-vertical",
                "flip",
                "fw",
                "inverse",
                "layers-counter",
                "layers-text",
                "layers",
                "li",
                "pull-left",
                "pull-right",
                "pulse",
                "rotate-180",
                "rotate-270",
                "rotate-90",
                "rotate-by",
                "shake",
                "spin-pulse",
                "spin-reverse",
                "spin",
                "stack-1x",
                "stack-2x",
                "stack",
                "ul",
                L.GROUP,
                L.SWAP_OPACITY,
                L.PRIMARY,
                L.SECONDARY,
            ]
                .concat(m.map((c) => "".concat(c, "x")))
                .concat(t.map((c) => "w-".concat(c))),
            m = "___FONT_AWESOME___";
        let c1 = 16,
            l1 = "svg-inline--fa",
            v = "data-fa-i2svg",
            s1 = "data-fa-pseudo-element",
            a1 = "data-fa-pseudo-element-pending",
            z1 = "data-prefix",
            e1 = "data-icon",
            L1 = "fontawesome-i2svg",
            t1 = "async",
            M1 = ["HTML", "HEAD", "STYLE", "SCRIPT"],
            r1 = (() => {
                try {
                    return !0;
                } catch (c) {
                    return !1;
                }
            })();
        function i(c) {
            return new Proxy(c, {
                get(c, l) {
                    return l in c ? c[l] : c[M];
                },
            });
        }
        (t = u({}, c))[M] = u(u(u(u({}, { "fa-duotone": "duotone" }), c[M]), z), a);
        let m1 = i(t),
            f1 =
                (((c = u(
                    {},
                    {
                        classic: { solid: "fas", regular: "far", light: "fal", thin: "fat", brands: "fab" },
                        duotone: { solid: "fad", regular: "fadr", light: "fadl", thin: "fadt" },
                        sharp: { solid: "fass", regular: "fasr", light: "fasl", thin: "fast" },
                        "sharp-duotone": { solid: "fasds", regular: "fasdr", light: "fasdl", thin: "fasdt" },
                    }
                ))[M] = u(u(u(u({}, { duotone: "fad" }), c[M]), Q), e)),
                i(c)),
            i1 = (((z = u({}, J))[M] = u(u({}, z[M]), { fak: "fa-kit" })), i(z)),
            C1 =
                (((a = u(
                    {},
                    {
                        classic: { "fa-brands": "fab", "fa-duotone": "fad", "fa-light": "fal", "fa-regular": "far", "fa-solid": "fas", "fa-thin": "fat" },
                        duotone: { "fa-regular": "fadr", "fa-light": "fadl", "fa-thin": "fadt" },
                        sharp: { "fa-solid": "fass", "fa-regular": "fasr", "fa-light": "fasl", "fa-thin": "fast" },
                        "sharp-duotone": { "fa-solid": "fasds", "fa-regular": "fasdr", "fa-light": "fasdl", "fa-thin": "fasdt" },
                    }
                ))[M] = u(u({}, a[M]), { "fa-kit": "fak" })),
                i(a),
                /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/),
            o1 = "fa-layers-text",
            n1 = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i,
            h1 =
                (i(
                    u(
                        {},
                        {
                            classic: { 900: "fas", 400: "far", normal: "far", 300: "fal", 100: "fat" },
                            duotone: { 900: "fad", 400: "fadr", 300: "fadl", 100: "fadt" },
                            sharp: { 900: "fass", 400: "fasr", 300: "fasl", 100: "fast" },
                            "sharp-duotone": { 900: "fasds", 400: "fasdr", 300: "fasdl", 100: "fasdt" },
                        }
                    )
                ),
                ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"]),
            d1 = { GROUP: "duotone-group", SWAP_OPACITY: "swap-opacity", PRIMARY: "primary", SECONDARY: "secondary" },
            u1 = ["kit", ...L],
            C = l.FontAwesomeConfig || {},
            o =
                (h &&
                    "function" == typeof h.querySelector &&
                    [
                        ["data-family-prefix", "familyPrefix"],
                        ["data-css-prefix", "cssPrefix"],
                        ["data-family-default", "familyDefault"],
                        ["data-style-default", "styleDefault"],
                        ["data-replacement-class", "replacementClass"],
                        ["data-auto-replace-svg", "autoReplaceSvg"],
                        ["data-auto-add-css", "autoAddCss"],
                        ["data-auto-a11y", "autoA11y"],
                        ["data-search-pseudo-elements", "searchPseudoElements"],
                        ["data-observe-mutations", "observeMutations"],
                        ["data-mutate-approach", "mutateApproach"],
                        ["data-keep-original-source", "keepOriginalSource"],
                        ["data-measure-performance", "measurePerformance"],
                        ["data-show-missing-icons", "showMissingIcons"],
                    ].forEach((c) => {
                        var [l, s] = c,
                            l =
                                "" ===
                                    (c = ((c) => {
                                        var l = h.querySelector("script[" + c + "]");
                                        if (l) return l.getAttribute(c);
                                    })(l)) ||
                                ("false" !== c && ("true" === c || c));
                        null != l && (C[s] = l);
                    }),
                (t = {
                    styleDefault: "solid",
                    familyDefault: M,
                    cssPrefix: "fa",
                    replacementClass: l1,
                    autoReplaceSvg: !0,
                    autoAddCss: !0,
                    autoA11y: !0,
                    searchPseudoElements: !1,
                    observeMutations: !0,
                    mutateApproach: "async",
                    keepOriginalSource: !0,
                    measurePerformance: !1,
                    showMissingIcons: !0,
                }),
                C.familyPrefix && (C.cssPrefix = C.familyPrefix),
                u(u({}, t), C)),
            p = (o.autoReplaceSvg || (o.observeMutations = !1), {}),
            v1 =
                (Object.keys(t).forEach((l) => {
                    Object.defineProperty(p, l, {
                        enumerable: !0,
                        set: function (c) {
                            (o[l] = c), v1.forEach((c) => c(p));
                        },
                        get: function () {
                            return o[l];
                        },
                    });
                }),
                Object.defineProperty(p, "familyPrefix", {
                    enumerable: !0,
                    set: function (c) {
                        (o.cssPrefix = c), v1.forEach((c) => c(p));
                    },
                    get: function () {
                        return o.cssPrefix;
                    },
                }),
                (l.FontAwesomeConfig = p),
                []),
            n = c1,
            d = { size: 16, x: 0, y: 0, rotate: 0, flipX: !1, flipY: !1 },
            p1 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        function g() {
            let c = 12,
                l = "";
            for (; 0 < c--; ) l += p1[(62 * Math.random()) | 0];
            return l;
        }
        function b(c) {
            var l = [];
            for (let s = (c || []).length >>> 0; s--; ) l[s] = c[s];
            return l;
        }
        function g1(c) {
            return c.classList ? b(c.classList) : (c.getAttribute("class") || "").split(" ").filter((c) => c);
        }
        function b1(c) {
            return "".concat(c).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }
        function H(s) {
            return Object.keys(s || {}).reduce((c, l) => c + "".concat(l, ": ").concat(s[l].trim(), ";"), "");
        }
        function H1(c) {
            return c.size !== d.size || c.x !== d.x || c.y !== d.y || c.rotate !== d.rotate || c.flipX || c.flipY;
        }
        function V1() {
            var c,
                l,
                s = l1,
                a = p.cssPrefix,
                z = p.replacementClass;
            let e =
                ':host,:root{--fa-font-solid:normal 900 1em/1 "Font Awesome 6 Free";--fa-font-regular:normal 400 1em/1 "Font Awesome 6 Free";--fa-font-light:normal 300 1em/1 "Font Awesome 6 Pro";--fa-font-thin:normal 100 1em/1 "Font Awesome 6 Pro";--fa-font-duotone:normal 900 1em/1 "Font Awesome 6 Duotone";--fa-font-duotone-regular:normal 400 1em/1 "Font Awesome 6 Duotone";--fa-font-duotone-light:normal 300 1em/1 "Font Awesome 6 Duotone";--fa-font-duotone-thin:normal 100 1em/1 "Font Awesome 6 Duotone";--fa-font-brands:normal 400 1em/1 "Font Awesome 6 Brands";--fa-font-sharp-solid:normal 900 1em/1 "Font Awesome 6 Sharp";--fa-font-sharp-regular:normal 400 1em/1 "Font Awesome 6 Sharp";--fa-font-sharp-light:normal 300 1em/1 "Font Awesome 6 Sharp";--fa-font-sharp-thin:normal 100 1em/1 "Font Awesome 6 Sharp";--fa-font-sharp-duotone-solid:normal 900 1em/1 "Font Awesome 6 Sharp Duotone";--fa-font-sharp-duotone-regular:normal 400 1em/1 "Font Awesome 6 Sharp Duotone";--fa-font-sharp-duotone-light:normal 300 1em/1 "Font Awesome 6 Sharp Duotone";--fa-font-sharp-duotone-thin:normal 100 1em/1 "Font Awesome 6 Sharp Duotone"}svg:not(:host).svg-inline--fa,svg:not(:root).svg-inline--fa{overflow:visible;box-sizing:content-box}.svg-inline--fa{display:var(--fa-display,inline-block);height:1em;overflow:visible;vertical-align:-.125em}.svg-inline--fa.fa-2xs{vertical-align:.1em}.svg-inline--fa.fa-xs{vertical-align:0}.svg-inline--fa.fa-sm{vertical-align:-.0714285705em}.svg-inline--fa.fa-lg{vertical-align:-.2em}.svg-inline--fa.fa-xl{vertical-align:-.25em}.svg-inline--fa.fa-2xl{vertical-align:-.3125em}.svg-inline--fa.fa-pull-left{margin-right:var(--fa-pull-margin,.3em);width:auto}.svg-inline--fa.fa-pull-right{margin-left:var(--fa-pull-margin,.3em);width:auto}.svg-inline--fa.fa-li{width:var(--fa-li-width,2em);top:.25em}.svg-inline--fa.fa-fw{width:var(--fa-fw-width,1.25em)}.fa-layers svg.svg-inline--fa{bottom:0;left:0;margin:auto;position:absolute;right:0;top:0}.fa-layers-counter,.fa-layers-text{display:inline-block;position:absolute;text-align:center}.fa-layers{display:inline-block;height:1em;position:relative;text-align:center;vertical-align:-.125em;width:1em}.fa-layers svg.svg-inline--fa{transform-origin:center center}.fa-layers-text{left:50%;top:50%;transform:translate(-50%,-50%);transform-origin:center center}.fa-layers-counter{background-color:var(--fa-counter-background-color,#ff253a);border-radius:var(--fa-counter-border-radius,1em);box-sizing:border-box;color:var(--fa-inverse,#fff);line-height:var(--fa-counter-line-height,1);max-width:var(--fa-counter-max-width,5em);min-width:var(--fa-counter-min-width,1.5em);overflow:hidden;padding:var(--fa-counter-padding,.25em .5em);right:var(--fa-right,0);text-overflow:ellipsis;top:var(--fa-top,0);transform:scale(var(--fa-counter-scale,.25));transform-origin:top right}.fa-layers-bottom-right{bottom:var(--fa-bottom,0);right:var(--fa-right,0);top:auto;transform:scale(var(--fa-layers-scale,.25));transform-origin:bottom right}.fa-layers-bottom-left{bottom:var(--fa-bottom,0);left:var(--fa-left,0);right:auto;top:auto;transform:scale(var(--fa-layers-scale,.25));transform-origin:bottom left}.fa-layers-top-right{top:var(--fa-top,0);right:var(--fa-right,0);transform:scale(var(--fa-layers-scale,.25));transform-origin:top right}.fa-layers-top-left{left:var(--fa-left,0);right:auto;top:var(--fa-top,0);transform:scale(var(--fa-layers-scale,.25));transform-origin:top left}.fa-1x{font-size:1em}.fa-2x{font-size:2em}.fa-3x{font-size:3em}.fa-4x{font-size:4em}.fa-5x{font-size:5em}.fa-6x{font-size:6em}.fa-7x{font-size:7em}.fa-8x{font-size:8em}.fa-9x{font-size:9em}.fa-10x{font-size:10em}.fa-2xs{font-size:.625em;line-height:.1em;vertical-align:.225em}.fa-xs{font-size:.75em;line-height:.0833333337em;vertical-align:.125em}.fa-sm{font-size:.875em;line-height:.0714285718em;vertical-align:.0535714295em}.fa-lg{font-size:1.25em;line-height:.05em;vertical-align:-.075em}.fa-xl{font-size:1.5em;line-height:.0416666682em;vertical-align:-.125em}.fa-2xl{font-size:2em;line-height:.03125em;vertical-align:-.1875em}.fa-fw{text-align:center;width:1.25em}.fa-ul{list-style-type:none;margin-left:var(--fa-li-margin,2.5em);padding-left:0}.fa-ul>li{position:relative}.fa-li{left:calc(-1 * var(--fa-li-width,2em));position:absolute;text-align:center;width:var(--fa-li-width,2em);line-height:inherit}.fa-border{border-color:var(--fa-border-color,#eee);border-radius:var(--fa-border-radius,.1em);border-style:var(--fa-border-style,solid);border-width:var(--fa-border-width,.08em);padding:var(--fa-border-padding,.2em .25em .15em)}.fa-pull-left{float:left;margin-right:var(--fa-pull-margin,.3em)}.fa-pull-right{float:right;margin-left:var(--fa-pull-margin,.3em)}.fa-beat{animation-name:fa-beat;animation-delay:var(--fa-animation-delay,0s);animation-direction:var(--fa-animation-direction,normal);animation-duration:var(--fa-animation-duration,1s);animation-iteration-count:var(--fa-animation-iteration-count,infinite);animation-timing-function:var(--fa-animation-timing,ease-in-out)}.fa-bounce{animation-name:fa-bounce;animation-delay:var(--fa-animation-delay,0s);animation-direction:var(--fa-animation-direction,normal);animation-duration:var(--fa-animation-duration,1s);animation-iteration-count:var(--fa-animation-iteration-count,infinite);animation-timing-function:var(--fa-animation-timing,cubic-bezier(.28,.84,.42,1))}.fa-fade{animation-name:fa-fade;animation-delay:var(--fa-animation-delay,0s);animation-direction:var(--fa-animation-direction,normal);animation-duration:var(--fa-animation-duration,1s);animation-iteration-count:var(--fa-animation-iteration-count,infinite);animation-timing-function:var(--fa-animation-timing,cubic-bezier(.4,0,.6,1))}.fa-beat-fade{animation-name:fa-beat-fade;animation-delay:var(--fa-animation-delay,0s);animation-direction:var(--fa-animation-direction,normal);animation-duration:var(--fa-animation-duration,1s);animation-iteration-count:var(--fa-animation-iteration-count,infinite);animation-timing-function:var(--fa-animation-timing,cubic-bezier(.4,0,.6,1))}.fa-flip{animation-name:fa-flip;animation-delay:var(--fa-animation-delay,0s);animation-direction:var(--fa-animation-direction,normal);animation-duration:var(--fa-animation-duration,1s);animation-iteration-count:var(--fa-animation-iteration-count,infinite);animation-timing-function:var(--fa-animation-timing,ease-in-out)}.fa-shake{animation-name:fa-shake;animation-delay:var(--fa-animation-delay,0s);animation-direction:var(--fa-animation-direction,normal);animation-duration:var(--fa-animation-duration,1s);animation-iteration-count:var(--fa-animation-iteration-count,infinite);animation-timing-function:var(--fa-animation-timing,linear)}.fa-spin{animation-name:fa-spin;animation-delay:var(--fa-animation-delay,0s);animation-direction:var(--fa-animation-direction,normal);animation-duration:var(--fa-animation-duration,2s);animation-iteration-count:var(--fa-animation-iteration-count,infinite);animation-timing-function:var(--fa-animation-timing,linear)}.fa-spin-reverse{--fa-animation-direction:reverse}.fa-pulse,.fa-spin-pulse{animation-name:fa-spin;animation-direction:var(--fa-animation-direction,normal);animation-duration:var(--fa-animation-duration,1s);animation-iteration-count:var(--fa-animation-iteration-count,infinite);animation-timing-function:var(--fa-animation-timing,steps(8))}@media (prefers-reduced-motion:reduce){.fa-beat,.fa-beat-fade,.fa-bounce,.fa-fade,.fa-flip,.fa-pulse,.fa-shake,.fa-spin,.fa-spin-pulse{animation-delay:-1ms;animation-duration:1ms;animation-iteration-count:1;transition-delay:0s;transition-duration:0s}}@keyframes fa-beat{0%,90%{transform:scale(1)}45%{transform:scale(var(--fa-beat-scale,1.25))}}@keyframes fa-bounce{0%{transform:scale(1,1) translateY(0)}10%{transform:scale(var(--fa-bounce-start-scale-x,1.1),var(--fa-bounce-start-scale-y,.9)) translateY(0)}30%{transform:scale(var(--fa-bounce-jump-scale-x,.9),var(--fa-bounce-jump-scale-y,1.1)) translateY(var(--fa-bounce-height,-.5em))}50%{transform:scale(var(--fa-bounce-land-scale-x,1.05),var(--fa-bounce-land-scale-y,.95)) translateY(0)}57%{transform:scale(1,1) translateY(var(--fa-bounce-rebound,-.125em))}64%{transform:scale(1,1) translateY(0)}100%{transform:scale(1,1) translateY(0)}}@keyframes fa-fade{50%{opacity:var(--fa-fade-opacity,.4)}}@keyframes fa-beat-fade{0%,100%{opacity:var(--fa-beat-fade-opacity,.4);transform:scale(1)}50%{opacity:1;transform:scale(var(--fa-beat-fade-scale,1.125))}}@keyframes fa-flip{50%{transform:rotate3d(var(--fa-flip-x,0),var(--fa-flip-y,1),var(--fa-flip-z,0),var(--fa-flip-angle,-180deg))}}@keyframes fa-shake{0%{transform:rotate(-15deg)}4%{transform:rotate(15deg)}24%,8%{transform:rotate(-18deg)}12%,28%{transform:rotate(18deg)}16%{transform:rotate(-22deg)}20%{transform:rotate(22deg)}32%{transform:rotate(-12deg)}36%{transform:rotate(12deg)}100%,40%{transform:rotate(0)}}@keyframes fa-spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}.fa-rotate-90{transform:rotate(90deg)}.fa-rotate-180{transform:rotate(180deg)}.fa-rotate-270{transform:rotate(270deg)}.fa-flip-horizontal{transform:scale(-1,1)}.fa-flip-vertical{transform:scale(1,-1)}.fa-flip-both,.fa-flip-horizontal.fa-flip-vertical{transform:scale(-1,-1)}.fa-rotate-by{transform:rotate(var(--fa-rotate-angle,0))}.fa-stack{display:inline-block;vertical-align:middle;height:2em;position:relative;width:2.5em}.fa-stack-1x,.fa-stack-2x{bottom:0;left:0;margin:auto;position:absolute;right:0;top:0;z-index:var(--fa-stack-z-index,auto)}.svg-inline--fa.fa-stack-1x{height:1em;width:1.25em}.svg-inline--fa.fa-stack-2x{height:2em;width:2.5em}.fa-inverse{color:var(--fa-inverse,#fff)}.fa-sr-only,.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0}.fa-sr-only-focusable:not(:focus),.sr-only-focusable:not(:focus){position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0}.svg-inline--fa .fa-primary{fill:var(--fa-primary-color,currentColor);opacity:var(--fa-primary-opacity,1)}.svg-inline--fa .fa-secondary{fill:var(--fa-secondary-color,currentColor);opacity:var(--fa-secondary-opacity,.4)}.svg-inline--fa.fa-swap-opacity .fa-primary{opacity:var(--fa-secondary-opacity,.4)}.svg-inline--fa.fa-swap-opacity .fa-secondary{opacity:var(--fa-primary-opacity,1)}.svg-inline--fa mask .fa-primary,.svg-inline--fa mask .fa-secondary{fill:#000}';
            return (
                ("fa" === a && z === s) ||
                    ((c = new RegExp("\\.".concat("fa", "\\-"), "g")),
                    (l = new RegExp("\\--".concat("fa", "\\-"), "g")),
                    (s = new RegExp("\\.".concat(s), "g")),
                    (e = e.replace(c, ".".concat(a, "-")).replace(l, "--".concat(a, "-")).replace(s, ".".concat(z)))),
                e
            );
        }
        let w1 = !1;
        function y1() {
            if (p.autoAddCss && !w1) {
                var s = V1();
                if (s && r) {
                    var a = h.createElement("style"),
                        z = (a.setAttribute("type", "text/css"), (a.innerHTML = s), h.head.childNodes);
                    let c = null;
                    for (let l = z.length - 1; -1 < l; l--) {
                        var e = z[l],
                            L = (e.tagName || "").toUpperCase();
                        -1 < ["STYLE", "LINK"].indexOf(L) && (c = e);
                    }
                    h.head.insertBefore(a, c);
                }
                w1 = !0;
            }
        }
        var Q = {
                mixout() {
                    return { dom: { css: V1, insertCss: y1 } };
                },
                hooks() {
                    return {
                        beforeDOMElementCreation() {
                            y1();
                        },
                        beforeI2svg() {
                            y1();
                        },
                    };
                },
            },
            V = ((e = l || {})[m] || (e[m] = {}), e[m].styles || (e[m].styles = {}), e[m].hooks || (e[m].hooks = {}), e[m].shims || (e[m].shims = []), e[m]);
        function k1() {
            h.removeEventListener("DOMContentLoaded", k1), (A1 = 1), S1.map((c) => c());
        }
        let S1 = [],
            A1 = !1;
        function x1(c) {
            r && (A1 ? setTimeout(c, 0) : S1.push(c));
        }
        function w(c) {
            var s,
                { tag: l, attributes: a = {}, children: z = [] } = c;
            return "string" == typeof c
                ? b1(c)
                : "<"
                      .concat(l, " ")
                      .concat(
                          ((s = a),
                          Object.keys(s || {})
                              .reduce((c, l) => c + "".concat(l, '="').concat(b1(s[l]), '" '), "")
                              .trim()),
                          ">"
                      )
                      .concat(z.map(w).join(""), "</")
                      .concat(l, ">");
        }
        function q1(c, l, s) {
            if (c && c[l] && c[l][s]) return { prefix: l, iconName: s, icon: c[l][s] };
        }
        function Z1(c, l, s, a) {
            for (var z, e, L = Object.keys(c), t = L.length, M = void 0 !== a ? O1(l, a) : l, r = void 0 === s ? ((z = 1), c[L[0]]) : ((z = 0), s); z < t; z++) r = M(r, c[(e = L[z])], e, c);
            return r;
        }
        r && !(A1 = (h.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(h.readyState)) && h.addEventListener("DOMContentLoaded", k1);
        var O1 = function (z, e) {
            return function (c, l, s, a) {
                return z.call(e, c, l, s, a);
            };
        };
        function j1(c) {
            var l = ((c) => {
                var l = [];
                let s = 0;
                for (var a = c.length; s < a; ) {
                    var z,
                        e = c.charCodeAt(s++);
                    55296 <= e && e <= 56319 && s < a ? (56320 == (64512 & (z = c.charCodeAt(s++))) ? l.push(((1023 & e) << 10) + (1023 & z) + 65536) : (l.push(e), s--)) : l.push(e);
                }
                return l;
            })(c);
            return 1 === l.length ? l[0].toString(16) : null;
        }
        function P1(a) {
            return Object.keys(a).reduce((c, l) => {
                var s = a[l];
                return !!s.icon ? (c[s.iconName] = s.icon) : (c[l] = s), c;
            }, {});
        }
        function N1(c, l, s) {
            var { skipHooks: a = !1 } = 2 < arguments.length && void 0 !== s ? s : {},
                z = P1(l);
            "function" != typeof V.hooks.addPack || a ? (V.styles[c] = u(u({}, V.styles[c] || {}), z)) : V.hooks.addPack(c, P1(l)), "fas" === c && N1("fa", l);
        }
        let { styles: y, shims: E1 } = V,
            I1 = Object.keys(i1),
            F1 = I1.reduce((c, l) => ((c[l] = Object.keys(i1[l])), c), {}),
            k = null,
            D1 = {},
            T1 = {},
            R1 = {},
            _1 = {},
            Y1 = {};
        function W1(c, l) {
            var s = l.split("-"),
                a = s[0],
                s = s.slice(1).join("-");
            return a !== c || "" === s || ((l = s), ~u1.indexOf(l)) ? null : s;
        }
        let S = () => {
            var c = (a) => Z1(y, (c, l, s) => ((c[s] = Z1(l, a, {})), c), {});
            (D1 = c(
                (l, c, s) => (
                    c[3] && (l[c[3]] = s),
                    c[2] &&
                        c[2]
                            .filter((c) => "number" == typeof c)
                            .forEach((c) => {
                                l[c.toString(16)] = s;
                            }),
                    l
                )
            )),
                (T1 = c(
                    (l, c, s) => (
                        (l[s] = s),
                        c[2] &&
                            c[2]
                                .filter((c) => "string" == typeof c)
                                .forEach((c) => {
                                    l[c] = s;
                                }),
                        l
                    )
                )),
                (Y1 = c((l, c, s) => {
                    var a = c[2];
                    return (
                        (l[s] = s),
                        a.forEach((c) => {
                            l[c] = s;
                        }),
                        l
                    );
                }));
            let e = "far" in y || p.autoFetchSvg;
            c = Z1(
                E1,
                (c, l) => {
                    var s = l[0];
                    let a = l[1];
                    var z = l[2];
                    return "far" !== a || e || (a = "fas"), "string" == typeof s && (c.names[s] = { prefix: a, iconName: z }), "number" == typeof s && (c.unicodes[s.toString(16)] = { prefix: a, iconName: z }), c;
                },
                { names: {}, unicodes: {} }
            );
            (R1 = c.names), (_1 = c.unicodes), (k = G1(p.styleDefault, { family: p.familyDefault }));
        };
        function U1(c, l) {
            return (D1[c] || {})[l];
        }
        function A(c, l) {
            return (Y1[c] || {})[l];
        }
        function B1(c) {
            return R1[c] || { prefix: null, iconName: null };
        }
        (c3 = (c) => {
            k = G1(c.styleDefault, { family: p.familyDefault });
        }),
            v1.push(c3),
            S();
        let X1 = () => ({ prefix: null, iconName: null, rest: [] });
        function G1(c, l) {
            var { family: s = M } = 1 < arguments.length && void 0 !== l ? l : {},
                a = m1[s][c];
            return s !== f || c ? ((s = f1[s][c] || f1[s][a]), (a = c in V.styles ? c : null), s || a || null) : "fad";
        }
        function Q1(c) {
            return c.sort().filter((c, l, s) => s.indexOf(c) === l);
        }
        function K1(c, l) {
            var { skipLookups: s = !1 } = 1 < arguments.length && void 0 !== l ? l : {};
            let a = null,
                z = $.concat(K);
            var e = Q1(c.filter((c) => z.includes(c))),
                L = Q1(c.filter((c) => !$.includes(c))),
                [t = null] = e.filter((c) => ((a = c), !W.includes(c))),
                e = ((c) => {
                    let s = M,
                        a = I1.reduce((c, l) => ((c[l] = "".concat(p.cssPrefix, "-").concat(l)), c), {});
                    return (
                        U.forEach((l) => {
                            (c.includes(a[l]) || c.some((c) => F1[l].includes(c))) && (s = l);
                        }),
                        s
                    );
                })(e),
                L = u(
                    u(
                        {},
                        ((c) => {
                            let s = [],
                                a = null;
                            return (
                                c.forEach((c) => {
                                    var l = W1(p.cssPrefix, c);
                                    l ? (a = l) : c && s.push(c);
                                }),
                                { iconName: a, rest: s }
                            );
                        })(L)
                    ),
                    {},
                    { prefix: G1(t, { family: e }) }
                );
            return u(
                u(
                    u({}, L),
                    ((c) => {
                        var { values: l, family: s, canonical: a, givenPrefix: z = "", styles: e = {}, config: L = {} } = c,
                            t = s === f,
                            M = l.includes("fa-duotone") || l.includes("fad"),
                            r = "duotone" === L.familyDefault,
                            m = "fad" === a.prefix || "fa-duotone" === a.prefix;
                        return (
                            !t && (M || r || m) && (a.prefix = "fad"),
                            (l.includes("fa-brands") || l.includes("fab")) && (a.prefix = "fab"),
                            !a.prefix && J1.includes(s) && (Object.keys(e).find((c) => $1.includes(c)) || L.autoFetchSvg) && ((t = B.get(s).defaultShortPrefixId), (a.prefix = t), (a.iconName = A(a.prefix, a.iconName) || a.iconName)),
                            ("fa" !== a.prefix && "fa" !== z) || (a.prefix = k || "fas"),
                            a
                        );
                    })({ values: c, family: e, styles: y, config: p, canonical: L, givenPrefix: a })
                ),
                ((c, l, s) => {
                    let { prefix: a, iconName: z } = s;
                    var e, L;
                    return !c && a && z && ((e = "fa" === l ? B1(z) : {}), (L = A(a, z)), (z = e.iconName || L || z), "far" !== (a = e.prefix || a) || y.far || !y.fas || p.autoFetchSvg || (a = "fas")), { prefix: a, iconName: z };
                })(s, a, L)
            );
        }
        let J1 = U.filter((c) => c !== M || c !== f),
            $1 = Object.keys(J)
                .filter((c) => c !== M)
                .map((c) => Object.keys(J[c]))
                .flat(),
            c2 = [],
            x = {},
            q = {},
            l2 = Object.keys(q);
        function s2(c, l) {
            for (var s = arguments.length, a = new Array(2 < s ? s - 2 : 0), z = 2; z < s; z++) a[z - 2] = arguments[z];
            return (
                (x[c] || []).forEach((c) => {
                    l = c.apply(null, [l, ...a]);
                }),
                l
            );
        }
        function Z(c) {
            for (var l = arguments.length, s = new Array(1 < l ? l - 1 : 0), a = 1; a < l; a++) s[a - 1] = arguments[a];
            (x[c] || []).forEach((c) => {
                c.apply(null, s);
            });
        }
        function O(c) {
            var l = c,
                s = Array.prototype.slice.call(arguments, 1);
            return q[l] ? q[l].apply(null, s) : void 0;
        }
        function a2(c) {
            "fa" === c.prefix && (c.prefix = "fas");
            var l = c.iconName,
                s = c.prefix || k;
            if (l) return (l = A(s, l) || l), q1(z2.definitions, s, l) || q1(V.styles, s, l);
        }
        let z2 = new (class {
                constructor() {
                    this.definitions = {};
                }
                add() {
                    for (var c = arguments.length, l = new Array(c), s = 0; s < c; s++) l[s] = arguments[s];
                    let a = l.reduce(this._pullDefinitions, {});
                    Object.keys(a).forEach((c) => {
                        (this.definitions[c] = u(u({}, this.definitions[c] || {}), a[c])), N1(c, a[c]);
                        var l = i1[M][c];
                        l && N1(l, a[c]), S();
                    });
                }
                reset() {
                    this.definitions = {};
                }
                _pullDefinitions(e, c) {
                    let L = c.prefix && c.iconName && c.icon ? { 0: c } : c;
                    return (
                        Object.keys(L).map((c) => {
                            let { prefix: l, iconName: s, icon: a } = L[c];
                            var z = a[2];
                            e[l] || (e[l] = {}),
                                0 < z.length &&
                                    z.forEach((c) => {
                                        "string" == typeof c && (e[l][c] = a);
                                    }),
                                (e[l][s] = a);
                        }),
                        e
                    );
                }
            })(),
            e2 = {
                noAuto: () => {
                    (p.autoReplaceSvg = !1), (p.observeMutations = !1), Z("noAuto");
                },
                config: p,
                dom: {
                    i2svg: function () {
                        var c = 0 < arguments.length && void 0 !== arguments[0] ? arguments[0] : {};
                        return r ? (Z("beforeI2svg", c), O("pseudoElements2svg", c), O("i2svg", c)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
                    },
                    watch: function () {
                        let c = 0 < arguments.length && void 0 !== arguments[0] ? arguments[0] : {},
                            l = c.autoReplaceSvgRoot;
                        !1 === p.autoReplaceSvg && (p.autoReplaceSvg = !0),
                            (p.observeMutations = !0),
                            x1(() => {
                                j({ autoReplaceSvgRoot: l }), Z("watch", c);
                            });
                    },
                },
                parse: {
                    icon: (c) => {
                        var l, s;
                        return null === c
                            ? null
                            : "object" == typeof c && c.prefix && c.iconName
                            ? { prefix: c.prefix, iconName: A(c.prefix, c.iconName) || c.iconName }
                            : Array.isArray(c) && 2 === c.length
                            ? ((l = 0 === c[1].indexOf("fa-") ? c[1].slice(3) : c[1]), { prefix: (s = G1(c[0])), iconName: A(s, l) || l })
                            : "string" == typeof c && (-1 < c.indexOf("".concat(p.cssPrefix, "-")) || c.match(C1))
                            ? { prefix: (s = K1(c.split(" "), { skipLookups: !0 })).prefix || k, iconName: A(s.prefix, s.iconName) || s.iconName }
                            : "string" == typeof c
                            ? { prefix: k, iconName: A(k, c) || c }
                            : void 0;
                    },
                },
                library: z2,
                findIconDefinition: a2,
                toHtml: w,
            },
            j = function () {
                var c = 0 < arguments.length && void 0 !== arguments[0] ? arguments[0] : {},
                    { autoReplaceSvgRoot: c = h } = c;
                (0 < Object.keys(V.styles).length || p.autoFetchSvg) && r && p.autoReplaceSvg && e2.dom.i2svg({ node: c });
            };
        function L2(l, c) {
            return (
                Object.defineProperty(l, "abstract", { get: c }),
                Object.defineProperty(l, "html", {
                    get: function () {
                        return l.abstract.map((c) => w(c));
                    },
                }),
                Object.defineProperty(l, "node", {
                    get: function () {
                        var c;
                        if (r) return ((c = h.createElement("div")).innerHTML = l.html), c.children;
                    },
                }),
                l
            );
        }
        function t2(c) {
            let {
                icons: { main: l, mask: s },
                prefix: a,
                iconName: z,
                transform: e,
                symbol: L,
                title: t,
                maskId: M,
                titleId: r,
                extra: m,
                watchable: f = !1,
            } = c;
            var i,
                C,
                { width: o, height: n } = s.found ? s : l,
                h = G.includes(a),
                d = [p.replacementClass, z ? "".concat(p.cssPrefix, "-").concat(z) : ""]
                    .filter((c) => -1 === m.classes.indexOf(c))
                    .filter((c) => "" !== c || !!c)
                    .concat(m.classes)
                    .join(" "),
                d = { children: [], attributes: u(u({}, m.attributes), {}, { "data-prefix": a, "data-icon": z, class: d, role: m.attributes.role || "img", xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 ".concat(o, " ").concat(n) }) },
                h = h && !~m.classes.indexOf("fa-fw") ? { width: "".concat((o / n) * 16 * 0.0625, "em") } : {},
                o =
                    (f && (d.attributes[v] = ""),
                    t && (d.children.push({ tag: "title", attributes: { id: d.attributes["aria-labelledby"] || "title-".concat(r || g()) }, children: [t] }), delete d.attributes.title),
                    u(u({}, d), {}, { prefix: a, iconName: z, main: l, mask: s, maskId: M, transform: e, symbol: L, styles: u(u({}, h), m.styles) })),
                { children: n, attributes: d } = s.found && l.found ? O("generateAbstractMask", o) || { children: [], attributes: {} } : O("generateAbstractIcon", o) || { children: [], attributes: {} };
            return (
                (o.children = n),
                (o.attributes = d),
                L
                    ? (({ prefix: h, iconName: n, children: d, attributes: C, symbol: i } = o),
                      (h = !0 === i ? "".concat(h, "-").concat(p.cssPrefix, "-").concat(n) : i),
                      [{ tag: "svg", attributes: { style: "display: none;" }, children: [{ tag: "symbol", attributes: u(u({}, C), {}, { id: h }), children: d }] }])
                    : (({ children: n, main: i, mask: C, attributes: h, styles: d, transform: o } = o),
                      H1(o) && i.found && !C.found && (({ width: C, height: i } = i), (C = { x: C / i / 2, y: 0.5 }), (h.style = H(u(u({}, d), {}, { "transform-origin": "".concat(C.x + o.x / 16, "em ").concat(C.y + o.y / 16, "em") })))),
                      [{ tag: "svg", attributes: h, children: n }])
            );
        }
        function M2(c) {
            var { content: l, width: s, height: a, transform: z, title: e, extra: L, watchable: t = !1 } = c,
                M = u(u(u({}, L.attributes), e ? { title: e } : {}), {}, { class: L.classes.join(" ") }),
                t = (t && (M[v] = ""), u({}, L.styles)),
                L =
                    (H1(z) &&
                        ((t.transform = ((c) => {
                            var { transform: l, width: s = c1, height: a = c1, startCentered: z = !1 } = c;
                            let e = "";
                            return (
                                z && Y
                                    ? (e += "translate(".concat(l.x / n - s / 2, "em, ").concat(l.y / n - a / 2, "em) "))
                                    : (e += z ? "translate(calc(-50% + ".concat(l.x / n, "em), calc(-50% + ").concat(l.y / n, "em)) ") : "translate(".concat(l.x / n, "em, ").concat(l.y / n, "em) ")),
                                (e = (e += "scale(".concat((l.size / n) * (l.flipX ? -1 : 1), ", ").concat((l.size / n) * (l.flipY ? -1 : 1), ") ")) + "rotate(".concat(l.rotate, "deg) "))
                            );
                        })({ transform: z, startCentered: !0, width: s, height: a })),
                        (t["-webkit-transform"] = t.transform)),
                    H(t)),
                z = (0 < L.length && (M.style = L), []);
            return z.push({ tag: "span", attributes: M, children: [l] }), e && z.push({ tag: "span", attributes: { class: "sr-only" }, children: [e] }), z;
        }
        let r2 = V.styles;
        function m2(c) {
            var l = c[0],
                s = c[1],
                [a] = c.slice(4);
            let z = null;
            return {
                found: !0,
                width: l,
                height: s,
                icon: (z = Array.isArray(a)
                    ? {
                          tag: "g",
                          attributes: { class: "".concat(p.cssPrefix, "-").concat(d1.GROUP) },
                          children: [
                              { tag: "path", attributes: { class: "".concat(p.cssPrefix, "-").concat(d1.SECONDARY), fill: "currentColor", d: a[0] } },
                              { tag: "path", attributes: { class: "".concat(p.cssPrefix, "-").concat(d1.PRIMARY), fill: "currentColor", d: a[1] } },
                          ],
                      }
                    : { tag: "path", attributes: { fill: "currentColor", d: a } }),
            };
        }
        let f2 = { found: !1, width: 512, height: 512 };
        function i2(e, L) {
            let t = L;
            return (
                "fa" === L && null !== p.styleDefault && (L = k),
                new Promise((c, l) => {
                    var s, a, z;
                    if (("fa" === t && ((s = B1(e) || {}), (e = s.iconName || e), (L = s.prefix || L)), e && L && r2[L] && r2[L][e])) return c(m2(r2[L][e]));
                    (a = e),
                        (z = L),
                        r1 || p.showMissingIcons || !a || console.error('Icon with name "'.concat(a, '" and prefix "').concat(z, '" is missing.')),
                        c(u(u({}, f2), {}, { icon: (p.showMissingIcons && e && O("missingIconAbstract")) || {} }));
                })
            );
        }
        c = () => {};
        let C2 = p.measurePerformance && s && s.mark && s.measure ? s : { mark: c, measure: c },
            P = 'FA "6.7.2"',
            o2 = (c) => {
                C2.mark("".concat(P, " ").concat(c, " ends")), C2.measure("".concat(P, " ").concat(c), "".concat(P, " ").concat(c, " begins"), "".concat(P, " ").concat(c, " ends"));
            };
        var n2 = { begin: (c) => (C2.mark("".concat(P, " ").concat(c, " begins")), () => o2(c)), end: o2 };
        let h2 = () => {};
        function d2(c) {
            return "string" == typeof (c.getAttribute ? c.getAttribute(v) : null);
        }
        function u2(l, c) {
            let {
                ceFn: s = "svg" === l.tag
                    ? function (c) {
                          return h.createElementNS("http://www.w3.org/2000/svg", c);
                      }
                    : function (c) {
                          return h.createElement(c);
                      },
            } = 1 < arguments.length && void 0 !== c ? c : {};
            if ("string" == typeof l) return h.createTextNode(l);
            let a = s(l.tag);
            return (
                Object.keys(l.attributes || []).forEach(function (c) {
                    a.setAttribute(c, l.attributes[c]);
                }),
                (l.children || []).forEach(function (c) {
                    a.appendChild(u2(c, { ceFn: s }));
                }),
                a
            );
        }
        let v2 = {
            replace: function (c) {
                let l = c[0];
                var s;
                l.parentNode &&
                    (c[1].forEach((c) => {
                        l.parentNode.insertBefore(u2(c), l);
                    }),
                    null === l.getAttribute(v) && p.keepOriginalSource ? ((s = h.createComment(((c = l), (s = " ".concat(c.outerHTML, " ")), "".concat(s, "Font Awesome fontawesome.com ")))), l.parentNode.replaceChild(s, l)) : l.remove());
            },
            nest: function (c) {
                var l = c[0],
                    s = c[1];
                if (~g1(l).indexOf(p.replacementClass)) return v2.replace(c);
                let a = new RegExp("".concat(p.cssPrefix, "-.*"));
                delete s[0].attributes.id,
                    s[0].attributes.class &&
                        ((z = s[0].attributes.class.split(" ").reduce((c, l) => ((l === p.replacementClass || l.match(a) ? c.toSvg : c.toNode).push(l), c), { toNode: [], toSvg: [] })),
                        (s[0].attributes.class = z.toSvg.join(" ")),
                        0 === z.toNode.length ? l.removeAttribute("class") : l.setAttribute("class", z.toNode.join(" ")));
                var z = s.map((c) => w(c)).join("\n");
                l.setAttribute(v, ""), (l.innerHTML = z);
            },
        };
        function p2(c) {
            c();
        }
        function g2(s, c) {
            let a = "function" == typeof c ? c : h2;
            if (0 === s.length) a();
            else {
                let c = p2;
                (c = p.mutateApproach === t1 ? l.requestAnimationFrame || p2 : c)(() => {
                    var c = (!0 !== p.autoReplaceSvg && v2[p.autoReplaceSvg]) || v2.replace,
                        l = n2.begin("mutate");
                    s.map(c), l(), a();
                });
            }
        }
        let b2 = !1;
        function H2() {
            b2 = !0;
        }
        function V2() {
            b2 = !1;
        }
        let w2 = null;
        function y2(c) {
            if (!R) return;
            if (!p.observeMutations) return;
            let { treeCallback: e = h2, nodeCallback: L = h2, pseudoElementsCallback: t = h2, observeMutationsRoot: l = h } = c;
            (w2 = new R((c) => {
                if (!b2) {
                    let z = k;
                    b(c).forEach((c) => {
                        var l, s, a;
                        "childList" === c.type && 0 < c.addedNodes.length && !d2(c.addedNodes[0]) && (p.searchPseudoElements && t(c.target), e(c.target)),
                            "attributes" === c.type && c.target.parentNode && p.searchPseudoElements && t(c.target.parentNode),
                            "attributes" === c.type &&
                                d2(c.target) &&
                                ~h1.indexOf(c.attributeName) &&
                                ("class" === c.attributeName && ((l = c.target), (s = l.getAttribute ? l.getAttribute(z1) : null), (a = l.getAttribute ? l.getAttribute(e1) : null), s) && a
                                    ? (({ prefix: s, iconName: a } = K1(g1(c.target))), c.target.setAttribute(z1, s || z), a && c.target.setAttribute(e1, a))
                                    : (l = c.target) && l.classList && l.classList.contains && l.classList.contains(p.replacementClass) && L(c.target));
                    });
                }
            })),
                r && w2.observe(l, { childList: !0, attributes: !0, characterData: !0, subtree: !0 });
        }
        function k2(c) {
            var l,
                s,
                a = c.getAttribute("data-prefix"),
                z = c.getAttribute("data-icon"),
                e = void 0 !== c.innerText ? c.innerText.trim() : "",
                L = K1(g1(c));
            return (
                L.prefix || (L.prefix = k),
                a && z && ((L.prefix = a), (L.iconName = z)),
                (L.iconName && L.prefix) ||
                    (L.prefix && 0 < e.length && (L.iconName = ((l = L.prefix), (s = c.innerText), (T1[l] || {})[s] || U1(L.prefix, j1(c.innerText)))),
                    !L.iconName && p.autoFetchSvg && c.firstChild && c.firstChild.nodeType === Node.TEXT_NODE && (L.iconName = c.firstChild.data)),
                L
            );
        }
        function S2(c, l) {
            var s = 1 < arguments.length && void 0 !== l ? l : { styleParser: !0 },
                { iconName: a, prefix: z, rest: e } = k2(c),
                L =
                    ((M = b((l = c).attributes).reduce((c, l) => ("class" !== c.name && "style" !== c.name && (c[l.name] = l.value), c), {})),
                    (L = l.getAttribute("title")),
                    (t = l.getAttribute("data-fa-title-id")),
                    p.autoA11y && (L ? (M["aria-labelledby"] = "".concat(p.replacementClass, "-title-").concat(t || g())) : ((M["aria-hidden"] = "true"), (M.focusable = "false"))),
                    M),
                t = s2("parseNodeAttributes", {}, c),
                M = s.styleParser
                    ? ((c) => {
                          var l = c.getAttribute("style");
                          let s = [];
                          return (s = l
                              ? l.split(";").reduce((c, l) => {
                                    var s = l.split(":"),
                                        a = s[0],
                                        s = s.slice(1);
                                    return a && 0 < s.length && (c[a] = s.join(":").trim()), c;
                                }, {})
                              : s);
                      })(c)
                    : [];
            return u(
                {
                    iconName: a,
                    title: c.getAttribute("title"),
                    titleId: c.getAttribute("data-fa-title-id"),
                    prefix: z,
                    transform: d,
                    mask: { iconName: null, prefix: null, rest: [] },
                    maskId: null,
                    symbol: !1,
                    extra: { classes: e, styles: M, attributes: L },
                },
                t
            );
        }
        let A2 = V.styles;
        function x2(c) {
            var l = "nest" === p.autoReplaceSvg ? S2(c, { styleParser: !1 }) : S2(c);
            return ~l.extra.classes.indexOf(o1) ? O("generateLayersText", c, l) : O("generateSvgReplacementMutation", c, l);
        }
        function q2(c) {
            let a = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : null;
            if (!r) return Promise.resolve();
            let l = h.documentElement.classList,
                z = (c) => l.add("".concat(L1, "-").concat(c)),
                e = (c) => l.remove("".concat(L1, "-").concat(c));
            var s = p.autoFetchSvg ? [...X, ...$] : W.concat(Object.keys(A2)),
                s = (s.includes("fa") || s.push("fa"), [".".concat(o1, ":not([").concat(v, "])")].concat(s.map((c) => ".".concat(c, ":not([").concat(v, "])"))).join(", "));
            if (0 === s.length) return Promise.resolve();
            let L = [];
            try {
                L = b(c.querySelectorAll(s));
            } catch (c) {}
            if (!(0 < L.length)) return Promise.resolve();
            z("pending"), e("complete");
            let t = n2.begin("onTree"),
                M = L.reduce((c, l) => {
                    try {
                        var s = x2(l);
                        s && c.push(s);
                    } catch (c) {
                        r1 || ("MissingIcon" === c.name && console.error(c));
                    }
                    return c;
                }, []);
            return new Promise((l, s) => {
                Promise.all(M)
                    .then((c) => {
                        g2(c, () => {
                            z("active"), z("complete"), e("pending"), "function" == typeof a && a(), t(), l();
                        });
                    })
                    .catch((c) => {
                        t(), s(c);
                    });
            });
        }
        function Z2(c) {
            let l = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : null;
            x2(c).then((c) => {
                c && g2([c], l);
            });
        }
        function O2(a) {
            let z = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : {},
                { transform: e = d, symbol: L = !1, mask: t = null, maskId: M = null, title: r = null, titleId: m = null, classes: f = [], attributes: i = {}, styles: C = {} } = z;
            if (a) {
                let { prefix: c, iconName: l, icon: s } = a;
                return L2(
                    u({ type: "icon" }, a),
                    () => (
                        Z("beforeDOMElementCreation", { iconDefinition: a, params: z }),
                        p.autoA11y && (r ? (i["aria-labelledby"] = "".concat(p.replacementClass, "-title-").concat(m || g())) : ((i["aria-hidden"] = "true"), (i.focusable = "false"))),
                        t2({
                            icons: { main: m2(s), mask: t ? m2(t.icon) : { found: !1, width: null, height: null, icon: {} } },
                            prefix: c,
                            iconName: l,
                            transform: u(u({}, d), e),
                            symbol: L,
                            title: r,
                            maskId: M,
                            titleId: m,
                            extra: { attributes: i, styles: C, classes: f },
                        })
                    )
                );
            }
        }
        let j2 = {
                mixout() {
                    return {
                        icon:
                            ((z = O2),
                            function (c) {
                                var l = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : {},
                                    s = (c || {}).icon ? c : a2(c || {});
                                let a = l.mask;
                                return (a = a && ((a || {}).icon ? a : a2(a || {}))), z(s, u(u({}, l), {}, { mask: a }));
                            }),
                    };
                    var z;
                },
                hooks() {
                    return {
                        mutationObserverCallbacks(c) {
                            return (c.treeCallback = q2), (c.nodeCallback = Z2), c;
                        },
                    };
                },
                provides(c) {
                    (c.i2svg = function (c) {
                        var { node: l = h, callback: s = () => {} } = c;
                        return q2(l, s);
                    }),
                        (c.generateSvgReplacementMutation = function (z, c) {
                            let { iconName: e, title: L, titleId: t, prefix: M, transform: r, symbol: m, mask: l, maskId: f, extra: i } = c;
                            return new Promise((a, c) => {
                                Promise.all([i2(e, M), l.iconName ? i2(l.iconName, l.prefix) : Promise.resolve({ found: !1, width: 512, height: 512, icon: {} })])
                                    .then((c) => {
                                        var [l, s] = c;
                                        a([z, t2({ icons: { main: l, mask: s }, prefix: M, iconName: e, transform: r, symbol: m, maskId: f, title: L, titleId: t, extra: i, watchable: !0 })]);
                                    })
                                    .catch(c);
                            });
                        }),
                        (c.generateAbstractIcon = function (c) {
                            var { children: l, attributes: s, main: a, transform: z, styles: e } = c,
                                e = H(e);
                            0 < e.length && (s.style = e);
                            let L;
                            return H1(z) && (L = O("generateAbstractTransformGrouping", { main: a, transform: z, containerWidth: a.width, iconWidth: a.width })), l.push(L || a.icon), { children: l, attributes: s };
                        });
                },
            },
            P2 = {
                mixout() {
                    return {
                        layer(c) {
                            let s = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : {},
                                { classes: a = [] } = s;
                            return L2({ type: "layer" }, () => {
                                Z("beforeDOMElementCreation", { assembler: c, params: s });
                                let l = [];
                                return (
                                    c((c) => {
                                        Array.isArray(c)
                                            ? c.map((c) => {
                                                  l = l.concat(c.abstract);
                                              })
                                            : (l = l.concat(c.abstract));
                                    }),
                                    [{ tag: "span", attributes: { class: ["".concat(p.cssPrefix, "-layers"), ...a].join(" ") }, children: l }]
                                );
                            });
                        },
                    };
                },
            },
            N2 = {
                mixout() {
                    return {
                        counter(z) {
                            let e = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : {},
                                { title: L = null, classes: t = [], attributes: M = {}, styles: r = {} } = e;
                            return L2({ type: "counter", content: z }, () => {
                                Z("beforeDOMElementCreation", { content: z, params: e });
                                var { content: c, title: l, extra: s } = { content: z.toString(), title: L, extra: { attributes: M, styles: r, classes: ["".concat(p.cssPrefix, "-layers-counter"), ...t] } },
                                    a = u(u(u({}, s.attributes), l ? { title: l } : {}), {}, { class: s.classes.join(" ") });
                                return 0 < (s = H(s.styles)).length && (a.style = s), (s = []).push({ tag: "span", attributes: a, children: [c] }), l && s.push({ tag: "span", attributes: { class: "sr-only" }, children: [l] }), s;
                            });
                        },
                    };
                },
            },
            E2 = {
                mixout() {
                    return {
                        text(c) {
                            let l = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : {},
                                { transform: s = d, title: a = null, classes: z = [], attributes: e = {}, styles: L = {} } = l;
                            return L2(
                                { type: "text", content: c },
                                () => (
                                    Z("beforeDOMElementCreation", { content: c, params: l }),
                                    M2({ content: c, transform: u(u({}, d), s), title: a, extra: { attributes: e, styles: L, classes: ["".concat(p.cssPrefix, "-layers-text"), ...z] } })
                                )
                            );
                        },
                    };
                },
                provides(c) {
                    c.generateLayersText = function (c, l) {
                        var s,
                            a,
                            { title: z, transform: e, extra: L } = l;
                        let t = null,
                            M = null;
                        return (
                            Y && ((s = parseInt(getComputedStyle(c).fontSize, 10)), (a = c.getBoundingClientRect()), (t = a.width / s), (M = a.height / s)),
                            p.autoA11y && !z && (L.attributes["aria-hidden"] = "true"),
                            Promise.resolve([c, M2({ content: c.innerHTML, width: t, height: M, transform: e, title: z, extra: L, watchable: !0 })])
                        );
                    };
                },
            },
            I2 = new RegExp('"', "ug"),
            F2 = [1105920, 1112319],
            D2 = u(
                u(
                    u(u({}, { FontAwesome: { normal: "fas", 400: "fas" } }), {
                        "Font Awesome 6 Free": { 900: "fas", 400: "far" },
                        "Font Awesome 6 Pro": { 900: "fas", 400: "far", normal: "far", 300: "fal", 100: "fat" },
                        "Font Awesome 6 Brands": { 400: "fab", normal: "fab" },
                        "Font Awesome 6 Duotone": { 900: "fad", 400: "fadr", normal: "fadr", 300: "fadl", 100: "fadt" },
                        "Font Awesome 6 Sharp": { 900: "fass", 400: "fasr", normal: "fasr", 300: "fasl", 100: "fast" },
                        "Font Awesome 6 Sharp Duotone": { 900: "fasds", 400: "fasdr", normal: "fasdr", 300: "fasdl", 100: "fasdt" },
                    }),
                    {
                        "Font Awesome 5 Free": { 900: "fas", 400: "far" },
                        "Font Awesome 5 Pro": { 900: "fas", 400: "far", normal: "far", 300: "fal" },
                        "Font Awesome 5 Brands": { 400: "fab", normal: "fab" },
                        "Font Awesome 5 Duotone": { 900: "fad" },
                    }
                ),
                { "Font Awesome Kit": { 400: "fak", normal: "fak" }, "Font Awesome Kit Duotone": { 400: "fakd", normal: "fakd" } }
            ),
            T2 = Object.keys(D2).reduce((c, l) => ((c[l.toLowerCase()] = D2[l]), c), {}),
            R2 = Object.keys(T2).reduce((c, l) => {
                var s = T2[l];
                return (c[l] = s[900] || [...Object.entries(s)][0][1]), c;
            }, {});
        function _2(C, o) {
            let n = "".concat(a1).concat(o.replace(":", "-"));
            return new Promise((t, s) => {
                if (null !== C.getAttribute(n)) return t();
                var a,
                    z,
                    M = b(C.children).filter((c) => c.getAttribute(s1) === o)[0],
                    r = l.getComputedStyle(C, o),
                    m = r.getPropertyValue("font-family"),
                    f = m.match(n1),
                    i = r.getPropertyValue("font-weight");
                let c = r.getPropertyValue("content");
                if (M && !f) return C.removeChild(M), t();
                if (f && "none" !== c && "" !== c) {
                    let c = r.getPropertyValue("content"),
                        e = ((z = i), (r = m.replace(/^['"]|['"]$/g, "").toLowerCase()), (i = parseInt(z)), (i = isNaN(i) ? "normal" : i), (T2[r] || {})[i] || R2[r]);
                    (z = c),
                        (m = z.replace(I2, "")),
                        (z = 0),
                        (i = (a = m).length),
                        (r = (i = 55296 <= (r = a.charCodeAt(z)) && r <= 56319 && z + 1 < i && 56320 <= (i = a.charCodeAt(z + 1)) && i <= 57343 ? 1024 * (r - 55296) + i - 56320 + 65536 : r) >= F2[0] && i <= F2[1]);
                    var { value: m, isSecondary: r } = { value: j1((i = 2 === m.length && m[0] === m[1]) ? m[0] : m), isSecondary: r || i },
                        i = f[0].startsWith("FontAwesome");
                    let l = U1(e, m),
                        L = l;
                    if (
                        (i && ((a = m), (f = _1[a]), (i = U1("fas", a)), (m = f || (i ? { prefix: "fas", iconName: i } : null) || { prefix: null, iconName: null }).iconName) && m.prefix && ((l = m.iconName), (e = m.prefix)),
                        !l || r || (M && M.getAttribute(z1) === e && M.getAttribute(e1) === L))
                    )
                        t();
                    else {
                        C.setAttribute(n, L), M && C.removeChild(M);
                        let a = { iconName: null, title: null, titleId: null, prefix: null, transform: d, symbol: !1, mask: { iconName: null, prefix: null, rest: [] }, maskId: null, extra: { classes: [], styles: {}, attributes: {} } },
                            z = a.extra;
                        (z.attributes[s1] = o),
                            i2(l, e)
                                .then((c) => {
                                    var l = t2(u(u({}, a), {}, { icons: { main: c, mask: X1() }, prefix: e, iconName: L, extra: z, watchable: !0 })),
                                        s = h.createElementNS("http://www.w3.org/2000/svg", "svg");
                                    "::before" === o ? C.insertBefore(s, C.firstChild) : C.appendChild(s), (s.outerHTML = l.map((c) => w(c)).join("\n")), C.removeAttribute(n), t();
                                })
                                .catch(s);
                    }
                } else t();
            });
        }
        function Y2(c) {
            return Promise.all([_2(c, "::before"), _2(c, "::after")]);
        }
        function W2(c) {
            return !(c.parentNode === document.head || ~M1.indexOf(c.tagName.toUpperCase()) || c.getAttribute(s1) || (c.parentNode && "svg" === c.parentNode.tagName));
        }
        function U2(z) {
            if (r)
                return new Promise((c, l) => {
                    var s = b(z.querySelectorAll("*")).filter(W2).map(Y2);
                    let a = n2.begin("searchPseudoElements");
                    H2(),
                        Promise.all(s)
                            .then(() => {
                                a(), V2(), c();
                            })
                            .catch(() => {
                                a(), V2(), l();
                            });
                });
        }
        let B2 = {
                hooks() {
                    return {
                        mutationObserverCallbacks(c) {
                            return (c.pseudoElementsCallback = U2), c;
                        },
                    };
                },
                provides(c) {
                    c.pseudoElements2svg = function (c) {
                        var { node: l = h } = c;
                        p.searchPseudoElements && U2(l);
                    };
                },
            },
            X2 = !1,
            G2 = {
                mixout() {
                    return {
                        dom: {
                            unwatch() {
                                H2(), (X2 = !0);
                            },
                        },
                    };
                },
                hooks() {
                    return {
                        bootstrap() {
                            y2(s2("mutationObserverCallbacks", {}));
                        },
                        noAuto() {
                            w2 && w2.disconnect();
                        },
                        watch(c) {
                            var l = c.observeMutationsRoot;
                            X2 ? V2() : y2(s2("mutationObserverCallbacks", { observeMutationsRoot: l }));
                        },
                    };
                },
            },
            Q2 = (c) =>
                c
                    .toLowerCase()
                    .split(" ")
                    .reduce(
                        (c, l) => {
                            var s = l.toLowerCase().split("-"),
                                a = s[0],
                                z = s.slice(1).join("-");
                            if (a && "h" === z) c.flipX = !0;
                            else if (a && "v" === z) c.flipY = !0;
                            else if (((z = parseFloat(z)), !isNaN(z)))
                                switch (a) {
                                    case "grow":
                                        c.size = c.size + z;
                                        break;
                                    case "shrink":
                                        c.size = c.size - z;
                                        break;
                                    case "left":
                                        c.x = c.x - z;
                                        break;
                                    case "right":
                                        c.x = c.x + z;
                                        break;
                                    case "up":
                                        c.y = c.y - z;
                                        break;
                                    case "down":
                                        c.y = c.y + z;
                                        break;
                                    case "rotate":
                                        c.rotate = c.rotate + z;
                                }
                            return c;
                        },
                        { size: 16, x: 0, y: 0, flipX: !1, flipY: !1, rotate: 0 }
                    ),
            K2 = {
                mixout() {
                    return { parse: { transform: (c) => Q2(c) } };
                },
                hooks() {
                    return {
                        parseNodeAttributes(c, l) {
                            var s = l.getAttribute("data-fa-transform");
                            return s && (c.transform = Q2(s)), c;
                        },
                    };
                },
                provides(c) {
                    c.generateAbstractTransformGrouping = function (c) {
                        var { main: l, transform: s, containerWidth: a, iconWidth: z } = c,
                            a = { transform: "translate(".concat(a / 2, " 256)") },
                            e = "translate(".concat(32 * s.x, ", ").concat(32 * s.y, ") "),
                            L = "scale(".concat((s.size / 16) * (s.flipX ? -1 : 1), ", ").concat((s.size / 16) * (s.flipY ? -1 : 1), ") "),
                            s = "rotate(".concat(s.rotate, " 0 0)"),
                            a = { outer: a, inner: { transform: "".concat(e, " ").concat(L, " ").concat(s) }, path: { transform: "translate(".concat((z / 2) * -1, " -256)") } };
                        return { tag: "g", attributes: u({}, a.outer), children: [{ tag: "g", attributes: u({}, a.inner), children: [{ tag: l.icon.tag, children: l.icon.children, attributes: u(u({}, l.icon.attributes), a.path) }] }] };
                    };
                },
            },
            J2 = { x: 0, y: 0, width: "100%", height: "100%" };
        function $2(c) {
            return c.attributes && (c.attributes.fill || !(1 < arguments.length && void 0 !== arguments[1]) || arguments[1]) && (c.attributes.fill = "black"), c;
        }
        z = [
            Q,
            j2,
            P2,
            N2,
            E2,
            B2,
            G2,
            K2,
            {
                hooks() {
                    return {
                        parseNodeAttributes(c, l) {
                            var s = l.getAttribute("data-fa-mask"),
                                s = s ? K1(s.split(" ").map((c) => c.trim())) : X1();
                            return s.prefix || (s.prefix = k), (c.mask = s), (c.maskId = l.getAttribute("data-fa-mask-id")), c;
                        },
                    };
                },
                provides(c) {
                    c.generateAbstractMask = function (c) {
                        var { children: l, attributes: s, main: a, mask: z, maskId: e, transform: L } = c,
                            { width: a, icon: t } = a,
                            { width: z, icon: M } = z,
                            L = ((c) => {
                                var { transform: l, containerWidth: s, iconWidth: a } = c,
                                    s = { transform: "translate(".concat(s / 2, " 256)") },
                                    z = "translate(".concat(32 * l.x, ", ").concat(32 * l.y, ") "),
                                    e = "scale(".concat((l.size / 16) * (l.flipX ? -1 : 1), ", ").concat((l.size / 16) * (l.flipY ? -1 : 1), ") "),
                                    l = "rotate(".concat(l.rotate, " 0 0)");
                                return { outer: s, inner: { transform: "".concat(z, " ").concat(e, " ").concat(l) }, path: { transform: "translate(".concat((a / 2) * -1, " -256)") } };
                            })({ transform: L, containerWidth: z, iconWidth: a }),
                            z = { tag: "rect", attributes: u(u({}, J2), {}, { fill: "white" }) },
                            a = t.children ? { children: t.children.map($2) } : {},
                            t = { tag: "g", attributes: u({}, L.inner), children: [$2(u({ tag: t.tag, attributes: u(u({}, t.attributes), L.path) }, a))] },
                            a = { tag: "g", attributes: u({}, L.outer), children: [t] },
                            L = "mask-".concat(e || g()),
                            t = "clip-".concat(e || g()),
                            e = { tag: "mask", attributes: u(u({}, J2), {}, { id: L, maskUnits: "userSpaceOnUse", maskContentUnits: "userSpaceOnUse" }), children: [z, a] },
                            z = { tag: "defs", children: [{ tag: "clipPath", attributes: { id: t }, children: "g" === (c = M).tag ? c.children : [c] }, e] };
                        return l.push(z, { tag: "rect", attributes: u({ fill: "currentColor", "clip-path": "url(#".concat(t, ")"), mask: "url(#".concat(L, ")") }, J2) }), { children: l, attributes: s };
                    };
                },
            },
            {
                provides(c) {
                    let e = !1;
                    l.matchMedia && (e = l.matchMedia("(prefers-reduced-motion: reduce)").matches),
                        (c.missingIconAbstract = function () {
                            var c = [],
                                l = { fill: "currentColor" },
                                s = { attributeType: "XML", repeatCount: "indefinite", dur: "2s" },
                                a =
                                    (c.push({
                                        tag: "path",
                                        attributes: u(
                                            u({}, l),
                                            {},
                                            {
                                                d:
                                                    "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z",
                                            }
                                        ),
                                    }),
                                    u(u({}, s), {}, { attributeName: "opacity" })),
                                z = { tag: "circle", attributes: u(u({}, l), {}, { cx: "256", cy: "364", r: "28" }), children: [] };
                            return (
                                e || z.children.push({ tag: "animate", attributes: u(u({}, s), {}, { attributeName: "r", values: "28;14;28;28;14;28;" }) }, { tag: "animate", attributes: u(u({}, a), {}, { values: "1;0;1;1;0;1;" }) }),
                                c.push(z),
                                c.push({
                                    tag: "path",
                                    attributes: u(
                                        u({}, l),
                                        {},
                                        {
                                            opacity: "1",
                                            d:
                                                "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z",
                                        }
                                    ),
                                    children: e ? [] : [{ tag: "animate", attributes: u(u({}, a), {}, { values: "1;0;0;0;0;1;" }) }],
                                }),
                                e ||
                                    c.push({
                                        tag: "path",
                                        attributes: u(u({}, l), {}, { opacity: "0", d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z" }),
                                        children: [{ tag: "animate", attributes: u(u({}, a), {}, { values: "0;0;1;1;0;0;" }) }],
                                    }),
                                { tag: "g", attributes: { class: "missing" }, children: c }
                            );
                        });
                },
            },
            {
                hooks() {
                    return {
                        parseNodeAttributes(c, l) {
                            var s = l.getAttribute("data-fa-symbol");
                            return (c.symbol = null !== s && ("" === s || s)), c;
                        },
                    };
                },
            },
        ];
        {
            var c3 = z;
            let a = { mixoutsTo: e2 }.mixoutsTo;
            (c2 = c3),
                (x = {}),
                Object.keys(q).forEach((c) => {
                    -1 === l2.indexOf(c) && delete q[c];
                }),
                c2.forEach((c) => {
                    let s = c.mixout ? c.mixout() : {};
                    if (
                        (Object.keys(s).forEach((l) => {
                            "function" == typeof s[l] && (a[l] = s[l]),
                                "object" == typeof s[l] &&
                                    Object.keys(s[l]).forEach((c) => {
                                        a[l] || (a[l] = {}), (a[l][c] = s[l][c]);
                                    });
                        }),
                        c.hooks)
                    ) {
                        let l = c.hooks();
                        Object.keys(l).forEach((c) => {
                            x[c] || (x[c] = []), x[c].push(l[c]);
                        });
                    }
                    c.provides && c.provides(q);
                }),
                a;
        }
        !(function (c) {
            try {
                for (var l = arguments.length, s = new Array(1 < l ? l - 1 : 0), a = 1; a < l; a++) s[a - 1] = arguments[a];
                c(...s);
            } catch (c) {
                if (!r1) throw c;
            }
        })(function (c) {
            _ &&
                (l.FontAwesome || (l.FontAwesome = e2),
                x1(() => {
                    j(), Z("bootstrap");
                })),
                (V.hooks = u(
                    u({}, V.hooks),
                    {},
                    {
                        addPack: (c, l) => {
                            (V.styles[c] = u(u({}, V.styles[c] || {}), l)), S(), j();
                        },
                        addPacks: (c) => {
                            c.forEach((c) => {
                                var [l, s] = c;
                                V.styles[l] = u(u({}, V.styles[l] || {}), s);
                            }),
                                S(),
                                j();
                        },
                        addShims: (c) => {
                            V.shims.push(...c), S(), j();
                        },
                    }
                ));
        });
    })();
