"""
Knowledge base data for Punarva RAG collections:
1. reuse_guides (20 guides)
2. material_standards (8 standards)
3. recycler_directory (8 recyclers/donation centres)
"""

REUSE_GUIDES = [
    {
        "id": "rg-01",
        "title": "Red Clay Brick Cleaning and Reclaimed Masonry",
        "category": "construction",
        "material": "Red clay bricks",
        "content": "Reclaimed burnt clay bricks can be reconditioned by chiseling off old lime or weak mortar. Soak bricks in water for 2 hours before reusing. First-class salvaged bricks have compressive strengths above 7.5 to 10 N/mm2 and are excellent for garden perimeter walls, flowerbeds, brick paving pathways, and non-load-bearing partitions.",
        "tags": ["bricks", "masonry", "cleaning", "construction"]
    },
    {
        "id": "rg-02",
        "title": "Fly Ash Brick Secondary Utilization & Paving",
        "category": "construction",
        "material": "Fly ash bricks",
        "content": "Fly ash bricks have uniform edges and low water absorption. Surplus pieces from construction sites make ideal interlocking pavers for courtyard paving, drainage trench lining, and foundation base courses. Do not crush undamaged bricks; dry-stack them on compacted sand beds for zero-cement porous pathways.",
        "tags": ["fly ash", "paving", "eco-friendly", "construction"]
    },
    {
        "id": "rg-03",
        "title": "Cement Bag Preservation and Rapid Reuse",
        "category": "construction",
        "material": "Cement bags",
        "content": "Leftover cement sacks degrade rapidly with atmospheric moisture. Inspect bags: if no hard lumps exist, the cement is prime for secondary casting. Sieve partially aerated cement to remove clinkers; use for non-structural applications like PCC flooring beds, compound wall plaster, fence pole grouting, or paver block mortar within 25 days.",
        "tags": ["cement", "storage", "plaster", "construction"]
    },
    {
        "id": "rg-04",
        "title": "River Sand Washing and Concrete Grade Reclamation",
        "category": "construction",
        "material": "River sand",
        "content": "Leftover washed river sand should be covered with tarpaulin to prevent weed seeds and silt contamination. Test silt content by settling in a glass jar (should be < 4%). Suitable for plaster mortar, screed flooring, bricklaying, and soil amendment in landscaping or terrace gardening.",
        "tags": ["sand", "aggregates", "mortar", "plaster"]
    },
    {
        "id": "rg-05",
        "title": "Broken Ceramic and Vitrified Tile Mosaic Crafting",
        "category": "tiles",
        "material": "Ceramic tiles",
        "content": "Chipped, discarded, or cut-piece ceramic and vitrified tiles can be transformed into stunning trencadis mosaic patterns. Score and break into tesserae tiles using tile nippers. Glue with cement-based adhesive over exterior tabletops, garden benches, bathroom accent niches, or drainage splash pads. Always wear safety glasses when chipping.",
        "tags": ["tiles", "mosaic", "craft", "upcycling"]
    },
    {
        "id": "rg-06",
        "title": "Granite & Marble Off-cut Repurposing",
        "category": "tiles",
        "material": "Granite slabs",
        "content": "Granite and marble sink cutouts or strip remnants are durable and weatherproof. Polish cut edges using diamond polishing pads (60 to 3000 grit). Ideal for outdoor kitchen counter shelves, threshold steps, window sills, heavy equipment vibration damping pads, and stepping stones.",
        "tags": ["granite", "stone", "countertops", "sills"]
    },
    {
        "id": "rg-07",
        "title": "Burma & Country Teak Reconditioning and Joinery",
        "category": "wood",
        "material": "Teak wood",
        "content": "Old teak timber retains natural silica and pest-resistant oils for decades. Remove old nails using magnetic detectors and pry bars. Plane 1mm off weathered surfaces to expose golden teak grain. Re-saw into planks for bookshelves, window framing, custom picture frames, or acoustic wall panel slats.",
        "tags": ["teak", "timber", "carpentry", "furniture"]
    },
    {
        "id": "rg-08",
        "title": "Plywood Offcut Modular Shelving & Workshop Fixtures",
        "category": "wood",
        "material": "Plywood sheets",
        "content": "BWP and commercial plywood scraps from interior fit-outs can be laminated face-to-face for heavy-duty workbench tops, French cleat tool holders, drawer organizers, and dog houses. Seal raw plywood edges with waterproof PVA adhesive or edge-banding tape to prevent de-lamination.",
        "tags": ["plywood", "shelving", "woodworking", "interiors"]
    },
    {
        "id": "rg-09",
        "title": "Solid Wooden Door Re-crafting into Dining and Study Tables",
        "category": "furniture",
        "material": "Wooden doors",
        "content": "Solid wood paneled doors can be converted into rustic 6-seater dining tables or study desks. Strip peeling varnish with eco-strippers, patch hinge cutouts with wood dowels, and mount onto steel hairpin legs or salvaged wooden trestle trestles. Finish with linseed oil or polyurethane topcoat.",
        "tags": ["doors", "tables", "upcycling", "furniture"]
    },
    {
        "id": "rg-10",
        "title": "Wooden Chair Structural Repair & Upholstery Rejuvenation",
        "category": "furniture",
        "material": "Wooden chairs",
        "content": "Wobbly wooden chairs usually suffer from dried animal glue in tenon joints. Disassemble loose joints, clean old glue residue, apply polyurethane wood glue, and clamp firmly for 12 hours. Replace sagging webbing with high-density foam and durable jute or cotton upholstery fabric for community hall seating.",
        "tags": ["chairs", "repair", "upholstery", "refurbish"]
    },
    {
        "id": "rg-11",
        "title": "TMT Steel Bar Rebar Welding & Security Fabrication",
        "category": "metals",
        "material": "Steel TMT bars",
        "content": "Fe-500 and Fe-550 TMT bar cutoffs (10mm to 20mm) can be wire-brushed to remove surface oxide. Excellent for welding sturdy window security grills, agricultural harrow tines, climbing plant trellises, cattle shed mangers, and trench reinforcement cages.",
        "tags": ["steel", "tmt", "fabrication", "welding"]
    },
    {
        "id": "rg-12",
        "title": "Aluminium Window Frame Smelting & Modular Extrusion Reuse",
        "category": "metals",
        "material": "Aluminium scrap frames",
        "content": "Aluminium extrusions are 100% recyclable without quality loss, saving 95% of the energy needed for primary bauxite smelting. Unbent channels can be bolted together for greenhouse framing, solar panel mounting racks, and lightweight storage shelving. Sell bent profiles directly to registered extrusion recyclers.",
        "tags": ["aluminium", "extrusion", "solar", "recycling"]
    },
    {
        "id": "rg-13",
        "title": "PVC Pipe Hydroponic Systems & Drip Irrigation",
        "category": "plastics",
        "material": "PVC pipes",
        "content": "Drill 3-inch circular holes along 4-inch PVC pipes to create vertical nutrient film technique (NFT) hydroponic vegetable gardens for leafy greens. Smaller 0.75-inch pipes can be fitted with micro-drippers for home terrace garden irrigation networks.",
        "tags": ["pvc", "irrigation", "hydroponics", "urban farming"]
    },
    {
        "id": "rg-14",
        "title": "HDPE Blue Barrel Rainwater Harvesting & Compost Tumblers",
        "category": "plastics",
        "material": "HDPE plastic barrels",
        "content": "High-density polyethylene (HDPE) 200-litre blue drums are food-safe and UV-stabilized. Fit a 0.75-inch brass bibcock tap 3 inches from the base and an overflow pipe near the rim for rainwater collection. Alternatively, mount on a central pipe axis to build an odor-free aerobic compost tumbler.",
        "tags": ["hdpe", "drums", "rainwater", "composting"]
    },
    {
        "id": "rg-15",
        "title": "Electrical Copper Cable Stripping and Safe Terminal Wiring",
        "category": "electronics",
        "material": "Electrical conduit cables",
        "content": "Test cable continuity with an ohmmeter to confirm insulation integrity (must exceed 1 Megohm). Intact cables can be utilized in conduits for garage lighting, sub-meter circuits, and generator hookups. Scrap copper wire cores can be mechanically stripped without open burning for high-purity electrical recycling.",
        "tags": ["copper", "cables", "electrical", "recycling"]
    },
    {
        "id": "rg-16",
        "title": "Computer UPS & Lead-Acid Battery Safe Reconditioning",
        "category": "electronics",
        "material": "Electronic e-waste",
        "content": "Inverter and UPS chassis often remain functional when only the sealed lead-acid (SLA) battery fails. Replace expired 12V SLA batteries with tested units to extend life by 3 years. Channel dead batteries to Authorized E-Waste recyclers to prevent dangerous lead-acid environmental pollution.",
        "tags": ["ups", "e-waste", "batteries", "power"]
    },
    {
        "id": "rg-17",
        "title": "Glass Window Pane Safety Cutters and Cold Frame Greenhouses",
        "category": "other",
        "material": "Glass panes",
        "content": "Intact window glass panes from demolition work can be trimmed using an oil-lubricated carbide wheel cutter. Build wooden cold-frames or miniature solar food dehydrators for drying chillies and mangoes in rural farmsteads.",
        "tags": ["glass", "solar dryer", "greenhouse"]
    },
    {
        "id": "rg-18",
        "title": "Corrugated Galvanized Iron (GI) Roofing Sheet Preservation",
        "category": "metals",
        "material": "GI roofing sheets",
        "content": "Inspect salvaged corrugated sheets for rust pinholes. Wire-brush oxidation spots, apply red oxide zinc-chromate primer, and coat with aluminium reflective paint. Use for cow sheds, firewood covers, bicycle shelters, and temporary site hoardings.",
        "tags": ["gi sheets", "roofing", "anti-rust", "shelter"]
    },
    {
        "id": "rg-19",
        "title": "Granite Stone Cobblestones & Rip-Rap Soil Erosion Control",
        "category": "construction",
        "material": "Stone boulders",
        "content": "Granite quarry spalls and construction rubble boulders can be dressed into rustic cobblestones or stacked dry into gabion wire mesh boxes to stabilize canal banks, farm water inlets, and sloped driveways against monsoon runoff.",
        "tags": ["stone", "gabion", "erosion", "landscaping"]
    },
    {
        "id": "rg-20",
        "title": "Scrap Cardboard & Packaging Material Vermicomposting",
        "category": "other",
        "material": "Cardboard packaging",
        "content": "Non-laminated corrugated cardboard cartons are rich in brown carbon matter. Shred into 1-inch strips, soak in cow-dung slurry, and introduce into earthworm vermicompost pits. Speeds up vermicomposting while eliminating open cardboard burning.",
        "tags": ["cardboard", "vermicompost", "organic", "soil"]
    }
]

MATERIAL_STANDARDS = [
    {
        "id": "std-01",
        "title": "IS 1077: Indian Standard for Common Burnt Clay Bricks",
        "category": "construction",
        "content": "Specifies dimensions (190x90x90mm / 230x110x70mm), water absorption limits (<20% by dry weight), efflorescence ratings (slight to nil), and minimum compressive strength classifications (Classes 3.5 to 35 N/mm2) for reused and new clay masonry.",
        "standard_code": "IS 1077:1992"
    },
    {
        "id": "std-02",
        "title": "IS 3812 / IS 12894: Fly Ash Lime Bricks Specifications",
        "category": "construction",
        "content": "Guidelines on pulverized fuel ash bricks. Minimum compressive strength should be 7.5 to 10 N/mm2, dry shrinkage under 0.05%, suitable for load-bearing and eco-friendly green building certification under GRIHA / IGBC standards.",
        "standard_code": "IS 12894:2002"
    },
    {
        "id": "std-03",
        "title": "IS 1489: Portland Pozzolana Cement Guidelines & Storage Shelf Life",
        "category": "construction",
        "content": "Bureau of Indian Standards stipulates that bagged cement stored beyond 90 days must be retested for compressive strength. If strength drop is 20-30%, downgrade use to non-structural blinding concrete or plastering mortar.",
        "standard_code": "IS 1489:2015 Part 1"
    },
    {
        "id": "std-04",
        "title": "CPWD Specifications 2019: Coarse & Fine Aggregates for Mortar",
        "category": "construction",
        "content": "Natural river sand for mortar must pass 100% through 4.75mm IS sieve and have fineness modulus between 1.5 and 3.0. Silt and clay content must not exceed 4% by volume for durable structural brickwork.",
        "standard_code": "CPWD Spec 2019 Vol 1"
    },
    {
        "id": "std-05",
        "title": "IS 1786: High Strength Deformed Steel Bars (Fe-415 / Fe-500 / Fe-550)",
        "category": "metals",
        "content": "Requirements for thermo-mechanically treated (TMT) steel reinforcement bars. Reclaimed bars must be free from deep pitting rust, laminated scales, or sharp chemical corrosion; yield stress verification required before heavy structural reuse.",
        "standard_code": "IS 1786:2008"
    },
    {
        "id": "std-06",
        "title": "IS 4985: Unplasticized PVC Pipes for Potable Water & Drainage",
        "category": "plastics",
        "content": "Specifies pressure classes (Class 1 to 6) and wall thicknesses for uPVC pipes. Salvaged pipes must be inspected for UV embrittlement, hairline longitudinal cracks, and socket gasket integrity before re-laying underground.",
        "standard_code": "IS 4985:2000"
    },
    {
        "id": "std-07",
        "title": "E-Waste (Management) Rules 2022: Ministry of Environment & Forests",
        "category": "electronics",
        "content": "Mandates Extended Producer Responsibility (EPR) and authorized channelization of discarded electrical and electronic components. Unregulated burning of circuit boards or acid leaching of gold/copper scrap is strictly prohibited and hazardous.",
        "standard_code": "E-Waste Rules 2022"
    },
    {
        "id": "std-08",
        "title": "IS 303 / IS 710: Plywood for General Purposes and Marine Grade",
        "category": "wood",
        "content": "Details moisture resistance, adhesive bonding (urea formaldehyde vs phenol formaldehyde), and cyclic boiling test compliance. Marine grade (IS 710) scraps withstand outdoor humidity and rainwater exposure without delaminating.",
        "standard_code": "IS 710:2010"
    }
]

RECYCLER_DIRECTORY = [
    {
        "id": "rec-01",
        "name": "Bapatla Coastal Metal & Scrap Yard",
        "category": "metals",
        "materials": ["Steel TMT bars", "Aluminium scrap frames", "Copper cables", "GI sheets"],
        "city": "Bapatla",
        "address": "Opposite Agricultural College Gate, GBC Road, Bapatla",
        "lat": 15.9150,
        "lng": 80.4720,
        "contact": "+91 8643 224110",
        "type": "recycler",
        "notes": "Buys clean structural steel, aluminium cutouts, and industrial scrap by weighbridge."
    },
    {
        "id": "rec-02",
        "name": "Chirala Handloom & Artisan Wood Reuse Depot",
        "category": "wood",
        "materials": ["Teak wood", "Plywood sheets", "Wooden doors", "Wooden chairs"],
        "city": "Chirala",
        "address": "Bypass Road, Near Rail Gate, Chirala",
        "lat": 15.8200,
        "lng": 80.3500,
        "contact": "+91 8616 232045",
        "type": "donation",
        "notes": "Accepts sound salvaged timber and doors; supplies artisans and vocational apprentice schools."
    },
    {
        "id": "rec-03",
        "name": "Guntur C&D Waste Processing & Paver Centre",
        "category": "construction",
        "materials": ["Red clay bricks", "Fly ash bricks", "River sand", "Ceramic tiles", "Concrete rubble"],
        "city": "Guntur",
        "address": "Autonagar Industrial Estate, Phase 2, Guntur",
        "lat": 16.3200,
        "lng": 80.4600,
        "contact": "+91 863 2259001",
        "type": "recycler",
        "notes": "Crushes brick and masonry debris into recycled concrete aggregates (RCA) and eco-paver base."
    },
    {
        "id": "rec-04",
        "name": "Bapatla Engineering College (BEC) Material Testing Lab",
        "category": "construction",
        "materials": ["Cement bags", "Fly ash bricks", "Red clay bricks", "Steel TMT bars"],
        "city": "Bapatla",
        "address": "BEC Campus, Mahatmajipuram, Bapatla",
        "lat": 15.9080,
        "lng": 80.4580,
        "contact": "+91 8643 224244",
        "type": "donation",
        "notes": "Welcomes surplus masonry, cement bags, and rebars for civil engineering student experimental setups and campus pavement construction."
    },
    {
        "id": "rec-05",
        "name": "AP State E-Waste Authorized Recyclers (Vijayawada-Guntur Corridor)",
        "category": "electronics",
        "materials": ["Electronic e-waste", "Electrical conduit cables", "UPS systems", "Circuit boards"],
        "city": "Guntur",
        "address": "NH16 Highway Logistics Hub, Mangalagiri / Guntur",
        "lat": 16.4250,
        "lng": 80.5500,
        "contact": "+91 866 2841920",
        "type": "recycler",
        "notes": "CPCB and APPCB authorized recycler providing formal Destruction & Green Disposal Certificates."
    },
    {
        "id": "rec-06",
        "name": "Coastal Polymer & PVC Pipe Re-granulation Unit",
        "category": "plastics",
        "materials": ["PVC pipes", "HDPE plastic barrels", "Plastic water tanks", "Conduit casing"],
        "city": "Tenali",
        "address": "Industrial Development Area, Guntur Road, Tenali",
        "lat": 16.2380,
        "lng": 80.6350,
        "contact": "+91 8644 227788",
        "type": "recycler",
        "notes": "Washes and shreds rigid HDPE barrels and PVC pipe offcuts into clean regrind pellets."
    },
    {
        "id": "rec-07",
        "name": "Chirala Rural Upliftment Community Building Bank",
        "category": "furniture",
        "materials": ["Wooden chairs", "Wooden doors", "Ceramic tiles", "Plywood sheets"],
        "city": "Chirala",
        "address": "Community Hall, Fishermen Colony, Chirala",
        "lat": 15.8150,
        "lng": 80.3450,
        "contact": "+91 94401 88290",
        "type": "donation",
        "notes": "Distributes repaired household materials, doors, and furniture to low-income coastal households rebuilding after storm surges."
    },
    {
        "id": "rec-08",
        "name": "Green Earth Society Upcycling Hub",
        "category": "other",
        "materials": ["Ceramic tiles", "HDPE plastic barrels", "Glass panes", "Cardboard packaging"],
        "city": "Guntur",
        "address": "Brodipet 4th Line, Guntur",
        "lat": 16.3050,
        "lng": 80.4320,
        "contact": "+91 863 2234567",
        "type": "donation",
        "notes": "Organizes DIY community workshops converting waste tiles to mosaic art and plastic drums to vertical urban planters."
    }
]
