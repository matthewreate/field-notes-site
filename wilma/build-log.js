/* Wilma's build log, plus the few other things on her page you might change.

   TO ADD A FRAME: copy one { ... } block from the log, paste it at the TOP
   (newest first), and change its lines:

     photo    an Imgur direct link, the big "h" size:
              https://i.imgur.com/XXXXXXXh.jpeg
              The strip shows Imgur's smaller "l" size; tapping a frame opens this one.
     caption  a short line under the frame.
     alt      what's in the photo, for people who can't see it.
     tall     true for a vertical photo. Optional: the page works it out anyway,
              this just saves a little jump while it loads.

   Keep the quotes around text. A comma at the end of every line is fine.
   Frames count up from the oldest, so the newest has the biggest number. */

window.WILMA = {

  // The odometer on her dash, in miles. Bump it when you log a tank.
  odometer: 161882,

  // Where the film strip ends.
  thread: "https://turbobricks.com/index.php?threads/wilma-93-240-classic-wagon-80-of-1600.384568/",

  log: [
    {
      // A cropped copy that lives with the page: the original has a date stamp.
      photo: "img/shore.jpg",
      thumb: "img/shore-l.jpg",
      caption: "At the Shore.",
      alt: "Wilma parked at a curb beside a lawn, big white shore houses with blue awnings and an American flag behind her.",
    },
    {
      photo: "https://i.imgur.com/MuL2BeCh.jpeg",
      caption: "Loaded with DJ gear for her first wedding gig.",
      alt: "Wilma's tailgate open, the cargo area packed with speaker bags, gear cases and two orange cable reels.",
      tall: true,
    },
    {
      photo: "https://i.imgur.com/KgzcQ3fh.jpeg",
      caption: "The old fuel pressure regulator.",
      alt: "Close-up of the old fuel pressure regulator, a grimy little metal canister bolted in among black fuel and vacuum lines.",
    },
    {
      photo: "https://i.imgur.com/7v4IUNdh.jpeg",
      caption: "Original lacy spoke wheels.",
      alt: "Wilma from the front corner at night in an empty parking lot, lit by the flash, her lacy spoke wheels catching the light.",
    },
    {
      photo: "https://i.imgur.com/JrWxjdeh.jpeg",
      caption: "Florida car.",
      alt: "Wilma from low at the front corner, parked in a lot beside flower planters on an overcast day.",
    },
    {
      photo: "https://i.imgur.com/SR6chI5h.jpeg",
      caption: "Inside.",
      alt: "Wilma's front seats in grey cloth with tall headrests, seen across from the passenger side.",
    },
    {
      photo: "https://i.imgur.com/RNucrzrh.jpeg",
      caption: "Limited edition, No. 80 of 1600.",
      alt: "The limited edition plaque on the dash, reading 240 Classic, Limited Edition, No. 80/1600, above a strip of wood trim.",
      tall: true,
    },
    {
      photo: "https://i.imgur.com/613eUVTh.jpeg",
      caption: "The original owner's books.",
      alt: "A hand holding the original owner's book, a blue plaid booklet, over the grey cloth seat.",
      tall: true,
    },
    {
      photo: "https://i.imgur.com/48NRmIch.jpeg",
      caption: "Special Delivery sticker. Her first owner brought her over from Europe.",
      alt: "A round blue Special Delivery sticker on a rear side window, beaded with rain.",
    },
    {
      photo: "https://i.imgur.com/SAP5zBFh.jpeg",
      caption: "Engine bay, day one.",
      alt: "Wilma's engine bay with the hood up: the four-cylinder engine, hoses, the coolant tank and the battery.",
    },
    {
      photo: "https://i.imgur.com/WaLrBHUh.jpeg",
      caption: "Arrived on a trailer, September 1, 2026.",
      alt: "Wilma strapped onto a car trailer on a wet street in front of a white house, arrival day.",
      tall: true,
    },
  ],

  // The radio's preset buttons: the same recordings as the mix pages.
  radio: [
    { title: "Deep Cut Cocktail Hour", src: "https://pub-67f7093beab94c4c96e1858a443fbe71.r2.dev/mixes/Deep%20Cut%20Cocktail%20Hour.m4a" },
    { title: "Wine Bar Dinner", src: "https://pub-67f7093beab94c4c96e1858a443fbe71.r2.dev/mixes/Wine%20Bar%20Dinner.m4a" },
    { title: "Open Funk Format", src: "https://pub-67f7093beab94c4c96e1858a443fbe71.r2.dev/mixes/Open%20Funk%20Format%3F%20Mix.m4a" },
    { title: "Record Collector Cocktail Hour", src: "https://pub-67f7093beab94c4c96e1858a443fbe71.r2.dev/mixes/Record-Collector%20Cocktail%20Hour.mp3" },
    { title: "Disco House Mix", src: "https://pub-67f7093beab94c4c96e1858a443fbe71.r2.dev/mixes/Disco%20House%20Mix.m4a" },
  ],

  // What the hazard button turns up.
  smudge: {
    photo: "https://i.imgur.com/MHMgEBth.jpeg",
    caption: "Smudge rides along.",
    alt: "Smudge the pug in Wilma's driver's seat, looking out the open window.",
  },
};
