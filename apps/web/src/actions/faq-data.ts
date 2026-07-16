export interface FAQItem {
    id: string;
    category?: string;
    question: string;
    answer: string;
}

export const DEFAULT_FAQ_ITEMS: FAQItem[] = [
    // ==========================================
    // CATEGORY 1: THE SCIENCE & RESEARCH
    // ==========================================
    {
        id: '101',
        category: 'The Science & Research',
        question: "Are standard piano keys actually 'standard' historically?",
        answer: `<p>There is a prevailing myth that the 6.5-inch (16.5 cm) octave width was handed down as an ergonomic ideal. Historical organology proves this assumption entirely false.</p>
        <p>Prior to the 1880s, keyboard sizes varied significantly. Instruments from the Baroque and Classical eras—played by Mozart, Haydn, and Bach—frequently featured much narrower keys and a lighter action perfectly suited for rapid finger work.</p>
        <p>As the piano evolved in the 19th century to fill larger concert halls, cast iron frames allowed for higher string tension. This necessitated heavier strings and substantially larger hammers. To provide the mechanical leverage to move these heavy hammers, the keys themselves became longer, heavier, and wider, eventually being standardized in the late 1880s.</p>
        <p class="text-xs text-neutral-500 mt-2"><em>Source: Keyboard Span in Old Musical Instruments Concerning Hand Span and Overuse Problems in Pianists (Sakai, 2008).</em></p>`
    },
    {
        id: '102',
        category: 'The Science & Research',
        question: "How many pianists actually have hands big enough for the standard keyboard?",
        answer: `<p>Extensive global anthropometric research reveals that the conventional piano keyboard is designed for a distinct anatomical minority.</p>
        <p>According to data collected by Pianists for Alternatively Sized Keyboards (PASK), a minimum active 1-5 span of 8.5 inches (21.6 cm) is required to safely navigate a conventional keyboard. However:</p>
        <ul class="list-disc pl-6 space-y-2 mt-4">
            <li><strong>87.1% of adult women</strong> possess a maximum hand span of less than 8.5 inches.</li>
            <li><strong>23.8% of adult men</strong> fall below this threshold.</li>
            <li><strong>100% of children</strong> play on keyboards that do not fit their growing hands.</li>
        </ul>
        <div class="my-8 bg-neutral-50 border border-neutral-200 rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <img src="/images/hands/Hand-Size-Chart-Data-1024x336.jpg" alt="Hand size demographic data" class="mx-auto max-w-full h-auto mix-blend-multiply rounded" />
            <p class="text-xs text-neutral-500 mt-4 font-sans"><strong>Figure 1:</strong> Data collected at the 2004 MTNA National Convention showing adult hand span distributions vs. keyboard suitability.</p>
        </div>
        <p>This means nearly nine out of every ten female pianists are dedicating their careers to an instrument that is biologically too large for them.</p>`
    },
    {
        id: '103',
        category: 'The Science & Research',
        question: "What physical injuries are caused by keyboards that are too large?",
        answer: `<p>Elite piano performance requires thousands of hours of repetitive, high-velocity physical execution. When an instrument does not fit the body, these forces compound, leading to Playing-Related Musculoskeletal Disorders (PRMDs).</p>
        <p>Studies by Dr. Naotaka Sakai and researchers at the University of North Texas found that <strong>86% of university piano majors experience active pain</strong> while playing. Conditions directly linked to over-stretching include tendonitis, tenosynovitis, focal dystonia, and carpal tunnel syndrome.</p>
        <p class="text-xs text-neutral-500 mt-2"><em>Source: Risk factors for piano-related pain among college students and piano teachers (Yoshimura et al., 2006).</em></p>`
    },
    {
        id: '104',
        category: 'The Science & Research',
        question: "How exactly does a large keyboard cause pain? (The Biomechanics)",
        answer: `<p>When a small-handed pianist attempts to play octaves or large chords on a standard keyboard, they are forced completely out of an "anatomically neutral" position into a state of maximum stretch known as <strong>hyperabduction</strong>.</p>
        <p>To achieve the span, players depress keys with their fingers splayed completely flat, destroying the supportive, bridge-like arch of the hand. This is often accompanied by severe <strong>ulnar deviation</strong> (bending the wrist sharply toward the pinky finger).</p>
        <div class="my-6 p-4 border border-neutral-200 bg-neutral-50 rounded-xl">
            <img src="/images/hands/Biomechanical Impact.jpeg" alt="Analysis of Hand Posture showing differences in thumb and 5th finger stretching" class="w-full h-auto rounded mix-blend-multiply" />
            <p class="text-xs text-neutral-500 mt-3 text-center uppercase tracking-widest font-semibold">Figure 2: Clinical comparison of small hands on a standard vs narrower keyboard.</p>
        </div>
        <p>Playing repetitively while in simultaneous hyperabduction and ulnar deviation severely strains the lumbrical muscles, stresses wrist tendons, and compresses the median nerve.</p>`
    },
    {
        id: '105',
        category: 'The Science & Research',
        question: "What is the clinical evidence supporting narrower keyboards?",
        answer: `<p>Robust, peer-reviewed medical literature deeply corroborates the efficacy of narrower keyboards.</p>
        <p>A formal study by Dr. Brenda Wristen utilizing surface electromyography (EMG) captured empirical data on muscle activity. The results indicated a <strong>drastic reduction in muscle fatigue and stress levels</strong> when small-handed pianists transitioned to a 7/8 (DS5.5) keyboard.</p>
        <p>Recently, Stanford University's School of Engineering developed an AI-trained model to map the physical stresses of piano playing. Elizabeth Schumann, Director of Keyboard Studies at Stanford, noted: <em>"We would never expect a world-class athlete to compete with equipment that does not fit their body. Yet we ask pianists, particularly women, to adapt to a one-size-fits-all design that was never built with them in mind."</em></p>`
    },
    {
        id: '106',
        category: 'The Science & Research',
        question: "What is the Donison-Steinbuhler (DS) Standard?",
        answer: `<p>The DS Standard was created in 1991 by Christopher Donison and engineer David Steinbuhler to standardize alternative piano sizes globally, ensuring compatibility for pianists everywhere. The foundation established three specific sizes:</p>
        <ul class="list-disc pl-6 space-y-2 mt-4">
            <li><strong>DS6.5® (Conventional):</strong> 6.5-inch octave. Suited for large hands (span > 8.5").</li>
            <li><strong>DS6.0® (Universal):</strong> 6.0-inch octave (15/16ths). Accommodates almost all men and the average female hand.</li>
            <li><strong>DS5.5® (7/8 Size):</strong> 5.5-inch octave (7/8ths). Eliminates the male hand-size advantage. Ideal for petite hands and children.</li>
        </ul>
        <p class="mt-4">DreamPlay is an official licensed partner of the DS Standard Foundation.</p>`
    },
    {
        id: '107',
        category: 'The Science & Research',
        question: "Why haven't major piano companies fixed this earlier?",
        answer: `<p>The piano industry is highly conservative, largely due to the "Concert Hall Fallacy." Manufacturers base their mass-production dimensions on the touring requirements of a minuscule fraction of elite international soloists, ignoring that 90% of pianos are played in homes and studios.</p>
        <p>Furthermore, the 6.5-inch standard was solidified during the Romantic era, an industry heavily dominated by male virtuosos with massive hands (like Liszt and Rachmaninoff) who wrote repertoire for their own anatomical advantages.</p>`
    },
    {
        id: '108',
        category: 'The Science & Research',
        question: "Do universities and conservatories recognize alternative sizes?",
        answer: `<p>Yes, leading institutions are spearheading this revolution. Southern Methodist University (SMU) in Dallas, under Dr. Carol Leone, was the first major US institution to formally integrate DS5.5 and DS6.0 keyboards in 2000.</p>
        <p>Today, universities including the University of North Texas, Johns Hopkins Peabody Institute, Eastman School of Music, and the University of Colorado Boulder maintain alternatively sized keyboards to protect their students from injury and expand their repertoire potential.</p>
        <div class="my-6 border-l-4 border-neutral-300 bg-neutral-50 p-6 rounded-r-xl">
            <p class="font-serif text-base md:text-lg italic leading-relaxed text-neutral-800 mb-4">"I cannot begin to describe the career-changing, and even life-changing, benefits our students have reaped from having these instruments to practice on daily. Their first response though was, 'Why did it take so long? Why did we have to suffer so unnecessarily?'"</p>
            <p class="font-sans text-sm font-bold text-neutral-900">Barbara Lister-Sink, Ed.D.</p>
            <p class="font-sans text-xs text-neutral-500">Salem College School of Music, Director, Graduate Music Program</p>
        </div>`
    },
    {
        id: '109',
        category: 'The Science & Research',
        question: "Did famous pianists use custom-sized keyboards?",
        answer: `<p>Yes. The rigid adherence to the 6.5-inch standard has historically been quietly bypassed by those with enough influence.</p>
        <p>The legendary pianist Josef Hofmann, a close friend of Rachmaninoff and the dedicatee of his notoriously difficult Third Piano Concerto, openly refused to perform the piece publicly due to the limitations of his smaller hand span. Hofmann demanded that Steinway & Sons build him a custom 7-foot instrument featuring a narrower 6.3-inch octave.</p>
        <p>Today, luminaries like Maestro Daniel Barenboim also utilize narrower keys for their recitals—a practice that is finally coming to light thanks to movements like the International Stretto Piano Festival.</p>`
    },

    // ==========================================
    // CATEGORY 2: THE PIANIST'S EXPERIENCE
    // ==========================================
    {
        id: '201',
        category: "The Pianist's Experience",
        question: "If I practice on a narrow keyboard, will I lose my ability to play a standard piano?",
        answer: `<p><strong>It's a natural fear, but the clinical data suggests the exact opposite:</strong> playing on narrower keys often improves your technique on standard ones.</p>
        <p>When you practice on a size that fits your hand, you learn to play with less tension. Your brain neurologically maps the correct, tension-free muscular sensations. When you return to a standard piano, that relaxed muscle memory translates with you.</p>
        <p>Hubert Ness, Professor of Jazz Piano at HMDK Stuttgart, noted: <em>"Another surprising effect for me was that playing this [DS6.0] also has a positive effect when you go back to the normal keyboard."</em></p>`
    },
    {
        id: '202',
        category: "The Pianist's Experience",
        question: "How long does it take to get used to a smaller keyboard?",
        answer: `<p>Adaptation is remarkably rapid. Dr. Carol Leone's academic research at SMU tracked student transitions and found that, on average, it takes a pianist merely <strong>10 to 15 minutes</strong> to adjust perfectly to a DS6.0 keyboard, and about <strong>40 minutes</strong> to map their brain to a DS5.5.</p>
        <p>Once this initial neural mapping occurs, pianists can switch between sizes effortlessly on the fly, much like a professional string player seamlessly switching between a violin and a viola.</p>`
    },
    {
        id: '203',
        category: "The Pianist's Experience",
        question: "What is the artistic advantage of reaching a 10th comfortably?",
        answer: `<p>Being able to reach a 10th isn't just about playing 10th intervals. It fundamentally changes how you play standard chords.</p>
        <p>If you can reach a 10th, it means 8ths and 9ths require zero hyperabduction. The intervals between your inner fingers (e.g., thumb and index) are significantly relaxed. A complex 4-note chord that used to require a tense, flat-fingered stretch can now be played with a curved, powerful, and structurally supported hand arch.</p>`
    },
    {
        id: '204',
        category: "The Pianist's Experience",
        question: "Will a smaller keyboard affect the tone or power I can produce?",
        answer: `<p>From a biomechanical perspective, an individual with small hands can actually produce a <strong>larger, richer, and more powerful tone</strong> on a narrower keyboard.</p>
        <p>Because you no longer have to stretch your fingers completely flat to reach the notes, you regain the natural bridge-like arch of your hand. This restores your mechanical leverage, allowing you to align your full arm weight directly over the keys and deliver downward force effortlessly.</p>`
    },
    {
        id: '205',
        category: "The Pianist's Experience",
        question: "How does a narrow keyboard help with sight-reading and memorization?",
        answer: `<p>Because the topography of the stretto keys falls naturally under a smaller hand, students no longer have to constantly look down to visually gauge massive leaps. You can finally trust your proprioception (muscle awareness) without calculating awkward workarounds on the fly.</p>
        <p>Memorization also improves exponentially because the physical mapping of complex chords becomes an intuitive grasp rather than a strained, unnatural stretch.</p>`
    },
    {
        id: '206',
        category: "The Pianist's Experience",
        question: "Is playing on a narrower keyboard considered 'cheating'?",
        answer: `<p>There is a pervasive, elitist "masochism" embedded in traditional piano culture that dictates one must suffer physical pain to truly master the instrument. Calling narrow keys "cheating" relies on profound cognitive dissonance—it ignores the reality that large-handed pianists are effectively playing on an ergonomic "easy mode" every time they sit at the bench.</p>
        <p>As researchers frequently point out, we don't expect female Olympic gymnasts or tennis players to compete on equipment sized exclusively for 6-foot-tall men. An appropriately sized instrument is an ergonomic right, not a cheat code.</p>`
    },
    {
        id: '207',
        category: "The Pianist's Experience",
        question: "What if my hands are already large? Should I still consider a DS6.0?",
        answer: `<p>Yes. Studies show that adult men with hand spans up to 9 inches—which is above the safety threshold for basic octaves—still report actively preferring the slightly narrower DS6.0 keys.</p>
        <p>When executing the wide 9th and 10th intervals demanded by Late-Romantic composers (Chopin, Liszt, Rachmaninoff), the DS6.0 dramatically reduces fatigue and increases accuracy, even for those with larger hands.</p>`
    },
    {
        id: '208',
        category: "The Pianist's Experience",
        question: "Why not just do stretching exercises to increase my hand span?",
        answer: `<p>Human bone structure and joint geometry cannot be safely altered through stretching. Medical literature proves that attempting to force your hands to stretch wider on a piano causes micro-tears in the lumbrical muscles and excessive strain on the tendons, leading directly to permanent repetitive strain injuries.</p>`
    },
    {
        id: '209',
        category: "The Pianist's Experience",
        question: "Can narrow keyboards help cure my piano-related tendonitis?",
        answer: `<p>Students suffering from severe, career-threatening PRMDs (Playing-Related Musculoskeletal Disorders), including chronic tendonitis and carpal tunnel syndrome, report that moving to a narrower keyboard acts as an immediate medical intervention.</p>
        <p>Dr. Jessica Johnson at the University of Wisconsin-Madison notes that the keyboards offer students <em>"enhanced musical possibilities, greater physical ease, and even recovery from pain and injury."</em> By removing the hyperabduction and ulnar deviation required to play large chords, the strain on the wrist and forearm is instantly relieved.</p>`
    },
    {
        id: '210',
        category: "The Pianist's Experience",
        question: "Can children and teenagers benefit from a narrower keyboard?",
        answer: `<p>Absolutely. 100% of children are playing instruments that are biologically too large for them. We do not make a 5-year-old play a full-size violin; we give them a 1/8th size.</p>
        <p>By allowing children to learn on a DS5.5, they learn proper, relaxed technique from day one, rather than developing tension-filled workarounds that will take years to unlearn later.</p>`
    },

    // ==========================================
    // CATEGORY 3: DREAMPLAY & ORDERING
    // ==========================================
    {
        id: '301',
        category: 'DreamPlay & Ordering',
        question: "Which DreamPlay model is right for me (DS5.5 vs DS6.0)?",
        answer: `<p>To find your fit, measure your active hand span (the maximum distance from the tip of your thumb to the tip of your pinky when stretched naturally over a ruler).</p>
        <ul class="list-disc pl-6 space-y-2 mt-4">
            <li><strong>If your span is under 7.6 inches (Zone A):</strong> The DS5.5 is your perfect match.</li>
            <li><strong>If your span is between 7.6 and 8.5 inches (Zone B):</strong> The DS6.0 will unlock new levels of comfort.</li>
        </ul>
        <p class="mt-4">You can download our 1:1 printable hand-measuring guide from our homepage to be absolutely certain.</p>`
    },
    {
        id: '302',
        category: 'DreamPlay & Ordering',
        question: "Why doesn't DreamPlay offer custom sizes like DS5.7 or DS6.2?",
        answer: `<p>It comes down to one thing: <strong>compatibility</strong>. We don't want you to fall in love with a piano size at home that you can't find anywhere else.</p>
        <p>We strictly build to the International DS standards (5.5 and 6.0) because these are the sizes being adopted by universities and concert halls globally. The data is clear: these two sizes solve the handspan issue for 87% of women and 24% of men. We'd rather build a tool that connects you to the wider music world than a niche instrument that isolates you.</p>`
    },
    {
        id: '303',
        category: 'DreamPlay & Ordering',
        question: "Does the DreamPlay One feel like a real acoustic piano?",
        answer: `<p>Absolutely. The DreamPlay One features an 88-key graded hammer-action keybed. The keys are fully weighted, providing the exact mechanical resistance and expressive touch dynamics required for professional classical and jazz performance.</p>`
    },
    {
        id: '304',
        category: 'DreamPlay & Ordering',
        question: "What connectivity options does it have?",
        answer: `<p>The DreamPlay One is built for the modern musician. It includes:</p>
        <ul class="list-disc pl-6 space-y-2 mt-4">
            <li><strong>Bluetooth Audio & MIDI:</strong> Connect wirelessly to iPads, computers, and DAWs.</li>
            <li><strong>USB-MIDI:</strong> For zero-latency studio recording.</li>
            <li><strong>Dual Headphone Jacks:</strong> Perfect for quiet practice or teacher-student sessions.</li>
            <li><strong>Aux In / Out:</strong> Connect to external amplifiers or play backing tracks through the hi-fi speakers.</li>
            <li><strong>Sustain Pedal Input:</strong> Compatible with all standard 1/4" pedals.</li>
        </ul>`
    },
    {
        id: '305',
        category: 'DreamPlay & Ordering',
        question: "What is the LED learning system?",
        answer: `<p>The DreamPlay One features an elegant strip of LEDs positioned directly above the keys. When connected to compatible learning apps via Bluetooth, these lights illuminate to guide you through songs and exercises.</p>
        <p>If you prefer a classic, distraction-free aesthetic, the LEDs can be completely toggled off with the press of a button.</p>`
    },
    {
        id: '306',
        category: 'DreamPlay & Ordering',
        question: "How does the 'No-Risk Guarantee' work?",
        answer: `<p>We are so confident in the ergonomic benefits of the DreamPlay One that we offer a <strong>90-Day Full Refund Policy</strong>.</p>
        <p>Once you receive your instrument, you have 90 days to test it in your own home. If you don't feel a massive improvement in your comfort and ability, you can return it for a 100% refund. We will even cover the return shipping costs. You risk nothing.</p>`
    },
    {
        id: '307',
        category: 'DreamPlay & Ordering',
        question: "Can I exchange my keyboard if I ordered the wrong size?",
        answer: `<p>Yes! If you order the DS6.0 and realize the DS5.5 would have been a better fit (or vice versa), simply contact our support team within your 90-day window. We will arrange a free exchange, covering the shipping costs both ways.</p>`
    },
    {
        id: '308',
        category: 'DreamPlay & Ordering',
        question: "When will my DreamPlay One ship?",
        answer: `<p>Our current target for the Founder's Batch delivery is <strong>October 2026</strong>. We have factored a 2-month buffer into our timeline to account for steel tooling complexities and global ocean freight logistics.</p>`
    },
    {
        id: '309',
        category: 'DreamPlay & Ordering',
        question: "How will I stay updated on manufacturing progress?",
        answer: `<p>We adhere strictly to the <strong>"Update Rule."</strong></p>
        <p>As a Founder's Batch backer, you will receive a detailed production update every single month, whether the news is good or bad. We will share photos of the steel molds, the first units rolling off the assembly line, and the boxes on the pallets. Total transparency.</p>`
    },
    {
        id: '310',
        category: 'DreamPlay & Ordering',
        question: "Do you ship internationally, and how much does it cost?",
        answer: `<p>Yes, we ship globally to over 50 countries. Shipping rates are highly subsidized:</p>
        <ul class="list-disc pl-6 space-y-2 mt-4">
            <li><strong>Main Zones (US, Canada, Europe):</strong> Usually under $40.</li>
            <li><strong>Extended Zones (Australia, Japan, etc.):</strong> Usually $50–$70.</li>
        </ul>
        <p class="mt-4"><em>Please note: International buyers are responsible for any local VAT, import duties, or customs fees collected by the carrier upon delivery.</em></p>`
    },
    {
        id: '311',
        category: 'DreamPlay & Ordering',
        question: "Are import duties and taxes included in the price?",
        answer: `<p>Because our pre-orders ship months in advance and global trade policies frequently update, standard import duties and local taxes (like VAT) are not included in your initial checkout price.</p>
        <p>We want to ensure you are charged the most accurate and fair rate at the time of delivery. Therefore, we utilize a <strong>Delivered Duty Paid (DDP)</strong> shipping method — meaning we prepay and handle all customs clearance on your behalf, so you never deal with a carrier demanding fees at your door. This applies to all shipping regions including the US, UK, EU, Australia, and Japan.</p>
        <p>Right before your instrument is ready to ship, we will calculate the active customs requirement and send you a secure invoice for any applicable taxes. We handle all the complex customs clearance on our end, ensuring your keyboard arrives straight to your door without any unexpected carrier brokerage fees or delays.</p>`
    },

    // ==========================================
    // CATEGORY 4: SEO — COMMON SEARCH QUESTIONS
    // ==========================================
    {
        id: '401',
        category: 'Common Questions',
        question: "Is a narrow keyboard better for small hands?",
        answer: `<p>Yes. A narrow keyboard, like the DreamPlay One, reduces the distance between notes. This allows pianists with small hands to play octaves and large chords without the strain that often leads to hands injury.</p>
        <p>On a standard 6.5-inch octave keyboard, pianists with small hands are forced into <strong>hyperabduction</strong> — a state of maximum stretch that destroys the natural arch of the hand. A narrow keyboard with a 5.5 or 6.0-inch octave eliminates this dangerous overextension entirely.</p>
        <p>Studies using surface electromyography (EMG) have confirmed a <strong>drastic reduction in muscle fatigue</strong> when small-handed pianists switch to narrower keys.</p>`
    },
    {
        id: '402',
        category: 'Common Questions',
        question: "What is the best kids piano for learning?",
        answer: `<p>Because children have naturally small hands, forcing them to learn on a standard piano can cause bad habits that are extremely difficult to unlearn later. A kids hands piano with narrow keys — like the DreamPlay One DS5.5 — allows them to learn proper technique from day one.</p>
        <p>The DS5.5 features a <strong>7/8ths size narrow keyboard</strong> specifically designed for smaller hands. Children can reach octaves comfortably, maintain a natural hand arch, and develop correct posture without straining.</p>
        <p>Unlike toy keyboards, the DreamPlay One is a full 88-key, graded hammer-action instrument with professional-grade touch dynamics. It's a real piano that fits smaller hands — not a compromise.</p>
        <p>As your child's hands grow, you can upgrade to the DS6.0 (15/16ths size) through our free trade-in program.</p>`
    },
];
