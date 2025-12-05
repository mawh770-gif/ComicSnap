// functions/seriesCodeMap.js

/**
 * Maps the 5-digit Product/Title Code from the barcode to the official series name.
 * * ⚠️ NOTE ON VINTAGE COMICS: 
 * Comics published before ~1976 do NOT have barcodes. 
 * This map covers scanable books from the Bronze Age (late 70s) to Present.
 */
exports.seriesCodeMap = {
    // =======================================================
    // 🕷️ MARVEL: THE SPIDER-MAN FAMILY
    // =======================================================
    "04716": "Amazing Spider-Man (Legacy/2018)", 
    "02927": "Amazing Spider-Man (1963 Series)", // Late run 90s code
    "00100": "Amazing Spider-Man (General Placeholder)",
    "02673": "Spectacular Spider-Man (1976 Series)",
    "02904": "Web of Spider-Man (1985 Series)",
    "02345": "Spider-Man (1990 Todd McFarlane Series)",
    "02346": "Spider-Man Unlimited (1993 Series)",
    "04690": "Superior Spider-Man (2013 Series)",
    "02251": "Venom: Lethal Protector (1993 Series)",
    "09014": "Miles Morales: Spider-Man (2018 Series)",
    "01563": "Ultimate Spider-Man (2000 Series)",
    "09165": "Spider-Gwen (2015 Series)",

    // =======================================================
    // ❌ MARVEL: THE X-MEN FAMILY
    // =======================================================
    "02461": "Uncanny X-Men (1963/1981 Series)", // The massive Claremont run
    "09600": "X-Men (2019 Hickman Series)",
    "02285": "X-Men (1991 Lee/Claremont Series)",
    "02500": "X-Factor (1986 Series)",
    "02462": "New Mutants (1983 Series)",
    "09603": "New Mutants (2019 Series)",
    "02470": "X-Force (1991 Series)",
    "01698": "Wolverine (1988 Ongoing Series)",
    "04523": "Wolverine (2003 Series)",
    "09602": "Wolverine (2020 Series)",
    "02464": "Excalibur (1988 Series)",
    "02530": "Generation X (1994 Series)",
    "02220": "Gambit (1993 Series)",
    "09653": "Marauders (2019 Series)",
    "04491": "Astonishing X-Men (2004 Series)",

    // =======================================================
    // 🛡️ MARVEL: AVENGERS & HEROES (Bronze/Copper/Modern)
    // =======================================================
    "02920": "The Avengers (1963 Series)", // 80s/90s barcodes
    "04490": "Avengers (2018 Series)",
    "04838": "New Avengers (2005 Series)",
    "02456": "Captain America (1968 Series)", // 80s/90s barcodes
    "09109": "Captain America (2018 Series)",
    "02457": "Iron Man (1968 Series)",
    "02521": "The Mighty Thor (1966 Series)",
    "09602": "Thor (2020 Series)",
    "02925": "Incredible Hulk (1962 Series)", // 80s/90s barcodes
    "08968": "Immortal Hulk (2018 Series)",
    "02928": "Daredevil (1964 Series)",
    "08857": "Daredevil (2019 Series)",
    "02459": "Fantastic Four (1961 Series)",
    "09037": "Fantastic Four (2018 Series)",
    "02206": "Silver Surfer (1987 Series)",
    "02600": "Punisher (1987 Series)",
    "02601": "Punisher War Journal (1988 Series)",
    "02905": "Ghost Rider (1990 Series)",
    "02249": "Moon Knight (1980 Series)",
    "03300": "She-Hulk (1980 Series)",
    "08990": "Thanos (2016 Series)",
    "08113": "Star Wars (2015 Marvel Series)",
    "09600": "Star Wars (2020 Marvel Series)",
    "01938": "Conan the Barbarian (1970 Series)", // Later scanable issues

    // =======================================================
    // 🦇 DC COMICS: BATMAN & FAMILY
    // =======================================================
    "34194": "Batman (2016 Rebirth/Infinite)",
    "11415": "Batman (1940 Series)", // Post-1976 barcodes
    "20001": "Batman (2011 New 52)",
    "34285": "Detective Comics (2016 Series)",
    "13800": "Detective Comics (1937 Series)", // Post-1976 barcodes
    "15300": "Batman: Legends of the Dark Knight (1989)",
    "15400": "Batman: Shadow of the Bat (1992)",
    "34174": "Nightwing (2016 Series)",
    "16740": "Nightwing (1996 Series)",
    "34289": "Harley Quinn (2016 Series)",
    "34298": "Suicide Squad (2016 Series)",
    "11740": "Catwoman (1993 Series)",
    "35481": "Justice League (2018 Series)",
    "20007": "Justice League (2011 New 52)",
    "14800": "Justice League America (1987)",

    // =======================================================
    // 🦸 DC COMICS: SUPERMAN & HEROES
    // =======================================================
    "30603": "Superman (2016 Series)",
    "20003": "Superman (2011 New 52)",
    "18000": "Superman (1987 Series 2)",
    "34388": "Action Comics (2016 Series)",
    "11000": "Action Comics (1938 Series)", // Post-1976 barcodes
    "11020": "Adventures of Superman (1987)",
    "18300": "Superman: The Man of Steel (1991)",
    "34292": "Wonder Woman (2016 Series)",
    "19800": "Wonder Woman (1987 Series)",
    "34184": "The Flash (2016 Series)",
    "13400": "The Flash (1987 Series)",
    "14100": "Green Lantern (1990 Series)",
    "34187": "Green Lanterns (2016 Series)",
    "34200": "Aquaman (2016 Series)",
    "35773": "The Green Lantern (2018)",
    "19000": "Teen Titans (1966 Series)", // Post-1976 barcodes
    "16300": "New Teen Titans (1980/1984)",
    "35345": "Doomsday Clock (2017)",
    "36592": "Dark Crisis (2022)",
    "18200": "Swamp Thing (1982 Series)", // Alan Moore era barcodes

    // =======================================================
    // 💀 IMAGE COMICS
    // =======================================================
    "00001": "Spawn (1992 Series)",
    "00211": "The Walking Dead (2003 Series)",
    "05838": "The Walking Dead (Reprint/Variant Codes)",
    "00163": "Invincible (2003 Series)",
    "00100": "Savage Dragon (1993 Series)",
    "11223": "Saga (2012 Series)",
    "00183": "Witchblade (1995 Series)",
    "00155": "The Darkness (1996 Series)",
    "00753": "Chew (2009 Series)",
    "03038": "The Department of Truth (2020)",
    "01509": "Monstress (2015 Series)",
    "03264": "Radiant Black (2021 Series)",
    "00350": "Youngblood (1992 Series)",
    "00400": "WildC.A.T.s (1992 Series)",
    "02947": "Crossover (2020 Series)",
    "03212": "Geiger (2021 Series)",
    "00330": "Cyberforce (1992 Series)",
    "03061": "Stillwater (2020 Series)",

    // =======================================================
    // 🐢 IDW PUBLISHING
    // =======================================================
    "00411": "Teenage Mutant Ninja Turtles (2011 Series)",
    "03315": "TMNT (Reborn/2020s)",
    "03358": "TMNT x Naruto (2024)",
    "00355": "Locke & Key (2008)",
    "00676": "My Little Pony: Friendship is Magic",
    "00331": "Transformers (2019 Series)",
    "00100": "Transformers (2005 IDW Series 1)",
    "00450": "G.I. Joe: A Real American Hero (IDW)",
    "03339": "TMNT: Mutant Nation (2024)",
    "00323": "Usagi Yojimbo (IDW Run)",

    // =======================================================
    // 🐴 DARK HORSE & OTHERS
    // =======================================================
    "00378": "Hellboy (1994 Series)",
    "00486": "Sin City (1991 Series)",
    "00366": "Black Hammer (2016 Series)",
    "00667": "Umbrella Academy (2007)",
    "00511": "Stranger Things (2018)",
    "00388": "Critical Role: Vox Machina Origins",
    "00101": "Aliens (1988 Series)",
    "00102": "Predator (1989 Series)",
    "00103": "Terminator (1990 Series)",
    "00200": "Grendel (1982 Series)", // Later issues with barcodes
    "00500": "Buffy the Vampire Slayer (1998)",
    "00250": "The Mask (1991 Series)",
    "00400": "Concrete (1987 Series)",

    // =======================================================
    // 🏫 ARCHIE / VALIANT / BOOM!
    // =======================================================
    "00111": "Archie (2015 Series)",
    "00222": "Jughead (2015 Series)",
    "00333": "Betty & Veronica (2016 Series)",
    "00444": "Chilling Adventures of Sabrina",
    "00100": "X-O Manowar (1992 Series)",
    "00200": "Harbinger (1992 Series)",
    "00300": "Bloodshot (1993 Series)",
    "11330": "Mighty Morphin Power Rangers (2016)",
    "00140": "Something is Killing the Children",
    "00150": "Once & Future",
    "00160": "BRZRKR (2021)",
};